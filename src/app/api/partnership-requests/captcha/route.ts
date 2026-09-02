import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";

/**
 * Issues the arithmetic challenge shown on the partnership form.
 *
 * The server picks the numbers and remembers the answer in an HttpOnly cookie,
 * so the check is verified server-side rather than in JavaScript the submitter
 * controls. Without this the question would be decoration: anyone could POST
 * whatever answer they liked.
 *
 * Be clear about what this is worth. Arithmetic stops bulk form spam, not a
 * determined attacker, who can read the question and solve it. The load-bearing
 * protections are the per-IP rate limit in the POST handler and the per-email
 * throttle inside submit_partnership_request(), which no client can bypass.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const CAPTCHA_COOKIE = "eshifa_partner_challenge";
const TTL_SECONDS = 30 * 60;

export async function GET() {
  // Small numbers, and never a trivial "+ 0": the sum should be answerable at a
  // glance by anyone, including someone using a screen reader.
  const a = randomInt(2, 20);
  const b = randomInt(2, 20);

  const response = NextResponse.json(
    { question: `${a} + ${b}`, expiresIn: TTL_SECONDS },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set(CAPTCHA_COOKIE, String(a + b), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });

  return response;
}
