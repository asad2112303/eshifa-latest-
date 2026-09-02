import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/server";
import { clean, cleanMultiline, normalizePakistaniPhone } from "@/lib/callback-validation";
import { PARTNERSHIP_LIMITS, validatePartnership } from "@/lib/partnership-validation";
import { CAPTCHA_COOKIE } from "./captcha/route";

/** Writes to the database, so never statically optimised. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Two limits, for two different problems.
 *
 * Charging rejected input to the submission limit punishes the wrong person: an
 * applicant who mistypes their email three times would be locked out without a
 * single enquiry reaching the database. Malformed input counts only towards the
 * flood ceiling; the strict limit is charged once the input is known to be good.
 *
 * Both are in-memory, so they reset on deploy and are per-instance — on
 * serverless, per warm function. The durable guard is the per-email throttle
 * inside submit_partnership_request(), which no client can bypass.
 */
const SUBMIT_LIMIT = { max: 3, windowMs: 30 * 60 * 1000 };
const FLOOD_LIMIT = { max: 40, windowMs: 30 * 60 * 1000 };

const submitHits = new Map<string, number[]>();
const floodHits = new Map<string, number[]>();

function overLimit(store: Map<string, number[]>, key: string, limit: { max: number; windowMs: number }) {
  const now = Date.now();
  const recent = (store.get(key) ?? []).filter((t) => now - t < limit.windowMs);
  recent.push(now);
  store.set(key, recent);

  if (store.size > 5000) {
    for (const [k, v] of store) {
      if (v.every((t) => now - t >= limit.windowMs)) store.delete(k);
    }
  }
  return recent.length > limit.max;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim();
}

const str = (value: unknown, limit: number) => String(value ?? "").slice(0, limit * 2);

export async function POST(request: Request) {
  try {
    const ip = clientKey(request);

    if (overLimit(floodHits, ip, FLOOD_LIMIT)) {
      return NextResponse.json(
        { ok: false, message: "Too many requests. Please try again later, or call us on 051-111-111-567." },
        { status: 429 },
      );
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, message: "Request too large." }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
    }

    // A hidden field no human ever fills in. Bots that complete every input give
    // themselves away. Answered exactly like a success so they learn nothing.
    if (clean(String(body.website ?? ""))) {
      return NextResponse.json({ ok: true, requestId: null }, { status: 200 });
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
    // this cannot be satisfied by editing the request alone.
    const expected = (await cookies()).get(CAPTCHA_COOKIE)?.value;
    const given = clean(String(body.captchaAnswer ?? ""));
    if (!expected) {
      errors.captcha = "This check expired. Press Calculate for a new question.";
    } else if (!given) {
      errors.captcha = "Please answer the calculation.";
    } else if (given !== expected) {
      errors.captcha = "That answer is not correct.";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 422 });
    }

    // Input is valid, so this is a real submission attempt — charge it here.
    if (overLimit(submitHits, ip, SUBMIT_LIMIT)) {
      return NextResponse.json(
        { ok: false, message: "Too many enquiries from this connection. Please try again later." },
        { status: 429 },
      );
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("submit_partnership_request", {
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
    });

    if (error) {
      if (error.message.includes("duplicate_submission")) {
        // 200, not 201: an earlier enquiry from this address is already with the
        // team, so nothing new was created. The client says so rather than
        // implying these details were stored.
        return NextResponse.json({ ok: true, requestId: null, duplicate: true });
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
        const [, field, message] = invalid;
        return NextResponse.json({ ok: false, errors: { [field]: message } }, { status: 422 });
      }

      if (error.message.includes("rate_limited")) {
        return NextResponse.json(
          { ok: false, message: "We are receiving a lot of enquiries. Please try again in a moment." },
          { status: 429 },
        );
      }
      throw error;
    }

    const response = NextResponse.json(
      { ok: true, requestId: `ESP-${data as number}` },
      { status: 201 },
    );
    // Burn the challenge so the same answer cannot be replayed.
    response.cookies.set(CAPTCHA_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      console.error("[partnership-requests] Supabase not configured:", error.message);
      return NextResponse.json(
        {
          ok: false,
          message: "Our enquiry system is temporarily unavailable. Please call us on 051-111-111-567.",
          code: "not_configured",
        },
        { status: 503 },
      );
    }
    // Log without echoing the payload: it contains contact details and a CNIC.
    console.error("[partnership-requests] insert failed:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      { ok: false, message: "We could not send your enquiry. Please call us on 051-111-111-567." },
      { status: 500 },
    );
  }
}
