import { NextResponse } from "next/server";
import { appendCallbackRecord, CallbackStoreNotConfiguredError } from "@/lib/callback-store";
import {
  validateCallback,
  clean,
  cleanMultiline,
  normalizePakistaniPhone,
  formatPakistaniPhone,
  LIMITS,
} from "@/lib/callback-validation";
import { callbackServiceOptions } from "@/data/callback-services";

/** Writes to the filesystem, so this must never be statically optimised. */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Reject oversized bodies before parsing. */
const MAX_BODY_BYTES = 8 * 1024;

/**
 * Very small in-memory rate limit: 5 submissions per IP per 10 minutes.
 *
 * This is per server instance and resets on restart — enough to blunt casual
 * form spam, not a substitute for a shared store (Redis/Upstash) behind
 * multiple instances.
 */
const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const hits = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(key, recent);

  // Opportunistic cleanup so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_LIMIT.windowMs)) hits.delete(k);
    }
  }
  return recent.length > RATE_LIMIT.max;
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "unknown").trim();
}

export async function POST(request: Request) {
  try {
    if (isRateLimited(clientKey(request))) {
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

    // Server-side validation — the client's checks are never trusted.
    const errors = validateCallback(candidate, callbackServiceOptions);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ ok: false, errors }, { status: 422 });
    }

    const normalizedPhone = normalizePakistaniPhone(candidate.phone);

    await appendCallbackRecord({
      fullName: clean(candidate.fullName),
      phone: normalizedPhone ? formatPakistaniPhone(normalizedPhone) : clean(candidate.phone),
      service: clean(candidate.service),
      additionalNotes: cleanMultiline(candidate.additionalNotes),
      source: "website_contact_form",
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Misconfiguration is an operator problem, not a visitor problem: log it
    // loudly, but show the visitor the same neutral message either way.
    if (error instanceof CallbackStoreNotConfiguredError) {
      console.error("[callback] storage not configured:", error.message);
    } else {
      console.error("[callback] failed to record request:", error);
    }

    return NextResponse.json(
      { ok: false, message: "We could not save your request. Please call us on 051-111-111-567." },
      { status: 500 },
    );
  }
}
