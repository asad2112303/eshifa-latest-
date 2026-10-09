/**
 * Structured security logging.
 *
 * One JSON object per line, so the platform log drain can index on `event`
 * and `requestId`. The field set is closed on purpose: there is nowhere to put
 * a request body, a name, a phone number or a cookie, which is how patient
 * details stay out of the logs. Free text goes through scrub() and is capped.
 */

export type SecurityEvent =
  | "rate_limited"
  | "cross_site_rejected"
  | "unsupported_media_type"
  | "payload_rejected"
  | "validation_failed"
  | "honeypot_triggered"
  | "captcha_failed"
  | "submission_created"
  | "duplicate_submission"
  | "database_rejected"
  | "database_error"
  | "database_timeout"
  | "not_configured"
  | "email_failed"
  | "health_check_denied"
  | "health_check_degraded";

export interface SecurityLogFields {
  requestId: string;
  route: string;
  /** Client address. Masked before it is written. */
  ip?: string;
  status?: number;
  /** Machine-readable cause, e.g. "origin_mismatch". */
  reason?: string;
  /** Names of the fields that failed validation, never their values. */
  fields?: string[];
  /** Short free text, scrubbed of control characters, email addresses and long digit runs. */
  detail?: string;
}

type Level = "info" | "warn" | "error";

/** Keeps enough of an address to spot a pattern, not enough to identify a person. */
export function maskIp(ip: string): string {
  if (ip === "unknown") return ip;
  if (ip.includes(".")) return ip.replace(/\.\d{1,3}$/, ".x");
  if (ip.includes(":")) return ip.split(":").slice(0, 3).join(":") + "::x";
  return "masked";
}

/** Strips anything that could forge a log line or identify a person. */
export function scrub(text: string): string {
  return text
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/\d{7,}/g, "[digits]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

export function logSecurityEvent(event: SecurityEvent, fields: SecurityLogFields, level: Level = "warn"): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    requestId: fields.requestId,
    route: fields.route,
    ...(fields.ip ? { ip: maskIp(fields.ip) } : {}),
    ...(fields.status !== undefined ? { status: fields.status } : {}),
    ...(fields.reason ? { reason: fields.reason } : {}),
    ...(fields.fields?.length ? { fields: fields.fields } : {}),
    ...(fields.detail ? { detail: scrub(fields.detail) } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
