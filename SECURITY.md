# Security

## Reporting a vulnerability

Please email **info@eshifa.org** with the subject line `Security report`.
Include the URL or endpoint, the steps to reproduce, and what you observed.
Do not open a public issue for a vulnerability, and do not test against real
patient data or the production forms beyond what is needed to demonstrate the
problem. We will acknowledge reports within three working days.

## What this application is

The eShifa website is a public marketing site with two forms (a callback
request and a partnership enquiry). It has no user accounts, no sessions, no
file uploads and no administrative interface; the admin portal is a separate
application. The website holds no privileged credential: form submissions are
written through single-purpose database functions using a browser-safe key,
and nothing in this codebase can read a submitted record back.

## Controls in place

- Server-side validation of every field, with allow-lists for selectable values.
- JSON-only form endpoints that reject cross-site browser requests and bodies
  over a fixed size, read with a streamed byte ceiling.
- Layered rate limiting: per-address flood and submission limits in the app
  (configurable, optionally backed by a shared Redis store) plus per-phone and
  per-email throttles inside the database functions.
- A server-verified, single-use, HttpOnly arithmetic challenge and a honeypot
  on the partnership form.
- Database writes only through `SECURITY DEFINER` functions with bound
  parameters; Row Level Security on with no policies, so the public key can
  read nothing.
- Strict HTTP security headers including Content Security Policy, HSTS,
  frame denial, cross-origin isolation and a locked-down Permissions-Policy.
- Structured security logging with request correlation ids and no personal
  data, and an operator-only health check behind a bearer token.
- Dependency auditing, static analysis and secret scanning in CI, with every
  action pinned to a commit hash.

The full implementation report, including what was fixed, what was verified
and what remains, is in [docs/SECURITY.md](docs/SECURITY.md).
