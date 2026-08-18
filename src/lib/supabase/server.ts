import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabasePublicKey, supabaseServiceKey, missingPublicConfig } from "./env";

/**
 * The application's only Supabase client.
 *
 * It uses the publishable key plus the caller's session cookies, so every
 * query is subject to Row Level Security and can reach exactly what that user
 * is allowed to reach — nothing more.
 *
 * There is deliberately NO service-role client here. A key that bypasses RLS
 * would be a single string granting full read and write over patient names and
 * phone numbers, and it would have to be stored, deployed and rotated. The one
 * operation that genuinely needs to write past a policy — accepting a public
 * callback submission — goes through the submit_callback_request() function in
 * migration 0003, which can do that one thing and nothing else.
 */

/** True when the required public config is present. */
export function isSupabaseConfigured(): boolean {
  return missingPublicConfig().length === 0;
}

export class SupabaseNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`Supabase is not configured. Missing: ${missing.join(", ")}`);
    this.name = "SupabaseNotConfiguredError";
  }
}

function requirePublicConfig() {
  const missing = missingPublicConfig();
  if (missing.length) throw new SupabaseNotConfiguredError(missing);
}

/** Session-aware client for Server Components, Route Handlers and Actions. */
export async function createServerSupabase() {
  requirePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(
    supabaseUrl()!,
    supabasePublicKey()!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Session refresh is handled by middleware instead.
          }
        },
      },
    },
  );
}

/**
 * Server-only client for admin reads and writes. Bypasses RLS.
 *
 * Call this ONLY after requireAdmin() has verified the session cookie, and
 * never from a "use client" module.
 */
export function createAdminSupabase() {
  const missing = missingPublicConfig();
  if (!supabaseServiceKey()) missing.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)");
  if (missing.length) throw new SupabaseNotConfiguredError(missing);

  return createSupabaseClient(supabaseUrl()!, supabaseServiceKey()!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
