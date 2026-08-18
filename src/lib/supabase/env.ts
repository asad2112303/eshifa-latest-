/**
 * Supabase environment resolution.
 *
 * Newer Supabase projects issue a "publishable key" (sb_publishable_…) in place
 * of the older "anon key". Both are safe to expose in the browser and both are
 * governed by Row Level Security, so either name is accepted.
 */

export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
}

/** The browser-safe key, under either the new or legacy variable name. */
export function supabasePublicKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    undefined
  );
}

export function missingPublicConfig(): string[] {
  const missing: string[] = [];
  if (!supabaseUrl()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!supabasePublicKey()) missing.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return missing;
}

/**
 * Server-only key. Bypasses Row Level Security, so it is confined to the admin
 * API routes and used only after the session cookie has been verified.
 *
 * It is required because the admin is not a Supabase user: the database cannot
 * tell them apart from an anonymous visitor, so RLS cannot authorize them and
 * the server must read on their behalf.
 *
 * Never prefix with NEXT_PUBLIC_ — that would ship it to every browser.
 */
export function supabaseServiceKey(): string | undefined {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    undefined
  );
}
