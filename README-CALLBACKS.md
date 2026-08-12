# Callback requests → Google Sheets

The "Request a Callback" form posts to `POST /api/callback`, which validates the
request server-side and appends a row to a Google Sheet.

**Target sheet:** https://docs.google.com/spreadsheets/d/1umT4Q3fnry0xlYrJ6JqJEWkVvd6qeu8ccIGuGDmdb9g/edit

Columns written: `Created At · Full Name · Phone · Service · Additional Notes · Source`
(the header row is created automatically on the first submission).

---

## One-time setup

Submissions will fail until these four steps are done. Until then the form shows
"We could not save your request. Please call us on 051-111-111-567" — it never
falsely reports success.

### 1. Create a Google Cloud project and enable the API

1. Go to https://console.cloud.google.com/
2. Create a project (or pick an existing one)
3. **APIs & Services → Library → "Google Sheets API" → Enable**

### 2. Create a service account

1. **APIs & Services → Credentials → Create credentials → Service account**
2. Name it e.g. `eshifa-callbacks`, then **Create and continue → Done**
3. Open the service account → **Keys → Add key → Create new key → JSON**
4. A `.json` file downloads. It contains `client_email` and `private_key`.

**Treat that file as a password.** Do not commit it, email it, or paste it into
a chat. You only need two values from it.

### 3. Share the sheet with the service account

This is the step people miss. Open the spreadsheet, click **Share**, and add the
service account's `client_email` (looks like
`eshifa-callbacks@your-project.iam.gserviceaccount.com`) with **Editor** access.

Without this the API returns a permission error even with valid credentials.

### 4. Set environment variables

Locally, create `.env.local` (gitignored):

```bash
GOOGLE_SHEETS_ID=1umT4Q3fnry0xlYrJ6JqJEWkVvd6qeu8ccIGuGDmdb9g
GOOGLE_SHEETS_TAB=Sheet1
GOOGLE_SERVICE_ACCOUNT_EMAIL=eshifa-callbacks@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

`GOOGLE_PRIVATE_KEY` must keep its `\n` escapes and be wrapped in double quotes.
Copy the `private_key` value from the JSON exactly as it appears.

In production (Vercel): **Project → Settings → Environment Variables**, add the
same four. Paste the private key as a single line with `\n` escapes intact.
Redeploy afterwards — environment changes are not picked up by a running build.

---

## Verifying

```bash
npm run dev
```

```bash
curl -X POST http://localhost:22421/api/callback \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","phone":"03001234567","service":"Home Nursing Services","additionalNotes":"Test"}'
```

`{"ok":true}` means a row was appended — check the sheet. Any other response is
explained in the server logs (the visitor never sees internal detail).

---

## Behaviour worth knowing

**Validation runs on the server as well as the client.** Client-side checks are a
convenience and are trivially bypassed, so `/api/callback` re-validates every
request and rejects anything invalid with `422`.

**The service field is an allow-list.** Only the exact service names in
`src/data/callback-services.ts` are accepted, so a crafted request cannot write
arbitrary text into the sheet.

**Formula injection is blocked.** A value beginning with `=`, `+`, `-` or `@`
is prefixed with an apostrophe so Sheets and Excel store it as text rather than
evaluating it. Values are written with `valueInputOption: RAW`.

**Rate limiting.** 5 submissions per IP per 10 minutes, in-memory. That resets on
restart and is per-instance — enough to blunt casual spam, but if you run
multiple instances or need stronger guarantees, move it to a shared store.

**Analytics.** A `callback_request` event fires on success with only
`selected_service`, `page` and `source`. No name, phone or notes are ever sent to
analytics. The event is a no-op until an analytics provider is installed.

**Privacy.** The sheet holds patient contact details. Restrict sharing to staff
who need it, and prefer a Shared Drive with managed access over personal
ownership.
