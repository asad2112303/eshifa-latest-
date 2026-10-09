/**
 * Security regression tests against a running server.
 *
 *   BASE_URL=http://localhost:23999 HEALTH_CHECK_TOKEN=... npm run test:security
 *
 * Every request uses an invalid or decoy payload, so nothing here can create a
 * database row or send an email: the controls under test all fire before the
 * database is reached. Each test that counts against a rate limit uses its own
 * client address via X-Forwarded-For, which the server trusts only because
 * TRUSTED_PROXY_HOPS defaults to 1 (on Vercel the platform rewrites it).
 */
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = (process.env.BASE_URL ?? "http://localhost:23999").replace(/\/$/, "");
const TOKEN = process.env.HEALTH_CHECK_TOKEN;
const ORIGIN = new URL(BASE).origin;

let ipCounter = 0;
const freshIp = () => `198.51.100.${(ipCounter++ % 250) + 1}`;

const api = (path, init = {}) =>
  fetch(BASE + path, {
    ...init,
    headers: { "x-forwarded-for": freshIp(), ...(init.headers ?? {}) },
    redirect: "manual",
  });

const jsonPost = (path, body, headers = {}) =>
  api(path, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

test("security headers are present on pages", async () => {
  const res = await api("/");
  assert.equal(res.status, 200);
  const csp = res.headers.get("content-security-policy") ?? "";
  for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-src 'none'"]) {
    assert.ok(csp.includes(directive), `CSP missing ${directive}`);
  }
  assert.ok(!csp.includes("unsafe-eval"), "production CSP must not allow eval");
  assert.match(res.headers.get("strict-transport-security") ?? "", /max-age=\d{6,}/);
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("cross-origin-opener-policy"), "same-origin");
  assert.equal(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(res.headers.get("permissions-policy") ?? "", /camera=\(\)/);
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("API responses are never cacheable", async () => {
  const res = await api("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.deepEqual(Object.keys(await res.json()).sort(), ["status", "timestamp"]);
});

test("config health check is gated by a bearer token and leaks no error text", async (t) => {
  if (!TOKEN) {
    t.skip("HEALTH_CHECK_TOKEN not set for this run");
    return;
  }
  const denied = await api("/api/health?check=config");
  assert.equal(denied.status, 401);
  assert.equal(denied.headers.get("www-authenticate"), 'Bearer realm="health"');

  const wrong = await api("/api/health?check=config", { headers: { authorization: `Bearer ${TOKEN}x` } });
  assert.equal(wrong.status, 401);

  const ok = await api("/api/health?check=config", { headers: { authorization: `Bearer ${TOKEN}` } });
  assert.ok([200, 503].includes(ok.status));
  const body = await ok.json();
  assert.ok(["ok", "function_missing", "unreachable", "not_checked"].includes(body.database), `unexpected database field ${body.database}`);
  assert.ok(!JSON.stringify(body).includes("unreachable:"), "raw error text must not be returned");
});

test("form endpoints refuse methods other than POST", async () => {
  for (const path of ["/api/callback-requests", "/api/partnership-requests"]) {
    assert.equal((await api(path)).status, 405, `GET ${path}`);
    assert.equal((await api(path, { method: "PUT" })).status, 405, `PUT ${path}`);
    assert.equal((await api(path, { method: "DELETE" })).status, 405, `DELETE ${path}`);
  }
  assert.equal((await api("/api/health", { method: "POST" })).status, 405);
});

test("form endpoints require a JSON content type", async () => {
  const res = await api("/api/callback-requests", {
    method: "POST",
    headers: { "content-type": "text/plain", origin: ORIGIN },
    body: '{"fullName":"x"}',
  });
  assert.equal(res.status, 415);
  const form = await api("/api/partnership-requests", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: ORIGIN },
    body: "fullName=x",
  });
  assert.equal(form.status, 415);
});

test("form endpoints reject cross-site browser requests", async () => {
  const evil = await jsonPost("/api/callback-requests", {}, { origin: "https://evil.example" });
  assert.equal(evil.status, 403);
  const fetchSite = await jsonPost("/api/partnership-requests", {}, { "sec-fetch-site": "cross-site" });
  assert.equal(fetchSite.status, 403);
  const nullOrigin = await jsonPost("/api/callback-requests", {}, { origin: "null" });
  assert.equal(nullOrigin.status, 403);
});

test("form endpoints cap the request body", async () => {
  const declared = await jsonPost("/api/callback-requests", JSON.stringify({ notes: "x".repeat(9000) }));
  assert.equal(declared.status, 413);
  const big = JSON.stringify({ message: "x".repeat(20_000) });
  const stream = new ReadableStream({
    start(c) {
      const bytes = new TextEncoder().encode(big);
      for (let i = 0; i < bytes.length; i += 4096) c.enqueue(bytes.slice(i, i + 4096));
      c.close();
    },
  });
  const chunked = await api("/api/partnership-requests", {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: stream,
    duplex: "half",
  });
  assert.equal(chunked.status, 413);
});

test("form endpoints reject malformed, non-object and prototype-polluting JSON", async () => {
  assert.equal((await jsonPost("/api/callback-requests", "{not json")).status, 400);
  assert.equal((await jsonPost("/api/callback-requests", "[1,2,3]")).status, 400);
  assert.equal((await jsonPost("/api/callback-requests", '{"__proto__":{"isAdmin":true}}')).status, 400);
  assert.equal((await jsonPost("/api/partnership-requests", '{"constructor":{"prototype":{}}}')).status, 400);
});

test("callback validation runs server-side and refuses injection-shaped input", async () => {
  const empty = await jsonPost("/api/callback-requests", {});
  assert.equal(empty.status, 422);
  const errors = (await empty.json()).errors;
  assert.ok(errors.fullName && errors.phone && errors.service);

  const injected = await jsonPost("/api/callback-requests", {
    fullName: "Ali", phone: "0300 1234567", service: "' OR 1=1 --", additionalNotes: "",
  });
  assert.equal(injected.status, 422);
  assert.ok((await injected.json()).errors.service);

  const scripted = await jsonPost("/api/callback-requests", {
    fullName: "<script>alert(1)</script>", phone: "0300 1234567", service: "Home Nursing Services",
    additionalNotes: "x".repeat(1001),
  });
  assert.equal(scripted.status, 422);
  assert.ok((await scripted.json()).errors.additionalNotes);
});

test("partnership honeypot answers like a success and stores nothing", async () => {
  const res = await jsonPost("/api/partnership-requests", { website: "http://spam.example", fullName: "Bot" });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, requestId: null });
});

test("partnership captcha is server-verified, single-use and HttpOnly", async () => {
  const issue = await api("/api/partnership-requests/captcha");
  assert.equal(issue.status, 200);
  assert.equal(issue.headers.get("cache-control"), "no-store");
  const setCookie = issue.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /httponly/i);
  assert.match(setCookie, /samesite=lax/i);
  assert.match(setCookie, /path=\//i);
  const issued = await issue.json();
  assert.match(issued.question, /^\d+ \+ \d+$/);
  // The answer is never in the response body, only in the HttpOnly cookie.
  assert.deepEqual(Object.keys(issued).sort(), ["expiresIn", "question"]);
  const cookie = setCookie.split(";")[0];

  const valid = {
    fullName: "Sara Ahmed", phone: "0301 2345678", email: "sara@example.com", country: "Pakistan",
    nationalId: "", shifaReference: "", mailingAddress: "", proposedLocation: "",
    message: "Security test, please ignore.", website: "", captchaAnswer: "0",
  };
  const missing = await jsonPost("/api/partnership-requests", valid);
  assert.equal(missing.status, 422);
  assert.ok((await missing.json()).errors.captcha, "no challenge cookie must fail");

  const wrong = await jsonPost("/api/partnership-requests", valid, { cookie });
  assert.equal(wrong.status, 422);
  assert.ok((await wrong.json()).errors.captcha, "wrong answer must fail");
  assert.match(wrong.headers.get("set-cookie") ?? "", /max-age=0/i, "a wrong answer must burn the challenge");
});

test("captcha issuance is rate limited per client address", async () => {
  const ip = freshIp();
  let last;
  for (let i = 0; i < 31; i++) last = await fetch(`${BASE}/api/partnership-requests/captcha`, { headers: { "x-forwarded-for": ip } });
  assert.equal(last.status, 429);
  assert.match(last.headers.get("retry-after") ?? "", /^\d+$/);
});

test("the flood limit returns 429 with Retry-After and does not affect other addresses", async () => {
  const ip = freshIp();
  let last;
  for (let i = 0; i < 41; i++) {
    last = await fetch(`${BASE}/api/callback-requests`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN, "x-forwarded-for": ip },
      body: "{not json",
    });
  }
  assert.equal(last.status, 429);
  assert.match(last.headers.get("retry-after") ?? "", /^\d+$/);
  assert.equal((await jsonPost("/api/callback-requests", "{not json")).status, 400);
});

test("sensitive paths and traversal attempts are not served", async () => {
  for (const path of ["/.env", "/.env.local", "/.git/HEAD", "/package.json", "/..%2f..%2fetc%2fpasswd", "/_next/../../.env"]) {
    const res = await api(path);
    assert.ok([400, 404].includes(res.status), `${path} returned ${res.status}`);
  }
});

test("the image optimiser refuses remote URLs", async () => {
  const res = await api("/_next/image?url=https%3A%2F%2Fexample.com%2Fx.png&w=64&q=75");
  assert.equal(res.status, 400);
  const internal = await api("/_next/image?url=http%3A%2F%2F169.254.169.254%2Flatest&w=64&q=75");
  assert.equal(internal.status, 400);
});
