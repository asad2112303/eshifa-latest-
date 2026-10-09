import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryRateLimitStore, UpstashRateLimitStore } from "@/lib/rate-limit";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test("memory store allows max requests then blocks with a Retry-After", async () => {
  const store = new MemoryRateLimitStore();
  const policy = { max: 3, windowMs: 10_000 };
  for (let i = 0; i < 3; i++) assert.equal((await store.hit("ip:a", policy)).allowed, true);
  const blocked = await store.hit("ip:a", policy);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds >= 1 && blocked.retryAfterSeconds <= 10);
  // Another subject is unaffected.
  assert.equal((await store.hit("ip:b", policy)).allowed, true);
});

test("memory store forgets hits once the window has passed", async () => {
  const store = new MemoryRateLimitStore();
  const policy = { max: 1, windowMs: 60 };
  assert.equal((await store.hit("k", policy)).allowed, true);
  assert.equal((await store.hit("k", policy)).allowed, false);
  await sleep(80);
  assert.equal((await store.hit("k", policy)).allowed, true);
});

test("memory store keeps its key count bounded", async () => {
  const store = new MemoryRateLimitStore(50);
  const policy = { max: 5, windowMs: 60_000 };
  for (let i = 0; i < 500; i++) await store.hit(`k${i}`, policy);
  assert.ok(store["hits"].size <= 50);
});

function mockUpstash(responder) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return responder(JSON.parse(init.body));
  };
  return { calls, fetchImpl };
}

test("upstash store allows while the counter is within max and blocks past it", async () => {
  let count = 0;
  const { calls, fetchImpl } = mockUpstash(() => {
    count += 1;
    return Response.json([{ result: count }, { result: 1 }, { result: 4_500 }]);
  });
  const store = new UpstashRateLimitStore("https://redis.example", "tok", new MemoryRateLimitStore(), fetchImpl);
  const policy = { max: 2, windowMs: 10_000 };
  assert.equal((await store.hit("k", policy)).allowed, true);
  assert.equal((await store.hit("k", policy)).allowed, true);
  const blocked = await store.hit("k", policy);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 5);
  assert.equal(calls[0].init.headers.Authorization, "Bearer tok");
  assert.equal(JSON.parse(calls[0].init.body)[0][0], "INCR");
});

test("upstash store falls back to the local store when the service fails", async () => {
  const errors = [];
  const original = console.error;
  console.error = (line) => errors.push(line);
  try {
    const { fetchImpl } = mockUpstash(() => { throw new Error("connection refused"); });
    const fallback = new MemoryRateLimitStore();
    const store = new UpstashRateLimitStore("https://redis.example", "tok", fallback, fetchImpl);
    const policy = { max: 1, windowMs: 10_000 };
    assert.equal((await store.hit("k", policy)).allowed, true);
    assert.equal((await store.hit("k", policy)).allowed, false);
  } finally {
    console.error = original;
  }
  assert.ok(errors.some((line) => JSON.parse(line).event === "rate_limit_store_unavailable"));
});
