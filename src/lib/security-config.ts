/**
 * Central security configuration.
 *
 * Every tunable the request pipeline uses lives here, so a limit can be changed
 * per environment without a code change. Each value has a safe default; the
 * matching environment variable overrides it only when it parses cleanly.
 *
 * Nothing in this file is secret. The one credential-like value, the health
 * check token, is read here but never logged or returned.
 */

export interface RateLimitPolicy {
  /** Requests accepted per window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

function parseInteger(name: string, fallback: number, minimum: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isInteger(value) && value >= minimum ? value : fallback;
}

const positiveInt = (name: string, fallback: number) => parseInteger(name, fallback, 1);
const nonNegativeInt = (name: string, fallback: number) => parseInteger(name, fallback, 0);

/** A rate-limit policy whose two numbers can each be overridden from the environment. */
function policy(prefix: string, max: number, windowMs: number): RateLimitPolicy {
  return {
    max: positiveInt(`${prefix}_MAX`, max),
    windowMs: positiveInt(`${prefix}_WINDOW_MS`, windowMs),
  };
}

const MINUTE = 60_000;

export const securityConfig = {
  isProduction: process.env.NODE_ENV === "production",

  /** Set by the platform on Vercel, where X-Forwarded-For is rewritten and cannot be spoofed. */
  onVercel: process.env.VERCEL === "1",

  /**
   * Number of reverse proxies in front of the app that append the client
   * address to X-Forwarded-For. 1 suits a single load balancer or nginx. Set 0
   * when the Node server is reached directly: then no header can be trusted,
   * the client address is reported as "unknown", and per-address limits
   * degrade to a single shared bucket rather than being spoofable.
   */
  trustedProxyHops: nonNegativeInt("TRUSTED_PROXY_HOPS", 1),

  /** Maximum JSON body accepted by each form endpoint, in bytes. */
  bodyLimits: {
    callback: positiveInt("CALLBACK_MAX_BODY_BYTES", 8 * 1024),
    partnership: positiveInt("PARTNERSHIP_MAX_BODY_BYTES", 16 * 1024),
  },

  /**
   * Per-client-address limits. "Submit" limits count accepted submissions, so a
   * visitor who mistypes a field is not locked out. "Flood" limits count every
   * request, valid or not, as a ceiling against automated abuse.
   */
  rateLimits: {
    callbackSubmit: policy("RATE_LIMIT_CALLBACK_SUBMIT", 3, 10 * MINUTE),
    callbackFlood: policy("RATE_LIMIT_CALLBACK_FLOOD", 40, 10 * MINUTE),
    partnershipSubmit: policy("RATE_LIMIT_PARTNERSHIP_SUBMIT", 3, 30 * MINUTE),
    partnershipFlood: policy("RATE_LIMIT_PARTNERSHIP_FLOOD", 40, 30 * MINUTE),
    /** Challenge issuance. Each wrong answer burns the challenge, so this also caps guesses. */
    captchaIssue: policy("RATE_LIMIT_CAPTCHA", 30, 10 * MINUTE),
    health: policy("RATE_LIMIT_HEALTH", 60, MINUTE),
  },

  /** Upper bound on a single database call from a request handler. */
  databaseTimeoutMs: positiveInt("DATABASE_TIMEOUT_MS", 8_000),

  /**
   * Bearer token that unlocks the configuration health check. Unset in
   * production means the check is switched off entirely (404), never open.
   */
  healthCheckToken: process.env.HEALTH_CHECK_TOKEN?.trim() || undefined,

  /**
   * Optional shared store so limits hold across serverless instances. Without
   * it the limiter is per instance; the database functions still enforce their
   * own per-phone and per-email throttles, which no client can bypass.
   */
  sharedRateLimitStore: {
    url: process.env.UPSTASH_REDIS_REST_URL?.trim() || undefined,
    token: process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || undefined,
  },
} as const;

export type RateLimitName = keyof typeof securityConfig.rateLimits;
