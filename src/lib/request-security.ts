/**
 * Request-level guards shared by every API route.
 *
 * Framework-agnostic on purpose: these take and return the standard Request and
 * Response types, so they can be unit tested in plain Node and reused outside
 * a Next route handler.
 */

import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { securityConfig } from "./security-config";

// ---------------------------------------------------------------------------
// Client address
// ---------------------------------------------------------------------------

const IP_SHAPE = /^[0-9a-fA-F:.]{3,45}$/;

function normalizeIp(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate || !IP_SHAPE.test(candidate)) return null;
  // An IPv4 address arriving as IPv4-mapped IPv6 must land in the same bucket.
  return candidate.replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i, "$1").toLowerCase();
}

export interface ClientIpOptions {
  trustedProxyHops?: number;
  onVercel?: boolean;
}

/**
 * The client address a rate limit can safely key on.
 *
 * X-Forwarded-For is a comma list that each proxy appends to, so the only
 * entries that can be trusted are the ones added by proxies we run. Counting
 * from the right by the configured hop count ignores anything the client put
 * in the header itself. On Vercel the platform rewrites the header with the
 * connecting address and discards client-supplied values, so the rightmost
 * entry is authoritative there regardless of configuration.
 */
export function clientIp(headers: Headers, options: ClientIpOptions = {}): string {
  const onVercel = options.onVercel ?? securityConfig.onVercel;
  const hops = options.trustedProxyHops ?? securityConfig.trustedProxyHops;

  const forwarded = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (onVercel) {
    return normalizeIp(forwarded.at(-1)) ?? normalizeIp(headers.get("x-real-ip")) ?? "unknown";
  }

  // Reached directly, with no proxy: every address header is attacker-controlled.
  if (hops === 0) return "unknown";

  if (forwarded.length >= hops) {
    return normalizeIp(forwarded[forwarded.length - hops]) ?? "unknown";
  }

  // Fewer entries than trusted hops: the proxy may set X-Real-IP instead.
  return normalizeIp(headers.get("x-real-ip")) ?? "unknown";
}

// ---------------------------------------------------------------------------
// Correlation id
// ---------------------------------------------------------------------------

const REQUEST_ID_SHAPE = /^[A-Za-z0-9:._-]{1,128}$/;

/** Platform request id when present and well-formed, otherwise a fresh UUID. */
export function requestId(headers: Headers): string {
  for (const name of ["x-vercel-id", "x-request-id"]) {
    const value = headers.get(name)?.trim();
    if (value && REQUEST_ID_SHAPE.test(value)) return value;
  }
  return randomUUID();
}

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

export type Gate = { ok: true } | { ok: false; status: number; reason: string; message: string };

const deny = (status: number, reason: string, message: string): Gate => ({ ok: false, status, reason, message });

function requestHost(headers: Headers): string | null {
  const raw = headers.get("x-forwarded-host") ?? headers.get("host");
  const host = raw?.split(",")[0]?.trim().toLowerCase();
  return host || null;
}

/**
 * Rejects browser requests that did not originate from this site.
 *
 * A cross-site HTML form can reach a JSON endpoint by abusing the text/plain
 * encoding, which is why the JSON content-type check in requireJson() exists;
 * this gate closes the remaining paths. Requests with no Origin header are
 * not from a browser page (curl, monitoring) and are allowed: there is no
 * victim in that case, and the rate limits still apply.
 */
export function rejectCrossSite(request: Request): Gate {
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite === "cross-site") {
    return deny(403, "cross_site", "This request must come from the eShifa website.");
  }

  const origin = request.headers.get("origin")?.trim();
  if (!origin) return { ok: true };
  if (origin === "null") return deny(403, "null_origin", "This request must come from the eShifa website.");

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return deny(403, "bad_origin", "This request must come from the eShifa website.");
  }

  const host = requestHost(request.headers);
  if (!host || originHost !== host) {
    return deny(403, "origin_mismatch", "This request must come from the eShifa website.");
  }
  return { ok: true };
}

/** The form endpoints speak JSON only. Anything else is refused before the body is read. */
export function requireJson(request: Request): Gate {
  const type = request.headers.get("content-type")?.trim().toLowerCase() ?? "";
  if (type === "application/json" || type.startsWith("application/json;")) return { ok: true };
  return deny(415, "unsupported_media_type", "Send the request as JSON.");
}

// ---------------------------------------------------------------------------
// Body
// ---------------------------------------------------------------------------

export type JsonBody =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: number; reason: string; message: string };

/** Keys that could poison object prototypes if the body were ever merged into another object. */
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const fail = (status: number, reason: string, message: string): JsonBody => ({ ok: false, status, reason, message });

/**
 * Reads a JSON object body with a hard byte ceiling.
 *
 * The ceiling is enforced while streaming, not after buffering, so an
 * oversized upload is cut off at the limit instead of being held in memory
 * first. Content-Length is checked up front as a cheap early exit, but a
 * missing or dishonest header cannot get past the streamed count.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBody> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return fail(413, "payload_too_large", "Request too large.");
  }

  const reader = request.body?.getReader();
  if (!reader) return fail(400, "empty_body", "Invalid request.");

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined);
      return fail(413, "payload_too_large", "Request too large.");
    }
    chunks.push(value);
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    return fail(400, "malformed_encoding", "Invalid request.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail(400, "malformed_json", "Invalid request.");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return fail(400, "not_an_object", "Invalid request.");
  }

  for (const key of Object.keys(parsed)) {
    if (FORBIDDEN_KEYS.has(key)) return fail(400, "forbidden_key", "Invalid request.");
  }

  return { ok: true, body: parsed as Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/** JSON response that no cache, shared or private, may keep. */
export function apiJson(data: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return Response.json(data, {
    status: init.status ?? 200,
    headers: { "Cache-Control": "no-store", ...init.headers },
  });
}

/** 429 with the Retry-After the client should honour. */
export function tooManyRequests(message: string, retryAfterSeconds: number): Response {
  return apiJson(
    { ok: false, message },
    { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))) } },
  );
}

// ---------------------------------------------------------------------------
// Secrets
// ---------------------------------------------------------------------------

/**
 * Constant-time comparison of a presented token against the expected one.
 * Both sides are hashed first so differing lengths leak nothing either.
 */
export function tokenMatches(presented: string | null | undefined, expected: string | null | undefined): boolean {
  if (!presented || !expected) return false;
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The bearer token from an Authorization header, if any. */
export function bearerToken(headers: Headers): string | null {
  const value = headers.get("authorization")?.trim();
  if (!value) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(value);
  return match ? match[1] : null;
}
