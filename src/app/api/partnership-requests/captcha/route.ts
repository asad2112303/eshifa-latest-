import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { CAPTCHA_COOKIE, CAPTCHA_TTL_SECONDS, captchaCookieOptions } from "@/lib/captcha";
import { enforceRateLimit } from "@/lib/rate-limit";
import { clientIp, requestId, tooManyRequests } from "@/lib/request-security";
import { logSecurityEvent } from "@/lib/security-log";

/**
 * Issues the arithmetic challenge shown on the partnership form. See
 * src/lib/captcha.ts for what the check is and is not worth.
 *
 * Issuance is rate limited per client address. Because a wrong answer burns
 * the challenge (see the POST handler), this limit is also the cap on guesses.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 5;

const ROUTE = "/api/partnership-requests/captcha";

export async function GET(request: Request) {
  const id = requestId(request.headers);
  const ip = clientIp(request.headers);

  const limit = await enforceRateLimit("captchaIssue", ip);
  if (!limit.allowed) {
    logSecurityEvent("rate_limited", { requestId: id, route: ROUTE, ip, status: 429, reason: "captchaIssue" });
    return tooManyRequests("Too many attempts. Please wait a moment and try again.", limit.retryAfterSeconds);
  }

  // Small numbers, and never a trivial "+ 0": the sum should be answerable at a
  // glance by anyone, including someone using a screen reader.
  const a = randomInt(2, 20);
  const b = randomInt(2, 20);

  const response = NextResponse.json(
    { question: `${a} + ${b}`, expiresIn: CAPTCHA_TTL_SECONDS },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set(CAPTCHA_COOKIE, String(a + b), { ...captchaCookieOptions, maxAge: CAPTCHA_TTL_SECONDS });
  return response;
}
