# Security implementation report

Date: 2026-10-09. Scope: the eShifa public website (this repository).
Standards used as the checklist: OWASP Top 10 (2021), OWASP API Security
Top 10 (2023), OWASP ASVS 5.0 levels 1 and 2 where applicable.

This document records what the application is, what was already protected,
what was changed, how each change was verified, what does not apply, and what
still needs work that can only be done outside this codebase.

---

## 1. What was analysed

| Area | Finding |
|---|---|
| Framework | Next.js 16 App Router, React 18, TypeScript, Tailwind. Deployed on Vercel. |
| Pages | 12 public marketing pages, all prerendered static except the patient guide (reads a query string) and the API routes. |
| API | `POST /api/callback-requests`, `POST /api/partnership-requests`, `GET /api/partnership-requests/captcha`, `GET /api/health`. Nothing else. |
| Data store | Supabase (Postgres). Two tables (`callback_requests`, `partnership_requests`), Row Level Security on with no policies, one `SECURITY DEFINER` insert function per table as the only write path. |
| Authentication | None in this app. There are no accounts, sessions, logins or roles. The admin portal is a separate application. |
| Third parties | Supabase (database), Resend (outbound email, optional), Google Fonts via `next/font` (self-hosted at build time, no runtime request). No analytics script is loaded. |
| Uploads, webhooks, GraphQL, WebSockets | None. |
| Secrets | `.env.local` (gitignored). History scan: no credential has ever been committed; only placeholders. |
| Personal data handled | Names, phone numbers, email addresses, free-text notes and, on the partnership form, an optional CNIC or passport number. Written to the database and emailed to the team inbox; never rendered back by this app. |

---

## 2. Controls that were already in place

These were verified rather than built:

- Server-side validation of every field with length bounds, a Pakistani
  mobile number rule, and an allow-list for the selectable service.
- Database writes only through `SECURITY DEFINER` functions with bound
  parameters. The functions re-validate input, throttle per phone number and
  per email address, enforce a global flood ceiling, and return only the
  friendly request number, never a row or uuid. No dynamic SQL anywhere.
- Row Level Security enabled with no policies, so the publishable key can
  read nothing, and no privileged key is used by any request path.
- Per-address flood and submission rate limits (in memory) on both forms.
- Request body size limits.
- A server-verified arithmetic challenge in an HttpOnly cookie, plus a
  honeypot field, on the partnership form.
- Control-character stripping on all text, HTML escaping in email templates,
  email sent through a JSON API so header injection is not possible.
- Responses expose only the friendly reference, and error messages are
  generic. Payloads are never logged.
- Security headers: CSP, HSTS with preload, `nosniff`, frame denial,
  Referrer-Policy, Permissions-Policy, `poweredByHeader` off.
- All `target="_blank"` links carry `rel="noopener"`; no `innerHTML`,
  `eval`, `postMessage`, `localStorage` or `document.cookie` use in the
  browser code; no reflected query parameters in markup.
- Secrets handled by an upload script that never prints values.

---

## 3. Vulnerabilities and gaps fixed

Severity follows CVSS-style impact for this application, not the generic
maximum.

### 3.1 Critical: known vulnerabilities in the framework

- **Component:** `next` 16.3.0, `sharp`, `source-map-js`.
- **Issue:** `npm audit` reported one critical and two high advisories,
  including cache poisoning of static pages, SSRF through the image optimiser,
  and information disclosure routes.
- **Fix:** `npm audit fix` within the existing semver ranges. `next` is now
  16.4.0. Wildcard (`*`) dependency ranges were replaced with caret ranges
  pinned to the installed versions so a future install cannot silently pull a
  different major.
- **Files:** `package.json`, `package-lock.json`.
- **Verification:** `npm audit --omit=dev --audit-level=high` passes with
  0 high/critical. Typecheck and production build pass. Route table unchanged.
- **Residual:** two moderate advisories remain in `@tailwindcss/typography`
  (a build-time dev dependency, never shipped to the browser or server at
  runtime). Fixing them requires a breaking major upgrade; tracked for a
  deliberate update rather than forced now.

### 3.2 Medium: health endpoint disclosed configuration and database errors

- **Component:** `GET /api/health?check=config`.
- **Issue:** Anyone could learn which environment variables were missing and
  read raw database error text (reconnaissance aid).
- **Fix:** The configuration check now requires `HEALTH_CHECK_TOKEN` as a
  bearer token, compared in constant time. In production with no token set it
  returns 404. Responses contain fixed category words only (`ok`,
  `function_missing`, `unreachable`, `not_checked`); the real error goes to the
  server log under the request id. The endpoint is rate limited.
- **Files:** `src/app/api/health/route.ts`, `src/lib/request-security.ts`.
- **Verification:** HTTP test 3 (401 without token, 401 with wrong token,
  category-only body with the right token). Manual check returned
  `database: "ok"`, proving the publishable-key write path is intact.

### 3.3 Medium: rate-limit identity could be spoofed on non-Vercel hosts

- **Component:** `clientKey()` in both form routes.
- **Issue:** The first `X-Forwarded-For` entry was used. Behind any proxy that
  appends rather than replaces, a client can prepend an arbitrary address and
  get a fresh rate-limit bucket per request.
- **Fix:** One `clientIp()` function. On Vercel (which rewrites the header and
  drops client values, per Vercel's documentation) the rightmost entry is used.
  Elsewhere the entry `TRUSTED_PROXY_HOPS` from the right is used; with 0 hops
  nothing is trusted and limits fall back to one shared bucket rather than
  being spoofable. Values are shape-checked and IPv4-mapped IPv6 is folded.
- **Files:** `src/lib/request-security.ts`, `src/lib/security-config.ts`.
- **Verification:** Unit tests cover Vercel, 1 and 2 hops, 0 hops, malformed
  values and mapped addresses.

### 3.4 Medium: JSON endpoints accepted cross-site browser submissions

- **Component:** both form routes.
- **Issue:** A cross-site HTML form using `enctype="text/plain"` can craft a
  body that parses as JSON. The endpoints are public, so the damage is limited
  to spending a victim's rate-limit budget and spam, but it is a hole.
- **Fix:** Form endpoints now require `Content-Type: application/json`
  (415 otherwise), reject `Sec-Fetch-Site: cross-site`, and reject any
  `Origin` whose host differs from the request host (403). Requests with no
  `Origin` (non-browser clients) are allowed and still rate limited.
- **Files:** `src/lib/request-security.ts`, `src/lib/api-guards.ts`.
- **Verification:** Unit tests for every branch; HTTP tests 5 and 6.

### 3.5 Medium: request bodies were buffered in full before the size check

- **Component:** both form routes.
- **Issue:** `request.text()` read the entire body before comparing its length,
  so a large upload was held in memory before rejection.
- **Fix:** `readJsonBody()` checks `Content-Length` first, then streams with a
  hard byte ceiling and cancels the stream the moment it is exceeded. It also
  rejects invalid UTF-8, non-object JSON, and top-level `__proto__`,
  `constructor` and `prototype` keys.
- **Files:** `src/lib/request-security.ts`.
- **Verification:** Unit tests with declared and chunked oversize bodies; HTTP
  tests 7 and 8.

### 3.6 Low: privileged database credential present in the website environment

- **Component:** `src/lib/supabase/{env,server,client}.ts`, `.env.example`,
  `scripts/push-env-to-vercel.sh`.
- **Issue:** The website shipped code to construct a service-role client
  (bypasses RLS) and its deployment script pushed `SUPABASE_SECRET_KEY` and
  the admin portal's credentials to the website's Vercel project, although no
  website code path uses them. Least privilege says a public site should not
  hold a key that can read every patient record.
- **Fix:** Removed the service-role client, the secret-key accessor and the
  unused browser client. The env template and push script now carry only what
  the website needs. **Pending (needs dashboard access):** delete
  `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`,
  `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` from the website's Vercel
  project and rotate the Supabase secret key, since it has been distributed
  to an environment that does not need it.
- **Verification:** `grep` confirms no reference remains in `src/`; typecheck
  and build pass.

### 3.7 Low: two independent copies of the security headers

- **Component:** `next.config.mjs` and `vercel.json`.
- **Issue:** Both emitted a Content-Security-Policy. Browsers intersect
  multiple CSP headers, so any future change made in one place would be
  silently blocked by the stale copy.
- **Fix:** `next.config.mjs` is the single source; `vercel.json` keeps only
  CDN cache rules.
- **Verification:** HTTP test 1 asserts the directives on the served page.

### 3.8 Low: structured data serialised with plain `JSON.stringify`

- **Component:** JSON-LD `<script>` blocks in the root layout and service pages.
- **Issue:** A value containing `</script>` would terminate the element. The
  values are static today; the sink was unguarded.
- **Fix:** `safeJsonLd()` escapes `<`, `>`, `&` and the U+2028/9 separators as
  JSON unicode escapes, and all three usages go through one `JsonLd`
  component, so the sink is audited once.
- **Files:** `src/lib/safe-json-ld.ts`, `src/components/seo/json-ld.tsx`.
- **Verification:** Unit test (cannot break out, round-trips). Semgrep reports
  zero findings after the change.

### 3.9 Low: captcha answer could be retried until the cookie expired

- **Component:** partnership captcha.
- **Issue:** A wrong answer left the challenge cookie valid for 30 minutes, so
  the 37 possible sums could be enumerated against one challenge.
- **Fix:** A wrong answer burns the challenge (cookie expired in the 422
  response), so every guess costs a new issuance, and issuance is rate
  limited (30 per 10 minutes per address). In production the cookie uses the
  `__Host-` prefix, so it must be Secure, site-wide and domain-less.
- **Files:** `src/lib/captcha.ts`, both partnership routes.
- **Verification:** HTTP tests 11 and 12.

### 3.10 Low: no timeout on database calls, no function duration cap

- **Fix:** Every Supabase call carries an `AbortSignal` of
  `DATABASE_TIMEOUT_MS` (default 8 s) and answers 503 with `Retry-After` on
  timeout; each route declares `maxDuration`. Email already had a 10 s timeout.
- **Verification:** Typecheck; build; code review. A forced timeout was not
  exercised against the live database.

### 3.11 Info: no structured security logging or correlation ids

- **Fix:** `logSecurityEvent()` writes one JSON line per event with a closed
  field set (event, request id, route, masked address, status, reason, field
  names, scrubbed detail). Addresses are masked, free text is stripped of
  control characters, email addresses and long digit runs, and there is no
  field that could carry a payload. Request ids come from `x-vercel-id` or
  `x-request-id` when well-formed, otherwise a UUID, and are returned on the
  health check. Events: rate limits, cross-site rejections, media-type and
  payload rejections, validation failures (field names only), honeypot hits,
  captcha failures, submissions, duplicates, database rejections, errors,
  timeouts, missing configuration, email failures, health check denials.
- **Verification:** Unit tests for masking, scrubbing and the emitted line;
  the production server log during the HTTP run shows the expected entries.

### 3.12 Info: no security checks in the development workflow

- **Fix:** `.github/workflows/security.yml` runs on push, pull request and
  weekly: typecheck, unit tests, `npm audit` (fails on high/critical),
  production build, the HTTP security suite against the built server, Semgrep
  (OWASP Top 10, TypeScript, React, Node, secrets rulesets) and Gitleaks over
  the full history. Every action and the Semgrep image are pinned to a commit
  hash or digest. `.github/dependabot.yml` opens weekly update pull requests
  for npm and for the pinned actions.
- **Verification:** The same scans were run locally in containers (section 5).
  The workflow itself has not yet run on GitHub, because that requires pushing
  it.

### 3.13 Low: header set incomplete

- **Fix:** Added `Cross-Origin-Opener-Policy: same-origin`,
  `Cross-Origin-Resource-Policy: same-origin`,
  `X-Permitted-Cross-Domain-Policies: none`, CSP `frame-src 'none'`,
  `worker-src 'self'`, `manifest-src 'self'`, `media-src 'self'`, a wider
  Permissions-Policy (payment, USB, bluetooth, sensors, display capture,
  topics), `Cache-Control: no-store` on every `/api/*` response, and
  `images.remotePatterns: []` stated explicitly.
- **Verification:** HTTP tests 1, 2 and 15.

---

## 4. Centralised configuration

All limits live in `src/lib/security-config.ts` and can be overridden per
environment. Defaults:

| Variable | Default | Purpose |
|---|---|---|
| `RATE_LIMIT_CALLBACK_SUBMIT_MAX` / `_WINDOW_MS` | 3 / 600000 | Accepted callback submissions per address |
| `RATE_LIMIT_CALLBACK_FLOOD_MAX` / `_WINDOW_MS` | 40 / 600000 | Any callback request per address |
| `RATE_LIMIT_PARTNERSHIP_SUBMIT_MAX` / `_WINDOW_MS` | 3 / 1800000 | Accepted partnership submissions per address |
| `RATE_LIMIT_PARTNERSHIP_FLOOD_MAX` / `_WINDOW_MS` | 40 / 1800000 | Any partnership request per address |
| `RATE_LIMIT_CAPTCHA_MAX` / `_WINDOW_MS` | 30 / 600000 | Challenge issuances (and therefore guesses) per address |
| `RATE_LIMIT_HEALTH_MAX` / `_WINDOW_MS` | 60 / 60000 | Health probes per address |
| `CALLBACK_MAX_BODY_BYTES` | 8192 | Callback body ceiling |
| `PARTNERSHIP_MAX_BODY_BYTES` | 16384 | Partnership body ceiling |
| `DATABASE_TIMEOUT_MS` | 8000 | Per-call database timeout |
| `TRUSTED_PROXY_HOPS` | 1 | Proxies trusted to append `X-Forwarded-For` |
| `HEALTH_CHECK_TOKEN` | unset | Bearer token for the config health check |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | unset | Shared rate-limit store across instances |

Rate limiting answers 429 with a `Retry-After` header. Without the shared
store the limiter is per serverless instance; the database functions keep
their own per-phone, per-email and global throttles regardless, so the
durable guarantee does not depend on it. The Upstash adapter fails open to the
local store and logs `rate_limit_store_unavailable` if Redis is unreachable.

---

## 5. Verification results

| Check | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm test` (unit, 27 tests) | 27 pass, 0 fail |
| `npm run build` | Pass. Route table unchanged: all marketing pages still static or SSG, API routes dynamic |
| `npm run test:security` (HTTP, 15 tests, against `next start` of the production build) | 15 pass, 0 fail |
| `npm audit --omit=dev --audit-level=high` | 0 high, 0 critical (2 moderate in a dev-only dependency, see 3.1) |
| Semgrep (`p/owasp-top-ten`, `p/typescript`, `p/react`, `p/nodejs`, `p/secrets`; 142 rules, 91 files) | 0 findings, 0 parse errors |
| Gitleaks (full git history, 1.19 MB scanned) | 0 leaks |
| OWASP ZAP baseline (passive) against the production build | 445 URLs, 64 checks passed, 0 failures, 3 warnings: CSP `unsafe-inline` for scripts and styles (accepted, see section 10), Cross-Origin-Embedder-Policy absent (accepted, see section 10), and an informational note that hashed static assets are cacheable (intended: they are immutable) |
| Health check with token against the real database | `database: "ok"` |

What the HTTP suite proves, each from the outside with no UI involved:
security headers on pages and `no-store` on the API; the token gate and
category-only health output; 405 on wrong methods; 415 on non-JSON; 403 on
cross-site origin, null origin and `Sec-Fetch-Site: cross-site`; 413 on
declared and on chunked oversize bodies; 400 on malformed, non-object and
prototype-polluting JSON; 422 with field errors on empty and
injection-shaped input; honeypot answered as success; captcha HttpOnly,
answer absent from the body, failure without a cookie, failure and burn on a
wrong answer; 429 with `Retry-After` on captcha issuance and on the flood
limit, with another address unaffected; dotfiles, `package.json` and
traversal paths not served; the image optimiser refusing remote and
link-local URLs.

Regression: the build passes and emits the same route table; no page
component, style or form markup was changed except the JSON-LD element, whose
output is byte-identical for the current static values. The forms' client
code was not modified; the API contracts (status codes, `errors` shape,
`requestId`, `duplicate`) are unchanged, and the tests above exercise them.
What was deliberately **not** run: a real end-to-end submission, because the
only database available is the production one and a valid request would
create a real callback row and email the team. The write path itself was
proven by the health check's validation-error probe.

---

## 6. Not applicable to this application

Recorded so the gaps are known to be deliberate, not missed.

- Login, signup, password hashing, password policy, breach checks, password
  reset, OTP, sessions, session fixation, JWT, refresh tokens, MFA, account
  recovery, re-authentication: there are no accounts. The admin portal is a
  separate application and must implement these itself.
- Object-level and function-level authorisation, IDOR/BOLA, mass assignment,
  tenant isolation: there are no readable objects; the only operations are two
  inserts through functions that accept fixed named parameters.
- File uploads, archive handling, malware scanning, signed download URLs: no
  uploads exist.
- Webhooks, replay signatures, idempotency keys: no webhooks. Double submits
  are absorbed by the database throttles (90 s per phone, 2 min per email),
  which is the idempotency this app needs.
- SQL/NoSQL/LDAP/XML/XXE/template/command injection, path traversal, file
  inclusion, deserialisation: no query building, no shell, no XML, no
  templates, no file system access from input, JSON only.
- SSRF: the only outbound requests are to a fixed Resend URL and the
  configured Supabase URL; the image optimiser allows no remote patterns.
- GraphQL, WebSockets, CORS: none configured, and no CORS header is sent, so
  browsers cannot read these endpoints cross-origin.
- Database users, TLS to the database, encryption at rest, backups: managed
  by Supabase; see section 8 for what to switch on there.

---

## 7. Deployment configuration

**Vercel (website project)**

1. Add `HEALTH_CHECK_TOKEN` (32 random bytes, base64url) to Production and
   Preview, marked Sensitive.
2. Remove `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` from this project. They belong
   to the admin portal only.
3. Optional: create an Upstash Redis database and set
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` so rate limits are
   shared across function instances.
4. Redeploy. `scripts/push-env-to-vercel.sh` now uploads exactly the website's
   variables and nothing privileged.
5. Confirm: `curl -H "Authorization: Bearer $HEALTH_CHECK_TOKEN" https://<domain>/api/health?check=config`
   returns `"database":"ok"`, and `curl -I https://<domain>/` shows the
   headers from section 3.13.

**Self-hosted Node (if ever used instead of Vercel)**

- Terminate TLS at a reverse proxy; set `TRUSTED_PROXY_HOPS` to the number of
  proxies that append `X-Forwarded-For` (usually 1). Set it to 0 if Node is
  exposed directly, and accept that per-address limits then collapse to one
  bucket.
- Run as a non-root user, behind a firewall that exposes only 443, with the
  proxy enforcing a request body limit and connection timeouts.

**GitHub**

- Push the workflow; it runs on the next push. Enable branch protection on
  `main` requiring the `Security` checks, enable secret scanning with push
  protection, and enable Dependabot alerts. These are repository settings and
  cannot be set from the codebase.

---

## 8. Pending items that need infrastructure access

Clearly outside what this repository can change:

| Item | Where | Why |
|---|---|---|
| Rotate the Supabase secret key and remove it from the website's env | Supabase dashboard, Vercel | It was distributed to an environment that never needed it |
| Enable Supabase network restrictions (allow Vercel egress only) and confirm SSL enforcement | Supabase dashboard | Limits where the database can be reached from |
| Enable point-in-time recovery or daily backups and test one restore | Supabase dashboard | Backup and restore verification |
| Set a data retention policy and a scheduled purge of callback and partnership rows older than the agreed period | Supabase (SQL schedule) and management decision | Data minimisation for patient contact details and CNIC numbers |
| Verify the sending domain, SPF, DKIM and DMARC for the `EMAIL_FROM` address | Resend and DNS | Email spoofing resistance and deliverability |
| Submit the domain to the HSTS preload list; add CAA records; enable DNSSEC if the registrar supports it | DNS registrar | Transport security at the DNS layer |
| Turn on Vercel's Web Application Firewall and Attack Challenge mode for `/api/*` | Vercel dashboard | Upstream bot and DDoS mitigation |
| Configure a log drain and alerts on `rate_limited`, `cross_site_rejected`, `database_error`, `not_configured` and `health_check_denied` | Vercel Observability or a log provider | Monitoring and alerting on the events now emitted |
| Branch protection, required checks, secret-scanning push protection | GitHub settings | Protected deployments |

---

## 9. Production security checklist

- [ ] `npm run audit` clean on the commit being deployed.
- [ ] CI `Security` workflow green.
- [ ] `HEALTH_CHECK_TOKEN` set; `/api/health?check=config` returns 401 without it.
- [ ] No privileged Supabase or admin variable in the website project.
- [ ] `curl -I` on the production domain shows CSP, HSTS, COOP, CORP, `nosniff`, `X-Frame-Options: DENY`, Permissions-Policy, no `x-powered-by`.
- [ ] `curl -X POST -H 'Origin: https://evil.example' -H 'Content-Type: application/json' -d '{}' https://<domain>/api/callback-requests` returns 403.
- [ ] A real submission from the website still succeeds (manual, one row, then mark it cancelled in the admin portal).
- [ ] Log drain shows `submission_created` for that test and masked addresses only.
- [ ] Supabase: RLS on, no policies, both functions present, secret key rotated.
- [ ] Email domain verified with SPF, DKIM, DMARC.

---

## 10. Remaining risks and recommended follow-ups

1. **CSP allows inline scripts** (`'unsafe-inline'` in `script-src`). Next.js
   hydrates with per-page inline scripts that cannot be hash-listed; the
   alternative, a per-request nonce, forces every page to render on demand
   and lose static generation and CDN caching, which this site relies on. The
   exposure is small: the site renders no user-supplied content and reflects
   no query parameters into markup, so there is no injection point for the
   policy to catch. Revisit if a page ever renders stored or third-party
   content, or if Next's hash-based SRI support leaves experimental status.
2. **In-memory rate limiting is per instance** until Upstash is configured.
   Serverless scale-out multiplies the effective limit by the number of warm
   instances. The database throttles still hold.
3. **The arithmetic captcha is weak by design.** It stops bulk spam, not a
   human-driven or OCR-capable attacker. If spam rises, add a managed
   challenge (Cloudflare Turnstile or Vercel's Attack Challenge) in front of
   `/api/partnership-requests`.
4. **Two moderate advisories in a dev-only dependency** (section 3.1) await a
   major upgrade of the Tailwind typography plugin.
5. **No end-to-end test of a real submission** was run here (section 5). Run
   the manual checklist item after deploying.
6. **Email contents carry personal data** to the team inbox. That inbox and
   the Resend account are now part of the data boundary; apply MFA to both.
7. **Retention**: nothing deletes old submissions. Agree a period and schedule
   the purge (section 8).
8. **No Cross-Origin-Embedder-Policy header.** ZAP flags its absence as Low.
   Setting it to `require-corp` would make the pages cross-origin isolated,
   which this site has no feature that needs, and would break any future
   third-party embed that lacks CORS or CORP headers. The opener and resource
   policies that matter for isolation are set. Add it only if a feature that
   requires cross-origin isolation (such as `SharedArrayBuffer`) is ever added.

---

## 11. Running the checks

```bash
npm run typecheck
npm test                      # unit tests, no server needed
npm run audit                 # production dependencies, high/critical fails
npm run build
HEALTH_CHECK_TOKEN=dev-token npx next start -p 23999 &
BASE_URL=http://localhost:23999 HEALTH_CHECK_TOKEN=dev-token npm run test:security

# Scanners, in containers (no local install needed):
docker run --rm -v "$PWD:/src:ro" semgrep/semgrep semgrep scan \
  --config p/owasp-top-ten --config p/typescript --config p/react --config p/nodejs --config p/secrets \
  --exclude node_modules --exclude .next --metrics=off --error /src
docker run --rm -v "$PWD:/repo:ro" zricethezav/gitleaks:latest detect --source /repo --config /repo/.gitleaks.toml --redact
docker run --rm ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://host.docker.internal:23999 -I
```
