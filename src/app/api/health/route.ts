import { NextResponse } from "next/server";
import { missingPublicConfig, supabaseServiceKey } from "@/lib/supabase/env";
import { missingAdminConfig } from "@/lib/admin/auth";

/**
 * Liveness and readiness probe.
 *
 * `GET /api/health` stays minimal: it confirms the server is up and exposes
 * nothing about the environment.
 *
 * `GET /api/health?check=config` reports which configuration groups are
 * complete. It returns booleans and variable NAMES only — never a value, a
 * prefix or a length — so it cannot leak a key. This exists because the most
 * common deployment failure is a missing or stale environment variable, and
 * without it the only symptom is a generic "could not save your request".
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const wantsConfig = new URL(request.url).searchParams.get("check") === "config";

  if (!wantsConfig) {
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const publicMissing = missingPublicConfig();
  const adminMissing = missingAdminConfig();
  const hasServiceKey = Boolean(supabaseServiceKey());

  // Reaching the database proves the credentials are not merely present but
  // actually valid, and that the schema has been applied.
  let database: string;
  try {
    const { createAdminSupabase } = await import("@/lib/supabase/server");
    const { error } = await createAdminSupabase()
      .from("callback_requests")
      .select("id", { count: "exact", head: true });

    database = error
      ? error.code === "PGRST205"
        ? "unreachable: table callback_requests does not exist. Run supabase/migrations/0001_setup.sql"
        : `unreachable: ${error.message}`
      : "ok";
  } catch (error) {
    database = `unreachable: ${error instanceof Error ? error.message : "unknown error"}`;
  }

  const ready = publicMissing.length === 0 && adminMissing.length === 0 && hasServiceKey && database === "ok";

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      publicForm: {
        // The public form needs only the publishable key: it writes through
        // submit_callback_request(), not through a privileged client.
        ready: publicMissing.length === 0,
        missing: publicMissing,
      },
      adminPortal: {
        ready: adminMissing.length === 0 && hasServiceKey,
        missing: [...adminMissing, ...(hasServiceKey ? [] : ["SUPABASE_SECRET_KEY"])],
      },
      database,
    },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
