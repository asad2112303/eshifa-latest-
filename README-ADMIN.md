# eShifa Callback Management System

Public visitors submit the **Request a Callback** form; the requests are stored
in Supabase and managed in a protected `/admin` portal.

```
Visitor → Request a Callback
        → POST /api/callback-requests   (validation + rate limiting, server-side)
        → submit_callback_request()     (SECURITY DEFINER, the only public write)
        → Supabase: callback_requests

Admin   → /admin/login → email + password from configuration
        → signed HttpOnly session cookie
        → /admin dashboard → view, call, WhatsApp, update status
```

Supabase is used as the **database only**. Admin sign-in does not involve
Supabase Auth, and there is one account rather than a staff directory.

---

## Setup

### 1. Run the migrations

Supabase Dashboard → **SQL Editor** → New query → paste and **Run**, in order:

| File | What it does |
|---|---|
| `0001_callback_management.sql` | Tables, indexes, triggers, RLS |
| `0002_single_admin.sql` | Removes the per-user machinery; locks the tables down |
| `0003_public_submit_function.sql` | The public form's write path |

### 2. Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
SUPABASE_SECRET_KEY=sb_secret_your-key
```

Both Supabase keys are under **Project Settings → API Keys**. Restart after editing.

### 3. Set the admin credentials

```bash
npm run set-admin-password
```

Prompts for the email and password, then writes `ADMIN_EMAIL`,
`ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` to `.env.local`.

You type the password at your own terminal with the echo suppressed, and only
its **scrypt hash** is written. `.env.local` never contains a usable password,
so a copy of it in a backup or a screen share does not hand over the portal.
Re-run the command at any time to change the password; it also rotates the
session secret, which signs out any existing session.

Restart the server, then sign in at `/admin/login`.

---

## Security notes

**Authorization is server-side.** Every `/api/admin/*` handler and the `/admin`
layout call `getAdminContext()` before touching data. Middleware only checks
that a cookie is *present* — it runs on the edge runtime and cannot verify the
HMAC — so a forged cookie passes middleware and is rejected immediately after.

**The session cookie is signed, HttpOnly and SameSite=Lax.** Its expiry lives
inside the signed payload, not only in the cookie's `maxAge`, so it cannot be
extended by editing the cookie. "Keep me signed in" chooses 30 days over 8 hours.

**The password is stored as an scrypt hash** (N=32768, r=8, p=1), compared in
constant time. A wrong email costs the same time as a wrong password, so timing
does not reveal which was wrong, and the error message never distinguishes them.

**Failed logins are slowed, not locked out.** With a single shared account,
lockout would be a free denial of service against the whole portal. The delay
grows ~400ms per failure up to 4s, which makes bulk guessing impractical.

**Row Level Security is on, with no policies at all.** No role reachable with
the publishable key can read, update or delete these tables. Admin reads use the
secret key server-side, only after the session cookie has been verified. The
public form writes through `submit_callback_request()`, which is SECURITY
DEFINER and can only append one row and return its number.

**The secret key must never be prefixed `NEXT_PUBLIC_`**, committed, or shared.
It bypasses RLS entirely.

**Submission throttling is in the database as well as the app.** The API route
limits per IP in memory; the function additionally rejects the same phone number
within 90 seconds, which survives restarts and works across instances.

**Privacy.** Callback rows contain patient names and phone numbers. Server logs
record error messages only, never the payload. Only the friendly `ESH-100001`
number is exposed publicly — never the internal UUID.

---

## Timestamps

Stored in UTC; displayed in **Asia/Karachi**. `contacted_at` and `completed_at`
are stamped by a database trigger when the status changes, so they cannot drift.

---

## Trade-off of the single-account model

One shared login means there is no per-person audit trail — the activity log
records the configured address for every action — and no way to revoke one
person's access without changing the password for everyone. If more than a
couple of people use the portal, that is worth revisiting.
