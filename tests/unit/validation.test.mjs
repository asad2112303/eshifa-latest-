import { test } from "node:test";
import assert from "node:assert/strict";
import { clean, cleanMultiline, validateCallback, normalizePakistaniPhone } from "@/lib/callback-validation";
import { validatePartnership } from "@/lib/partnership-validation";
import { callbackServiceOptions } from "@/data/callback-services";

const good = { fullName: "Ali Khan", phone: "0300 1234567", service: callbackServiceOptions[0], additionalNotes: "" };

test("callback validation accepts a normal submission", () => {
  assert.deepEqual(validateCallback(good, callbackServiceOptions), {});
});

test("callback validation refuses injection-shaped and out-of-list service values", () => {
  for (const service of ["' OR 1=1 --", "Home Nursing Services; DROP TABLE x", "<script>alert(1)</script>", "../../etc/passwd", ""]) {
    assert.ok(validateCallback({ ...good, service }, callbackServiceOptions).service, `service "${service}" should be rejected`);
  }
});

test("callback validation bounds every field and demands a real Pakistani mobile number", () => {
  assert.ok(validateCallback({ ...good, fullName: "A".repeat(101) }, callbackServiceOptions).fullName);
  assert.ok(validateCallback({ ...good, additionalNotes: "n".repeat(1001) }, callbackServiceOptions).additionalNotes);
  for (const phone of ["12345", "+1 555 123 4567", "0300-12345678", "abc"]) {
    assert.ok(validateCallback({ ...good, phone }, callbackServiceOptions).phone, `phone "${phone}" should be rejected`);
  }
  assert.equal(normalizePakistaniPhone("+92 300 1234567"), "923001234567");
});

test("clean strips control characters that could forge headers, logs or spreadsheet rows", () => {
  assert.equal(clean("Ali\r\nBcc: victim@example.com"), "Ali Bcc: victim@example.com");
  assert.equal(clean("Ali\u0000\u001bKhan"), "Ali Khan");
  assert.equal(cleanMultiline("line1\r\n\n\n\n\nline2\t\t x"), "line1\n\nline2 x");
});

test("partnership validation rejects CRLF in the email and malformed CNICs", () => {
  const base = {
    fullName: "Sara Ahmed", phone: "0301 2345678", email: "sara@example.com", country: "Pakistan",
    nationalId: "", shifaReference: "", mailingAddress: "", proposedLocation: "", message: "We would like to partner.",
  };
  assert.deepEqual(validatePartnership(base), {});
  assert.ok(validatePartnership({ ...base, email: "sara@example.com\r\nbcc:x@y.z" }).email);
  assert.ok(validatePartnership({ ...base, email: "not-an-email" }).email);
  assert.ok(validatePartnership({ ...base, nationalId: "12345" }).nationalId);
  assert.equal(validatePartnership({ ...base, nationalId: "61101-1234567-1" }).nationalId, undefined);
  assert.ok(validatePartnership({ ...base, message: "m".repeat(2001) }).message);
});
