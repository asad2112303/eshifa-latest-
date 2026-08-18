import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Single-account admin authentication.
 *
 * One email and one password, supplied by configuration rather than stored in a
 * user table. There is no signup and no Supabase Auth involvement.
 *
 * How the pieces fit:
 *   ADMIN_EMAIL          the one address permitted to sign in
 *   ADMIN_PASSWORD_HASH  scrypt hash of the password — never the password itself
 *   ADMIN_SESSION_SECRET signing key for the session cookie
 *
 * Storing a hash rather than the password matters: `.env` files get copied into
 * deploy logs, backups and screen shares, and a hash captured that way cannot be
 * replayed as a login.
 */

const SESSION_COOKIE = "eshifa_admin_session";
const SESSION_HOURS = 60 * 60 * 8; // one working day
const SESSION_REMEMBERED = 60 * 60 * 24 * 30; // "keep me signed in"

// --- configuration ---------------------------------------------------------

export function adminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL?.trim().toLowerCase() || undefined;
}

function adminPasswordHash(): string | undefined {
  return process.env.ADMIN_PASSWORD_HASH?.trim() || undefined;
}

function sessionSecret(): string | undefined {
  return process.env.ADMIN_SESSION_SECRET?.trim() || undefined;
}

/** Names of anything required but absent, for a precise error message. */
export function missingAdminConfig(): string[] {
  const missing: string[] = [];
  if (!adminEmail()) missing.push("ADMIN_EMAIL");
  if (!adminPasswordHash()) missing.push("ADMIN_PASSWORD_HASH");
  if (!sessionSecret()) missing.push("ADMIN_SESSION_SECRET");
  return missing;
}

export function isAdminConfigured(): boolean {
  return missingAdminConfig().length === 0;
}

// --- password hashing ------------------------------------------------------

const SCRYPT_KEYLEN = 64;
// Cost parameters. N=2^15 takes roughly 100ms here, which is unnoticeable on a
// single login but makes offline guessing of a stolen hash expensive.
const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/**
 * `scrypt:<salt-hex>:<hash-hex>`
 *
 * Colon-separated, not `$`-separated: dotenv expands `$name` inside .env
 * values, which would silently mangle the hash into something that never
 * matches and present as "correct password rejected".
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password.normalize("NFKC"), salt, SCRYPT_KEYLEN, SCRYPT_PARAMS);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;

  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const actual = scryptSync(password.normalize("NFKC"), salt, expected.length, SCRYPT_PARAMS);
    // Constant time: a byte-by-byte early exit would leak how much of the hash
    // a guess got right, which is enough to reconstruct it one byte at a time.
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// --- session token ---------------------------------------------------------

/**
 * `<payload-base64url>.<hmac-base64url>`
 *
 * Self-contained and signed, so no server-side session store is needed. The
 * payload is readable by the holder but cannot be altered without the secret.
 */
function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(email: string, remember = false): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");

  // The expiry lives inside the signed payload, not just the cookie's maxAge.
  // A cookie's lifetime is set by the browser and can simply be edited; this
  // one cannot be extended without the signing secret.
  const lifetime = remember ? SESSION_REMEMBERED : SESSION_HOURS;
  const payload = Buffer.from(
    JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + lifetime }),
  ).toString("base64url");

  return `${payload}.${sign(payload, secret)}`;
}

function readSessionToken(token: string): { email: string } | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      email?: string;
      exp?: number;
    };
    if (!data.email || !data.exp) return null;
    if (data.exp * 1000 < Date.now()) return null;

    // Re-check against the configured address. If ADMIN_EMAIL is changed, every
    // cookie issued for the old one stops working immediately.
    if (data.email.toLowerCase() !== adminEmail()) return null;

    return { email: data.email };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export function sessionCookieOptions(remember = false) {
  return {
    httpOnly: true, // unreadable from JavaScript, so XSS cannot steal it
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, // not sent on cross-site POSTs, blocking CSRF
    path: "/",
    maxAge: remember ? SESSION_REMEMBERED : SESSION_HOURS,
  };
}

// --- credential check ------------------------------------------------------

export function credentialsValid(email: string, password: string): boolean {
  const expectedEmail = adminEmail();
  const storedHash = adminPasswordHash();
  if (!expectedEmail || !storedHash) return false;

  // Always run the hash comparison, even when the email is wrong. Returning
  // early would make a wrong address measurably faster to reject than a wrong
  // password, revealing which one is correct.
  const emailMatches = email.trim().toLowerCase() === expectedEmail;
  const passwordMatches = verifyPassword(password, storedHash);

  return emailMatches && passwordMatches;
}

// --- request authorization -------------------------------------------------

export type AuthFailure = { reason: "not_configured" | "unauthenticated" };
export type AuthResult = { ok: true; email: string } | ({ ok: false } & AuthFailure);

/** Resolves the signed-in admin from the session cookie, or explains why not. */
export async function getAdminContext(): Promise<AuthResult> {
  if (!isAdminConfigured()) return { ok: false, reason: "not_configured" };

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return { ok: false, reason: "unauthenticated" };

  const session = readSessionToken(token);
  if (!session) return { ok: false, reason: "unauthenticated" };

  return { ok: true, email: session.email };
}

/**
 * Guard for /api/admin/* handlers.
 *
 * Returns either the authorized email or a response to return immediately.
 */
export async function requireAdmin(): Promise<
  { ok: true; email: string } | { ok: false; response: NextResponse }
> {
  const context = await getAdminContext();

  if (!context.ok) {
    const status = context.reason === "not_configured" ? 503 : 401;
    return {
      ok: false,
      response: NextResponse.json({ ok: false, message: "Not authorized." }, { status }),
    };
  }
  return { ok: true, email: context.email };
}
