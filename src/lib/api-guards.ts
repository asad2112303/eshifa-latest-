/**
 * The checks every JSON form endpoint runs before it reads a single field.
 *
 * Order matters and is deliberate: the flood limit comes first because it is
 * the cheapest check and the one that protects everything behind it; the body
 * is read last, and only once the request has earned it.
 */

import { enforceRateLimit } from "./rate-limit";
import {
  apiJson,
  clientIp,
  readJsonBody,
  rejectCrossSite,
  requestId,
  requireJson,
  tooManyRequests,
} from "./request-security";
import { logSecurityEvent } from "./security-log";
import type { RateLimitName } from "./security-config";

export type GuardedPost =
  | { ok: true; id: string; ip: string; body: Record<string, unknown> }
  | { ok: false; response: Response };

export interface GuardOptions {
  route: string;
  flood: RateLimitName;
  maxBodyBytes: number;
  floodMessage: string;
}

export async function guardJsonPost(request: Request, options: GuardOptions): Promise<GuardedPost> {
  const id = requestId(request.headers);
  const ip = clientIp(request.headers);
  const base = { requestId: id, route: options.route, ip };

  const flood = await enforceRateLimit(options.flood, ip);
  if (!flood.allowed) {
    logSecurityEvent("rate_limited", { ...base, status: 429, reason: options.flood });
    return { ok: false, response: tooManyRequests(options.floodMessage, flood.retryAfterSeconds) };
  }

  const crossSite = rejectCrossSite(request);
  if (!crossSite.ok) {
    logSecurityEvent("cross_site_rejected", { ...base, status: crossSite.status, reason: crossSite.reason });
    return { ok: false, response: apiJson({ ok: false, message: crossSite.message }, { status: crossSite.status }) };
  }

  const json = requireJson(request);
  if (!json.ok) {
    logSecurityEvent("unsupported_media_type", { ...base, status: json.status, reason: json.reason });
    return { ok: false, response: apiJson({ ok: false, message: json.message }, { status: json.status }) };
  }

  const body = await readJsonBody(request, options.maxBodyBytes);
  if (!body.ok) {
    logSecurityEvent("payload_rejected", { ...base, status: body.status, reason: body.reason });
    return { ok: false, response: apiJson({ ok: false, message: body.message }, { status: body.status }) };
  }

  return { ok: true, id, ip, body: body.body };
}

/** True when a Supabase error means the call was cut off by our own timeout. */
export function isAbortError(error: { message?: string; name?: string } | null | undefined): boolean {
  const text = `${error?.name ?? ""} ${error?.message ?? ""}`.toLowerCase();
  return text.includes("abort") || text.includes("timeout");
}
