import { test } from "node:test";
import assert from "node:assert/strict";
import {
  bearerToken,
  clientIp,
  readJsonBody,
  rejectCrossSite,
  requireJson,
  tokenMatches,
} from "@/lib/request-security";

const h = (pairs) => new Headers(pairs);

test("clientIp on Vercel takes the rightmost forwarded entry (platform-written) and ignores client junk", () => {
  assert.equal(clientIp(h({ "x-forwarded-for": "1.1.1.1, 203.0.113.9" }), { onVercel: true }), "203.0.113.9");
  assert.equal(clientIp(h({ "x-forwarded-for": "203.0.113.9" }), { onVercel: true }), "203.0.113.9");
  assert.equal(clientIp(h({ "x-real-ip": "203.0.113.5" }), { onVercel: true }), "203.0.113.5");
});

test("clientIp behind one trusted proxy ignores a spoofed leading entry", () => {
  const headers = h({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" });
  assert.equal(clientIp(headers, { onVercel: false, trustedProxyHops: 1 }), "203.0.113.9");
  assert.equal(clientIp(headers, { onVercel: false, trustedProxyHops: 2 }), "6.6.6.6");
});

test("clientIp with zero trusted hops trusts nothing", () => {
  assert.equal(clientIp(h({ "x-forwarded-for": "6.6.6.6", "x-real-ip": "6.6.6.6" }), { onVercel: false, trustedProxyHops: 0 }), "unknown");
});

test("clientIp rejects malformed values and folds IPv4-mapped IPv6", () => {
  assert.equal(clientIp(h({ "x-forwarded-for": "not an ip; DROP TABLE" }), { onVercel: false, trustedProxyHops: 1 }), "unknown");
  assert.equal(clientIp(h({ "x-forwarded-for": "::ffff:203.0.113.9" }), { onVercel: false, trustedProxyHops: 1 }), "203.0.113.9");
  assert.equal(clientIp(h({}), { onVercel: false, trustedProxyHops: 1 }), "unknown");
});

const post = (headers) => new Request("https://eshifa.org/api/x", { method: "POST", headers });

test("rejectCrossSite allows same-origin and non-browser requests", () => {
  assert.equal(rejectCrossSite(post({ host: "eshifa.org", origin: "https://eshifa.org" })).ok, true);
  assert.equal(rejectCrossSite(post({ host: "eshifa.org" })).ok, true);
  assert.equal(rejectCrossSite(post({ "x-forwarded-host": "eshifa.org", host: "internal:3000", origin: "https://eshifa.org", "sec-fetch-site": "same-origin" })).ok, true);
});

test("rejectCrossSite denies cross-site origins, null origins and Sec-Fetch-Site: cross-site", () => {
  const mismatch = rejectCrossSite(post({ host: "eshifa.org", origin: "https://evil.example" }));
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.status, 403);
  assert.equal(mismatch.reason, "origin_mismatch");
  assert.equal(rejectCrossSite(post({ host: "eshifa.org", origin: "null" })).reason, "null_origin");
  assert.equal(rejectCrossSite(post({ host: "eshifa.org", origin: "https://eshifa.org", "sec-fetch-site": "cross-site" })).reason, "cross_site");
  assert.equal(rejectCrossSite(post({ host: "eshifa.org", origin: "garbage" })).reason, "bad_origin");
});

test("requireJson accepts JSON media types only", () => {
  assert.equal(requireJson(post({ "content-type": "application/json" })).ok, true);
  assert.equal(requireJson(post({ "content-type": "application/json; charset=utf-8" })).ok, true);
  assert.equal(requireJson(post({ "content-type": "text/plain" })).status, 415);
  assert.equal(requireJson(post({ "content-type": "application/x-www-form-urlencoded" })).status, 415);
  assert.equal(requireJson(post({})).status, 415);
});

const jsonRequest = (body, headers = {}) =>
  new Request("https://eshifa.org/api/x", { method: "POST", headers: { "content-type": "application/json", ...headers }, body });

test("readJsonBody returns a plain object within the limit", async () => {
  const result = await readJsonBody(jsonRequest('{"fullName":"Ali"}'), 1024);
  assert.deepEqual(result, { ok: true, body: { fullName: "Ali" } });
});

test("readJsonBody enforces the byte ceiling from Content-Length and from the stream", async () => {
  const big = JSON.stringify({ notes: "x".repeat(2000) });
  const declared = await readJsonBody(jsonRequest(big, { "content-length": String(big.length) }), 1024);
  assert.equal(declared.status, 413);

  // A chunked body with no Content-Length must still be cut off at the limit.
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(big.slice(0, 1000)));
      controller.enqueue(new TextEncoder().encode(big.slice(1000)));
      controller.close();
    },
  });
  const streamed = await readJsonBody(
    new Request("https://eshifa.org/api/x", { method: "POST", headers: { "content-type": "application/json" }, body: stream, duplex: "half" }),
    1024,
  );
  assert.equal(streamed.status, 413);
});

test("readJsonBody rejects malformed, non-object and prototype-polluting bodies", async () => {
  assert.equal((await readJsonBody(jsonRequest("{not json"), 1024)).status, 400);
  assert.equal((await readJsonBody(jsonRequest("[1,2]"), 1024)).status, 400);
  assert.equal((await readJsonBody(jsonRequest("null"), 1024)).status, 400);
  assert.equal((await readJsonBody(jsonRequest('"string"'), 1024)).status, 400);
  const polluted = await readJsonBody(jsonRequest('{"__proto__":{"admin":true}}'), 1024);
  assert.equal(polluted.status, 400);
  assert.equal(polluted.reason, "forbidden_key");
  assert.equal((await readJsonBody(jsonRequest('{"constructor":{}}'), 1024)).reason, "forbidden_key");
  assert.equal(({}).admin, undefined);
});

test("readJsonBody rejects invalid UTF-8", async () => {
  const bytes = new Uint8Array([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xff, 0xfe, 0x22, 0x7d]);
  assert.equal((await readJsonBody(jsonRequest(bytes), 1024)).reason, "malformed_encoding");
});

test("tokenMatches compares in constant time and never matches empty values", () => {
  assert.equal(tokenMatches("secret-token", "secret-token"), true);
  assert.equal(tokenMatches("secret-tokeN", "secret-token"), false);
  assert.equal(tokenMatches("", "secret-token"), false);
  assert.equal(tokenMatches("secret-token", undefined), false);
  assert.equal(tokenMatches(null, null), false);
});

test("bearerToken parses the Authorization header strictly", () => {
  assert.equal(bearerToken(h({ authorization: "Bearer abc.def" })), "abc.def");
  assert.equal(bearerToken(h({ authorization: "bearer abc" })), "abc");
  assert.equal(bearerToken(h({ authorization: "Basic abc" })), null);
  assert.equal(bearerToken(h({})), null);
});
