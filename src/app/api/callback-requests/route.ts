import { createServerSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/server";
import {
  validateCallback,
  clean,
  cleanMultiline,
  normalizePakistaniPhone,
  LIMITS,
} from "@/lib/callback-validation";
import { callbackServiceOptions } from "@/data/callback-services";
import { formatRequestNo } from "@/lib/supabase/types";
import { notifyTeamOfCallbackRequest } from "@/lib/notifications";
import { securityConfig } from "@/lib/security-config";
import { enforceRateLimit } from "@/lib/rate-limit";
import { apiJson, tooManyRequests } from "@/lib/request-security";
import { guardJsonPost, isAbortError } from "@/lib/api-guards";
import { logSecurityEvent } from "@/lib/security-log";

/** Writes to the database, so never statically optimised. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Database call plus the team email, each with its own shorter timeout. */
export const maxDuration = 30;

const ROUTE = "/api/callback-requests";
const UAN = "051-111-111-567";

/**
 * Two limits, because they defend against different things.
 *
 * Charging rejected input to the submission limit punishes the wrong person: a
 * patient who mistypes their phone number three times would be locked out for
 * ten minutes without a single request ever reaching the database. So malformed
 * input only counts towards the flood ceiling (charged in guardJsonPost), and
 * the strict limit is charged once the request is known to be genuine.
 *
 * The durable guard is the per-phone-number throttle inside
 * submit_callback_request(), which no client can bypass.
 */
export async function POST(request: Request) {
  const guarded = await guardJsonPost(request, {
    route: ROUTE,
    flood: "callbackFlood",
    maxBodyBytes: securityConfig.bodyLimits.callback,
    floodMessage: `Too many requests. Please try again shortly, or call us on ${UAN}.`,
  });
  if (!guarded.ok) return guarded.response;
  const { id, ip, body } = guarded;
  const log = { requestId: id, route: ROUTE, ip };

  try {
    const candidate = {
      fullName: String(body.fullName ?? "").slice(0, LIMITS.fullName * 2),
      phone: String(body.phone ?? "").slice(0, LIMITS.phone * 2),
      service: String(body.service ?? "").slice(0, LIMITS.service * 2),
      additionalNotes: String(body.additionalNotes ?? "").slice(0, LIMITS.additionalNotes * 2),
    };

    // Server-side validation. The client's checks are a convenience only.
    const errors = validateCallback(candidate, callbackServiceOptions);
    if (Object.keys(errors).length > 0) {
      logSecurityEvent("validation_failed", { ...log, status: 422, fields: Object.keys(errors) }, "info");
      return apiJson({ ok: false, errors }, { status: 422 });
    }

    // Input is valid, so this is a real submission attempt — charge it here.
    const submit = await enforceRateLimit("callbackSubmit", ip);
    if (!submit.allowed) {
      logSecurityEvent("rate_limited", { ...log, status: 429, reason: "callbackSubmit" });
      return tooManyRequests(`Too many requests. Please try again shortly, or call us on ${UAN}.`, submit.retryAfterSeconds);
    }

    // Store the normalised international form (923001234567) so dialling and
    // WhatsApp links are built from one canonical value.
    const normalizedPhone = normalizePakistaniPhone(candidate.phone);

    // Insert through a SECURITY DEFINER function rather than a privileged key.
    // The publishable key used here can do nothing else: it cannot read, update
    // or delete callback_requests, so a leak of it exposes no patient data.
    // Arguments are bound as parameters, never concatenated into SQL.
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .rpc("submit_callback_request", {
        p_full_name: clean(candidate.fullName),
        p_phone_number: normalizedPhone ?? clean(candidate.phone),
        p_service: clean(candidate.service),
        p_additional_notes: cleanMultiline(candidate.additionalNotes) || null,
      })
      .abortSignal(AbortSignal.timeout(securityConfig.databaseTimeoutMs));

    if (error) {
      // The function raises named exceptions for input it refuses. A repeat
      // submission is the user's own request arriving twice, so it is reported
      // as success — resubmitting should not look like a failure to them.
      if (error.message.includes("duplicate_submission")) {
        logSecurityEvent("duplicate_submission", { ...log, status: 200 }, "info");
        // 200, not 201: an earlier request from this number is already
        // recorded, so nothing new was created.
        return apiJson({ ok: true, requestId: null, duplicate: true });
      }

      const invalidField = (
        [
          ["invalid_name", "fullName", "Please check the name entered."],
          ["invalid_phone", "phone", "Enter a valid Pakistani mobile number, e.g. 0300 1234567."],
          ["invalid_service", "service", "Please select a valid service."],
          ["invalid_notes", "additionalNotes", "Please shorten your notes."],
        ] as const
      ).find(([code]) => error.message.includes(code));

      if (invalidField) {
        const [code, field, message] = invalidField;
        logSecurityEvent("database_rejected", { ...log, status: 422, reason: code, fields: [field] });
        return apiJson({ ok: false, errors: { [field]: message } }, { status: 422 });
      }

      if (error.message.includes("rate_limited")) {
        logSecurityEvent("rate_limited", { ...log, status: 429, reason: "database_flood_ceiling" });
        return tooManyRequests("We are receiving a lot of requests. Please try again in a moment.", 60);
      }

      if (isAbortError(error)) {
        logSecurityEvent("database_timeout", { ...log, status: 503 }, "error");
        return apiJson(
          { ok: false, message: `Our booking system is slow to respond. Please try again, or call us on ${UAN}.` },
          { status: 503, headers: { "Retry-After": "30" } },
        );
      }
      throw error;
    }

    const reference = formatRequestNo(data as number);

    // The ESH- number is the ticket reference. There is no message to the
    // patient: this form collects a phone number and no email address.
    const mail = await notifyTeamOfCallbackRequest({
      reference,
      fullName: clean(candidate.fullName),
      phone: normalizedPhone ?? clean(candidate.phone),
      service: clean(candidate.service),
      notes: cleanMultiline(candidate.additionalNotes) || null,
    });
    if (!mail.sent && mail.reason !== "not_configured" && mail.reason !== "no_team_inbox") {
      logSecurityEvent("email_failed", { ...log, reason: mail.reason }, "error");
    }

    logSecurityEvent("submission_created", { ...log, status: 201 }, "info");

    // 201: a record was created. Only the friendly number is returned — never
    // the internal uuid, which would let anyone enumerate other requests.
    return apiJson({ ok: true, requestId: reference }, { status: 201 });
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      // A deployment problem, not a visitor problem. Distinguishing it means a
      // misconfigured environment is diagnosable from the log instead of
      // looking identical to a database fault.
      logSecurityEvent("not_configured", { ...log, status: 503, detail: error.message }, "error");
      return apiJson(
        {
          ok: false,
          message: `Our booking system is temporarily unavailable. Please call us on ${UAN}.`,
          code: "not_configured",
        },
        { status: 503 },
      );
    }
    // Log without echoing the submitted payload: it contains patient details.
    logSecurityEvent("database_error", { ...log, status: 500, detail: error instanceof Error ? error.message : "unknown" }, "error");
    return apiJson({ ok: false, message: `We could not save your request. Please call us on ${UAN}.` }, { status: 500 });
  }
}
