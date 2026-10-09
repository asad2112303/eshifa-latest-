import { test } from "node:test";
import assert from "node:assert/strict";
import { safeJsonLd } from "@/lib/safe-json-ld";

test("safeJsonLd cannot break out of a script element and round-trips", () => {
  const data = { name: "</script><script>alert(1)</script>", amp: "a&b", sep: "x y" };
  const out = safeJsonLd(data);
  assert.ok(!out.includes("<") && !out.includes(">") && !out.includes("&") && !out.includes(" "));
  assert.deepEqual(JSON.parse(out), data);
});
