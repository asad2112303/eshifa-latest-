-- ===========================================================================
-- eShifa — partnership enquiries
-- Run in the Supabase SQL Editor AFTER 0001_setup.sql. Safe to re-run.
--
-- Same shape as callback_requests: Row Level Security on with no policies, and
-- one SECURITY DEFINER function as the sole public write path. Nothing reachable
-- with the publishable key can read these rows.
--
-- These enquiries contain names, phone numbers, email addresses and CNIC or
-- passport numbers. The CNIC in particular is a national identity number, so the
-- table is treated as at least as sensitive as the callback table.
-- ===========================================================================

create extension if not exists "pgcrypto";

do $$ begin
  create type public.partnership_status as enum ('new', 'contacted', 'in_progress', 'completed', 'declined');
exception when duplicate_object then null; end $$;

create sequence if not exists public.partnership_request_no_seq start with 500001;

create table if not exists public.partnership_requests (
  id                uuid primary key default gen_random_uuid(),
  request_no        bigint not null unique default nextval('public.partnership_request_no_seq'),
  full_name         text not null check (char_length(trim(full_name)) between 2 and 100),
  phone_number      text not null check (char_length(phone_number) between 8 and 20),
  email             text not null check (char_length(email) between 5 and 150),
  country           text not null default 'Pakistan' check (char_length(country) between 2 and 60),
  -- Optional on the form, so nullable here. A CNIC is 13 digits; a passport
  -- number is shorter and alphanumeric, so only a length bound is enforced.
  national_id       text check (char_length(national_id) <= 40),
  shifa_reference   text check (char_length(shifa_reference) <= 150),
  mailing_address   text check (char_length(mailing_address) <= 400),
  proposed_location text check (char_length(proposed_location) <= 300),
  message           text not null check (char_length(trim(message)) between 5 and 2000),
  status            public.partnership_status not null default 'new',
  source            text not null default 'website',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.partnership_requests is
  'Healthcare partnership enquiries. Sensitive: contains names, contact details and CNIC/passport numbers.';

create index if not exists partnership_requests_created_at_idx on public.partnership_requests (created_at desc);
create index if not exists partnership_requests_status_idx     on public.partnership_requests (status);
create index if not exists partnership_requests_email_idx      on public.partnership_requests (lower(email));

create or replace function public.touch_partnership_request()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists partnership_requests_touch on public.partnership_requests;
create trigger partnership_requests_touch
  before update on public.partnership_requests
  for each row execute function public.touch_partnership_request();

-- RLS on, no policies: anon and authenticated are denied everything.
alter table public.partnership_requests enable row level security;

-- ---------------------------------------------------------------------------
-- The one public write path.
-- ---------------------------------------------------------------------------
create or replace function public.submit_partnership_request(
  p_full_name         text,
  p_phone_number      text,
  p_email             text,
  p_country           text,
  p_message           text,
  p_national_id       text default null,
  p_shifa_reference   text default null,
  p_mailing_address   text default null,
  p_proposed_location text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name     text := btrim(p_full_name);
  v_phone    text := btrim(p_phone_number);
  v_email     text := lower(btrim(p_email));
  v_country  text := btrim(p_country);
  v_message  text := btrim(p_message);
  v_no       bigint;
begin
  -- Validated here as well as in the API route: PostgREST exposes this function
  -- directly, so the rules have to live where they cannot be skipped.
  if char_length(v_name) not between 2 and 100 then
    raise exception 'invalid_name' using hint = 'Name must be 2-100 characters.';
  end if;

  if v_phone !~ '^[0-9+][0-9 +()-]{7,19}$' then
    raise exception 'invalid_phone' using hint = 'Phone number is not valid.';
  end if;

  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_email' using hint = 'Email address is not valid.';
  end if;

  if char_length(v_country) not between 2 and 60 then
    raise exception 'invalid_country' using hint = 'Country is not valid.';
  end if;

  if char_length(v_message) not between 5 and 2000 then
    raise exception 'invalid_message' using hint = 'Message must be 5-2000 characters.';
  end if;

  -- Per-email throttle. The API route rate limits per IP, but that counter is
  -- in memory: it resets on deploy and is not shared between instances. This
  -- one survives both, and stops a double submit creating two enquiries the
  -- partnership team would have to reconcile.
  if exists (
    select 1 from public.partnership_requests
    where lower(email) = v_email
      and created_at > now() - interval '2 minutes'
  ) then
    raise exception 'duplicate_submission'
      using hint = 'An enquiry from this address was just received.';
  end if;

  if (select count(*) from public.partnership_requests
      where created_at > now() - interval '1 minute') > 30 then
    raise exception 'rate_limited' using hint = 'Too many requests right now.';
  end if;

  insert into public.partnership_requests (
    full_name, phone_number, email, country, message,
    national_id, shifa_reference, mailing_address, proposed_location, source
  )
  values (
    v_name, v_phone, v_email, v_country, v_message,
    nullif(btrim(coalesce(p_national_id, '')), ''),
    nullif(btrim(coalesce(p_shifa_reference, '')), ''),
    nullif(btrim(coalesce(p_mailing_address, '')), ''),
    nullif(btrim(coalesce(p_proposed_location, '')), ''),
    'website'
  )
  returning request_no into v_no;

  return v_no;
end;
$$;

revoke all on function public.submit_partnership_request(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_partnership_request(text, text, text, text, text, text, text, text, text) to anon, authenticated;

comment on function public.submit_partnership_request is
  'Sole public write path into partnership_requests. Validates, throttles per email address, returns the request number only.';
