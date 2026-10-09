/**
 * Centralised rate limiting.
 *
 * Every endpoint takes its limits from securityConfig and charges them through
 * enforceRateLimit(), so a policy change is one line in one place. The store
 * is pluggable: an in-memory sliding window by default, or a shared Redis
 * counter (Upstash REST) when configured, so limits hold across instances.
 */

import { securityConfig, type RateLimitName, type RateLimitPolicy } from "./security-config";

export interface RateLimitResult {
  allowed: boolean;
  /** Accepted requests still available in the current window. */
  remaining: number;
  /** Seconds until the next request would be accepted. 0 when allowed. */
  retryAfterSeconds: number;
}

export interface RateLimitStore {
  hit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult>;
}

// ---------------------------------------------------------------------------
// In-memory sliding window
// ---------------------------------------------------------------------------

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly hits = new Map<string, number[]>();
  private readonly maxKeys: number;

  constructor(maxKeys = 10_000) {
    this.maxKeys = maxKeys;
  }

  async hit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    const now = Date.now();
    const recent = (this.hits.get(key) ?? []).filter((at) => now - at < policy.windowMs);

    if (recent.length >= policy.max) {
      this.hits.set(key, recent);
      const retryAfterMs = recent[0] + policy.windowMs - now;
      return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
    }

    recent.push(now);
    this.hits.set(key, recent);
    this.evictIfCrowded(now);
    return { allowed: true, remaining: policy.max - recent.length, retryAfterSeconds: 0 };
  }

  /** Keeps memory bounded: drop idle keys first, then the oldest-touched ones. */
  private evictIfCrowded(now: number) {
    if (this.hits.size <= this.maxKeys) return;
    for (const [key, times] of this.hits) {
      const last = times[times.length - 1] ?? 0;
      if (now - last > 60 * 60 * 1000) this.hits.delete(key);
    }
    for (const key of this.hits.keys()) {
      if (this.hits.size <= this.maxKeys) break;
      this.hits.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Shared fixed window on Redis (Upstash REST API)
// ---------------------------------------------------------------------------

export class UpstashRateLimitStore implements RateLimitStore {
  private readonly url: string;
  private readonly token: string;
  private readonly fallback: RateLimitStore;
  private readonly fetchImpl: typeof fetch;

  constructor(url: string, token: string, fallback: RateLimitStore, fetchImpl: typeof fetch = fetch) {
    this.url = url;
    this.token = token;
    this.fallback = fallback;
    this.fetchImpl = fetchImpl;
  }

  async hit(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    const windowIndex = Math.floor(Date.now() / policy.windowMs);
    const redisKey = `rl:${key}:${windowIndex}`;

    try {
      const response = await this.fetchImpl(`${this.url.replace(/\/$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["PEXPIRE", redisKey, String(policy.windowMs), "NX"],
          ["PTTL", redisKey],
        ]),
        signal: AbortSignal.timeout(2_000),
      });
      if (!response.ok) throw new Error(`store responded ${response.status}`);

      const rows = (await response.json()) as Array<{ result?: unknown; error?: string }>;
      const count = Number(rows[0]?.result);
      const ttlMs = Number(rows[2]?.result);
      if (!Number.isFinite(count)) throw new Error("store returned no count");

      const allowed = count <= policy.max;
      return {
        allowed,
        remaining: Math.max(0, policy.max - count),
        retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((ttlMs > 0 ? ttlMs : policy.windowMs) / 1000)),
      };
    } catch (error) {
      // Fail open to the local store rather than take the forms down: the
      // database functions keep their own throttles regardless.
      console.error(
        JSON.stringify({
          ts: new Date().toISOString(),
          level: "error",
          event: "rate_limit_store_unavailable",
          detail: error instanceof Error ? error.message.slice(0, 200) : "unknown",
        }),
      );
      return this.fallback.hit(key, policy);
    }
  }
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

let store: RateLimitStore | undefined;

export function getRateLimitStore(): RateLimitStore {
  if (store) return store;
  const memory = new MemoryRateLimitStore();
  const { url, token } = securityConfig.sharedRateLimitStore;
  store = url && token ? new UpstashRateLimitStore(url, token, memory) : memory;
  return store;
}

/** Charges one request against the named policy for the given subject (usually a client address). */
export function enforceRateLimit(name: RateLimitName, subject: string): Promise<RateLimitResult> {
  return getRateLimitStore().hit(`${name}:${subject}`, securityConfig.rateLimits[name]);
}
