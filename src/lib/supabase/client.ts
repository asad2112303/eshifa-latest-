"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabasePublicKey } from "./env";

/**
 * Browser Supabase client. Uses the anon key only — every table is protected by
 * RLS, so this client can read nothing a signed-in staff member is not entitled
 * to, and nothing at all when signed out.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl()!, supabasePublicKey()!);
}
