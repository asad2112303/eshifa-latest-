import { NextResponse } from "next/server";
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

/** Writes to the database, so never statically optimised. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 8 * 1024;

/**
 * Two limits, because they defend against different things.
 *
 * Charging rejected input to the submission limit punishes the wrong person: a
 * patient who mistypes their phone number three times would be locked out for
 * ten minutes without a single request ever reaching the database. So malformed
 * input only counts towards the flood ceiling, and the strict limit is charged
 * once the request is known to be genuine.
 *
 * Both are in-memory: they reset on restart and are per-instance, which on
 * serverless means per warm function. Adequate against casual spam and accidental
 * double submits; the durable guard is the per-phone-number throttle inside
 * submit_callback_request(), which no client can bypass.
 */
const SUBMIT_LIMIT = { max: 3, windowMs: 10 * 60 * 1000 };
const FLOOD_LIMIT = { max: 40, windowMs: 10 * 60 * 1000 };

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

export async function POST(request: Request) {
  try {
    const ip = clientKey(request);

    if (overLimit(floodHits, ip, FLOOD_LIMIT)) {
      return NextResponse.json(
        { ok: false, message: "Too many requests. Please try again shortly, or call us on 051-111-111-567." },
        { status: 429 },
      );
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, message: "Request too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const candidate = {
      fullName: String(input.fullName ?? "").slice(0, LIMITS.fullName * 2),
      phone: String(input.phone ?? "").slice(0, LIMITS.phone * 2),
      service: String(input.service ?? "").slice(0, LIMITS.service * 2),
      additionalNotes: String(input.additionalNotes ?? "").slice(0, LIMITS.additionalNotes * 2),
    };

    // Server-side validation. The client's checks are a convenience only.
    const errors = validateCallback(candidate, callbackServiceOptions);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 422 });
    }

    // Input is valid, so this is a real submission attempt — charge it here.
    if (overLimit(submitHits, ip, SUBMIT_LIMIT)) {
      return NextResponse.json(
        { ok: false, message: "Too many requests. Please try again shortly, or call us on 051-111-111-567." },
        { status: 429 },
      );
    }

    // Store the normalised international form (923001234567) so dialling and
    // WhatsApp links are built from one canonical value.
    const normalizedPhone = normalizePakistaniPhone(candidate.phone);

    // Insert through a SECURITY DEFINER function rather than a privileged key.
    // The publishable key used here can do nothing else: it cannot read, update
    // or delete callback_requests, so a leak of it exposes no patient data.
    // Arguments are bound as parameters, never concatenated into SQL.
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("submit_callback_request", {
      p_full_name: clean(candidate.fullName),
      p_phone_number: normalizedPhone ?? clean(candidate.phone),
      p_service: clean(candidate.service),
      p_additional_notes: cleanMultiline(candidate.additionalNotes) || null,
    });

    if (error) {
      // The function raises named exceptions for input it refuses. A repeat
      // submission is the user's own request arriving twice, so it is reported
      // as success — resubmitting should not look like a failure to them.
      if (error.message.includes("duplicate_submission")) {
        // 200, not 201: the visitor's request is already recorded, so this is a
        // success from their point of view but nothing new was created.
        return NextResponse.json({ ok: true, requestId: null, duplicate: true });
      }
      if (error.message.includes("rate_limited")) {
        return NextResponse.json(
          { ok: false, message: "We are receiving a lot of requests. Please try again in a moment." },
          { status: 429 },
        );
      }
      throw error;
    }

    // 201: a record was created. Only the friendly number is returned — never
    // the internal uuid, which would let anyone enumerate other requests.
    return NextResponse.json(
      { ok: true, requestId: formatRequestNo(data as number) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      // A deployment problem, not a visitor problem. Distinguishing it means a
      // misconfigured environment is diagnosable from the response instead of
      // looking identical to a database fault.
      console.error("[callback-requests] Supabase not configured:", error.message);
      return NextResponse.json(
        {
          ok: false,
          message: "Our booking system is temporarily unavailable. Please call us on 051-111-111-567.",
          code: "not_configured",
        },
        { status: 503 },
      );
    }
    // Log without echoing the submitted payload: it contains patient details.
    console.error("[callback-requests] insert failed:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      { ok: false, message: "We could not save your request. Please call us on 051-111-111-567." },
      { status: 500 },
    );
  }
}
