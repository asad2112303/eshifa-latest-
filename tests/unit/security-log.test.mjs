import { test } from "node:test";
import assert from "node:assert/strict";
import { logSecurityEvent, maskIp, scrub } from "@/lib/security-log";

test("maskIp hides the host part of an address", () => {
  assert.equal(maskIp("203.0.113.42"), "203.0.113.x");
  assert.equal(maskIp("2001:db8:85a3:0:0:8a2e:370:7334"), "2001:db8:85a3::x");
  assert.equal(maskIp("unknown"), "unknown");
});

test("scrub removes log-forging control characters and personal identifiers", () => {
  const text = "line1\r\nFAKE LOG ENTRY user=ali@example.com phone=03001234567 cnic=6110112345671";
  const out = scrub(text);
  assert.ok(!out.includes("\n") && !out.includes("\r"));
  assert.ok(!out.includes("ali@example.com"));
  assert.ok(!out.includes("03001234567"));
  assert.ok(out.includes("[email]") && out.includes("[digits]"));
  assert.ok(scrub("x".repeat(1000)).length <= 300);
});

test("logSecurityEvent writes one JSON line with a masked address and no free-form payload", () => {
  const lines = [];
  const original = console.warn;
  console.warn = (line) => lines.push(line);
  try {
    logSecurityEvent("rate_limited", {
      requestId: "req-1",
      route: "/api/x",
      ip: "203.0.113.42",
      status: 429,
      reason: "flood",
      detail: "contact ali@example.com\nnow",
    });
  } finally {
    console.warn = original;
  }
  assert.equal(lines.length, 1);
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.event, "rate_limited");
  assert.equal(entry.ip, "203.0.113.x");
  assert.equal(entry.requestId, "req-1");
  assert.ok(!lines[0].includes("ali@example.com"));
  assert.ok(typeof entry.ts === "string");
});
