import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/server";
import { clean, cleanMultiline, normalizePakistaniPhone } from "@/lib/callback-validation";
import { PARTNERSHIP_LIMITS, validatePartnership } from "@/lib/partnership-validation";
import { CAPTCHA_COOKIE, captchaCookieOptions } from "@/lib/captcha";
import { notifyTeamOfPartnershipEnquiry, sendPartnershipThankYou } from "@/lib/notifications";
import { securityConfig } from "@/lib/security-config";
import { enforceRateLimit } from "@/lib/rate-limit";
import { apiJson, tooManyRequests } from "@/lib/request-security";
import { guardJsonPost, isAbortError } from "@/lib/api-guards";
import { logSecurityEvent } from "@/lib/security-log";

/** Writes to the database, so never statically optimised. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
/** Database call plus two emails, each with its own shorter timeout. */
export const maxDuration = 30;

const ROUTE = "/api/partnership-requests";
const UAN = "051-111-111-567";

const str = (value: unknown, limit: number) => String(value ?? "").slice(0, limit * 2);

/** Expires the challenge cookie so an answer can be used at most once. */
function burnChallenge(response: NextResponse): NextResponse {
  response.cookies.set(CAPTCHA_COOKIE, "", { ...captchaCookieOptions, maxAge: 0 });
  return response;
}

/**
 * Two limits, for two different problems.
 *
 * Charging rejected input to the submission limit punishes the wrong person: an
 * applicant who mistypes their email three times would be locked out without a
 * single enquiry reaching the database. Malformed input counts only towards the
 * flood ceiling (charged in guardJsonPost); the strict limit is charged once
 * the input is known to be good.
 *
 * The durable guard is the per-email throttle inside
 * submit_partnership_request(), which no client can bypass.
 */
export async function POST(request: Request) {
  const guarded = await guardJsonPost(request, {
    route: ROUTE,
    flood: "partnershipFlood",
    maxBodyBytes: securityConfig.bodyLimits.partnership,
    floodMessage: `Too many requests. Please try again later, or call us on ${UAN}.`,
  });
  if (!guarded.ok) return guarded.response;
  const { id, ip, body } = guarded;
  const log = { requestId: id, route: ROUTE, ip };

  try {
    // A hidden field no human ever fills in. Bots that complete every input give
    // themselves away. Answered exactly like a success so they learn nothing.
    if (clean(String(body.website ?? ""))) {
      logSecurityEvent("honeypot_triggered", { ...log, status: 200 });
      return apiJson({ ok: true, requestId: null }, { status: 200 });
    }

    const candidate = {
      fullName: str(body.fullName, PARTNERSHIP_LIMITS.fullName),
      phone: str(body.phone, PARTNERSHIP_LIMITS.phone),
      email: str(body.email, PARTNERSHIP_LIMITS.email),
      country: str(body.country, PARTNERSHIP_LIMITS.country),
      nationalId: str(body.nationalId, PARTNERSHIP_LIMITS.nationalId),
      shifaReference: str(body.shifaReference, PARTNERSHIP_LIMITS.shifaReference),
      mailingAddress: str(body.mailingAddress, PARTNERSHIP_LIMITS.mailingAddress),
      proposedLocation: str(body.proposedLocation, PARTNERSHIP_LIMITS.proposedLocation),
      message: str(body.message, PARTNERSHIP_LIMITS.message),
    };

    const errors = validatePartnership(candidate);

    // The expected answer was set by the server when it issued the question, so
    // this cannot be satisfied by editing the request alone. A wrong answer
    // burns the challenge: each guess costs a fresh, rate-limited issuance.
    const expected = (await cookies()).get(CAPTCHA_COOKIE)?.value;
    const given = clean(String(body.captchaAnswer ?? ""));
    let captchaFailed = false;
    if (!expected) {
      errors.captcha = "This check expired. Press Calculate for a new question.";
    } else if (!given) {
      errors.captcha = "Please answer the calculation.";
    } else if (given !== expected) {
      errors.captcha = "That answer is not correct.";
      captchaFailed = true;
    }

    if (Object.keys(errors).length > 0) {
      if (captchaFailed) logSecurityEvent("captcha_failed", { ...log, status: 422 });
      else logSecurityEvent("validation_failed", { ...log, status: 422, fields: Object.keys(errors) }, "info");
      const response = NextResponse.json({ ok: false, errors }, { status: 422, headers: { "Cache-Control": "no-store" } });
      return captchaFailed ? burnChallenge(response) : response;
    }

    // Input is valid, so this is a real submission attempt — charge it here.
    const submit = await enforceRateLimit("partnershipSubmit", ip);
    if (!submit.allowed) {
      logSecurityEvent("rate_limited", { ...log, status: 429, reason: "partnershipSubmit" });
      return tooManyRequests("Too many enquiries from this connection. Please try again later.", submit.retryAfterSeconds);
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .rpc("submit_partnership_request", {
        p_full_name: clean(candidate.fullName),
        // Store Pakistani numbers in the canonical 92XXXXXXXXXX form, as the
        // callback table does; leave international numbers as entered.
        p_phone_number: normalizePakistaniPhone(candidate.phone) ?? clean(candidate.phone),
        p_email: clean(candidate.email).toLowerCase(),
        p_country: clean(candidate.country),
        p_message: cleanMultiline(candidate.message),
        p_national_id: clean(candidate.nationalId) || null,
        p_shifa_reference: clean(candidate.shifaReference) || null,
        p_mailing_address: cleanMultiline(candidate.mailingAddress) || null,
        p_proposed_location: cleanMultiline(candidate.proposedLocation) || null,
      })
      .abortSignal(AbortSignal.timeout(securityConfig.databaseTimeoutMs));

    if (error) {
      if (error.message.includes("duplicate_submission")) {
        logSecurityEvent("duplicate_submission", { ...log, status: 200 }, "info");
        // 200, not 201: an earlier enquiry from this address is already with the
        // team, so nothing new was created.
        return burnChallenge(NextResponse.json({ ok: true, requestId: null, duplicate: true }, { headers: { "Cache-Control": "no-store" } }));
      }

      const invalid = (
        [
          ["invalid_name", "fullName", "Please check the name entered."],
          ["invalid_phone", "phone", "Enter a valid phone number."],
          ["invalid_email", "email", "Enter a valid email address."],
          ["invalid_country", "country", "Please select a country."],
          ["invalid_message", "message", "Please check your message."],
        ] as const
      ).find(([code]) => error.message.includes(code));

      if (invalid) {
        const [code, field, message] = invalid;
        logSecurityEvent("database_rejected", { ...log, status: 422, reason: code, fields: [field] });
        return apiJson({ ok: false, errors: { [field]: message } }, { status: 422 });
      }

      if (error.message.includes("rate_limited")) {
        logSecurityEvent("rate_limited", { ...log, status: 429, reason: "database_flood_ceiling" });
        return tooManyRequests("We are receiving a lot of enquiries. Please try again in a moment.", 60);
      }

      if (isAbortError(error)) {
        logSecurityEvent("database_timeout", { ...log, status: 503 }, "error");
        return apiJson(
          { ok: false, message: `Our enquiry system is slow to respond. Please try again, or call us on ${UAN}.` },
          { status: 503, headers: { "Retry-After": "30" } },
        );
      }
      throw error;
    }

    const reference = `ESP-${data as number}`;

    // Awaited, but neither can throw: sendEmail swallows its own failures. The
    // enquiry is already saved, so a mail problem must not surface as an error
    // to the applicant.
    const [thankYou, teamAlert] = await Promise.all([
      sendPartnershipThankYou({
        to: clean(candidate.email).toLowerCase(),
        fullName: clean(candidate.fullName),
        reference,
        country: clean(candidate.country),
        proposedLocation: cleanMultiline(candidate.proposedLocation) || null,
      }),
      notifyTeamOfPartnershipEnquiry({
        reference,
        fullName: clean(candidate.fullName),
        email: clean(candidate.email).toLowerCase(),
        phone: normalizePakistaniPhone(candidate.phone) ?? clean(candidate.phone),
        country: clean(candidate.country),
        proposedLocation: cleanMultiline(candidate.proposedLocation) || null,
        message: cleanMultiline(candidate.message),
      }),
    ]);
    for (const result of [thankYou, teamAlert]) {
      if (!result.sent && result.reason !== "not_configured" && result.reason !== "no_team_inbox") {
        logSecurityEvent("email_failed", { ...log, reason: result.reason }, "error");
      }
    }

    logSecurityEvent("submission_created", { ...log, status: 201 }, "info");

    // Burn the challenge so the same answer cannot be replayed.
    return burnChallenge(NextResponse.json({ ok: true, requestId: reference }, { status: 201, headers: { "Cache-Control": "no-store" } }));
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      logSecurityEvent("not_configured", { ...log, status: 503, detail: error.message }, "error");
      return apiJson(
        {
          ok: false,
          message: `Our enquiry system is temporarily unavailable. Please call us on ${UAN}.`,
          code: "not_configured",
        },
        { status: 503 },
      );
    }
    // Log without echoing the payload: it contains contact details and a CNIC.
    logSecurityEvent("database_error", { ...log, status: 500, detail: error instanceof Error ? error.message : "unknown" }, "error");
    return apiJson({ ok: false, message: `We could not send your enquiry. Please call us on ${UAN}.` }, { status: 500 });
  }
}
