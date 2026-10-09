import { securityConfig } from "./security-config";

/**
 * The arithmetic challenge on the partnership form.
 *
 * The server picks the numbers and remembers the answer in an HttpOnly cookie,
 * so the check is verified server-side rather than in JavaScript the submitter
 * controls. In production the cookie carries the __Host- prefix, which the
 * browser only honours when it is Secure, scoped to the whole site and set
 * with no Domain attribute, so no subdomain or plain-HTTP page can plant one.
 *
 * Be clear about what this is worth. Arithmetic stops bulk form spam, not a
 * determined attacker, who can read the question and solve it. The load-bearing
 * protections are the rate limits in the POST handler and the per-email
 * throttle inside submit_partnership_request(), which no client can bypass.
 */
export const CAPTCHA_COOKIE = securityConfig.isProduction
  ? "__Host-eshifa_partner_challenge"
  : "eshifa_partner_challenge";

export const CAPTCHA_TTL_SECONDS = 30 * 60;

export const captchaCookieOptions = {
  httpOnly: true,
  secure: securityConfig.isProduction,
  sameSite: "lax" as const,
  path: "/",
};
