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
