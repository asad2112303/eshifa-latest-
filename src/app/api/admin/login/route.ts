import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  credentialsValid,
  isAdminConfigured,
  missingAdminConfig,
  sessionCookieOptions,
} from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin sign-in.
 *
 * With a single shared account there is no "lock the user out" option — that
 * would hand anyone a trivial denial of service against the whole portal. So
 * failed attempts are slowed instead: a short delay that grows with each miss,
 * making bulk guessing impractical while a mistyped password stays usable.
 */
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function recordFailure(ip: string): number {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

function failureCount(ip: string): number {
  const entry = attempts.get(ip);
  if (!entry || Date.now() > entry.resetAt) return 0;
  return entry.count;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) if (now > entry.resetAt) attempts.delete(ip);
}, WINDOW_MS).unref?.();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    console.error("[admin/login] not configured. Missing:", missingAdminConfig().join(", "));
    return NextResponse.json(
      { ok: false, message: "The admin portal is not configured." },
      { status: 503 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const raw = await request.text();
  if (raw.length > 4096) {
    return NextResponse.json({ ok: false, message: "Request too large." }, { status: 413 });
  }

  let body: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  // Escalating delay, capped so a legitimate admin is never locked out for long.
  const priorFailures = failureCount(ip);
  if (priorFailures > 0) {
    await sleep(Math.min(priorFailures * 400, 4000));
  }

  if (!credentialsValid(email, password)) {
    const count = recordFailure(ip);
    // Never say which field was wrong: that would confirm the address for free.
    return NextResponse.json(
      {
        ok: false,
        message:
          count >= 8
            ? "Too many failed attempts. Please wait a few minutes before trying again."
            : "Invalid email or password.",
      },
      { status: 401 },
    );
  }

  attempts.delete(ip);

  const remember = body.remember === true;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    SESSION_COOKIE_NAME,
    createSessionToken(email.trim().toLowerCase(), remember),
    sessionCookieOptions(remember),
  );
  return response;
}
