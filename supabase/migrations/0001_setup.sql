-- ===========================================================================
-- eShifa — Callback Management System
--
-- Run this ONCE in the Supabase SQL Editor. It is safe to re-run: every step
-- either checks for existence first or drops and recreates.
--
-- Model
--   * The public form is the only writer, and it writes through one function.
--   * The admin portal does not use Supabase Auth. It signs in against an email
--     and password held in the application's environment, and reads these
--     tables server-side with the secret key.
--   * Therefore NO policy is defined: nothing reachable with the publishable
--     key can read, update or delete. That is deliberate, not an omission.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Clean up anything from an earlier layout.
--
-- CASCADE on the function drops is what matters: RLS policies depend on these
-- functions, and Postgres refuses a plain DROP while a policy references them.
-- ---------------------------------------------------------------------------
drop function if exists public.is_active_staff() cascade;
drop function if exists public.is_super_admin() cascade;
drop function if exists public.handle_new_user() cascade;
drop table    if exists public.profiles cascade;

-- ---------------------------------------------------------------------------
-- Status enum
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.callback_status as enum ('new', 'contacted', 'in_progress', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- callback_requests
-- request_no drives the human-readable id (ESH-100001); the uuid stays the PK.
-- ---------------------------------------------------------------------------
create sequence if not exists public.callback_request_no_seq start with 100001;

create table if not exists public.callback_requests (
  id               uuid primary key default gen_random_uuid(),
  request_no       bigint not null unique default nextval('public.callback_request_no_seq'),
  full_name        text not null check (char_length(trim(full_name)) between 2 and 100),
  phone_number     text not null check (char_length(phone_number) between 8 and 20),
  service          text not null check (char_length(service) between 2 and 80),
  additional_notes text check (char_length(additional_notes) <= 1000),
  status           public.callback_status not null default 'new',
  source           text not null default 'website',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  contacted_at     timestamptz,
  completed_at     timestamptz
);

-- Drop the column an earlier version added, if this is a re-run.
alter table public.callback_requests drop column if exists assigned_to;

comment on table public.callback_requests is
  'Patient callback requests. Sensitive: contains names and phone numbers.';

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------
create table if not exists public.callback_request_activity (
  id                  uuid primary key default gen_random_uuid(),
  callback_request_id uuid not null references public.callback_requests (id) on delete cascade,
  actor_email         text,
  action              text not null,
  old_value           text,
  new_value           text,
  created_at          timestamptz not null default now()
);

alter table public.callback_request_activity drop column if exists admin_user_id;
alter table public.callback_request_activity add column if not exists actor_email text;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists callback_requests_created_at_idx    on public.callback_requests (created_at desc);
create index if not exists callback_requests_status_idx        on public.callback_requests (status);
create index if not exists callback_requests_phone_idx         on public.callback_requests (phone_number);
create index if not exists callback_requests_service_idx       on public.callback_requests (service);
create index if not exists callback_requests_request_no_idx    on public.callback_requests (request_no);
-- Supports the dashboard's default "newest first, filtered by status" query.
create index if not exists callback_requests_status_created_idx on public.callback_requests (status, created_at desc);
create index if not exists activity_request_idx                on public.callback_request_activity (callback_request_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Keep updated_at fresh, and stamp status transition times exactly once.
create or replace function public.touch_callback_request()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();

  if new.status is distinct from old.status then
    if new.status = 'contacted' and new.contacted_at is null then
      new.contacted_at := now();
    end if;
    if new.status = 'completed' and new.completed_at is null then
      new.completed_at := now();
    end if;
  end if;

  return new;
end; $$;

drop trigger if exists callback_requests_touch on public.callback_requests;
create trigger callback_requests_touch
  before update on public.callback_requests
  for each row execute function public.touch_callback_request();

-- Every request gets a first timeline entry automatically.
create or replace function public.log_callback_created()
returns trigger language plpgsql as $$
begin
  insert into public.callback_request_activity (callback_request_id, action, new_value)
  values (new.id, 'request_created', new.status::text);
  return new;
end; $$;

drop trigger if exists callback_requests_log_created on public.callback_requests;
create trigger callback_requests_log_created
  after insert on public.callback_requests
  for each row execute function public.log_callback_created();

-- ---------------------------------------------------------------------------
-- Row Level Security: ON, with no policies.
--
-- No policy means no access for anon or authenticated — the strictest possible
-- setting. The admin portal reads with the secret key, which bypasses RLS by
-- design and is only ever used after its session cookie has been verified.
-- ---------------------------------------------------------------------------
alter table public.callback_requests         enable row level security;
alter table public.callback_request_activity enable row level security;

-- ---------------------------------------------------------------------------
-- The one public write path.
--
-- SECURITY DEFINER, so it can insert despite there being no INSERT policy.
-- It can do exactly this and nothing else: it cannot read, update or delete,
-- and it returns only the friendly request number, never the row or its uuid.
-- ---------------------------------------------------------------------------
create or replace function public.submit_callback_request(
  p_full_name        text,
  p_phone_number     text,
  p_service          text,
  p_additional_notes text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_full_name  text := btrim(p_full_name);
  v_phone      text := btrim(p_phone_number);
  v_service    text := btrim(p_service);
  v_notes      text := nullif(btrim(coalesce(p_additional_notes, '')), '');
  v_request_no bigint;
begin
  -- Validated here as well as in the API route: PostgREST exposes this function
  -- directly, so the rules have to live where they cannot be skipped.
  if char_length(v_full_name) not between 2 and 100 then
    raise exception 'invalid_name' using hint = 'Name must be 2-100 characters.';
  end if;

  if v_phone !~ '^[0-9+][0-9 +()-]{7,19}$' then
    raise exception 'invalid_phone' using hint = 'Phone number is not valid.';
  end if;

  if char_length(v_service) not between 2 and 80 then
    raise exception 'invalid_service' using hint = 'Service is not valid.';
  end if;

  if v_notes is not null and char_length(v_notes) > 1000 then
    raise exception 'invalid_notes' using hint = 'Notes are too long.';
  end if;

  -- Per-number throttle. The API route rate limits per IP, but that counter is
  -- in memory: it resets on deploy and is not shared between instances. This
  -- guard survives both, and stops a double submit creating two rows the call
  -- centre would have to reconcile.
  if exists (
    select 1 from public.callback_requests
    where phone_number = v_phone
      and created_at > now() - interval '90 seconds'
  ) then
    raise exception 'duplicate_submission'
      using hint = 'A request from this number was just received.';
  end if;

  -- Coarse flood ceiling, well above any plausible real burst.
  if (select count(*) from public.callback_requests
      where created_at > now() - interval '1 minute') > 60 then
    raise exception 'rate_limited' using hint = 'Too many requests right now.';
  end if;

  insert into public.callback_requests (full_name, phone_number, service, additional_notes, source)
  values (v_full_name, v_phone, v_service, v_notes, 'website')
  returning request_no into v_request_no;

  return v_request_no;
end;
$$;

-- Grant to exactly the two roles that need it. `public` would implicitly
-- include future roles, which is not what we want for a writer.
revoke all on function public.submit_callback_request(text, text, text, text) from public;
grant execute on function public.submit_callback_request(text, text, text, text) to anon, authenticated;

comment on function public.submit_callback_request is
  'Sole public write path into callback_requests. Validates, throttles per phone number, returns the request number only.';
