import { NextResponse } from "next/server";
import { missingPublicConfig } from "@/lib/supabase/env";

/**
 * Liveness and readiness probe.
 *
 * `GET /api/health` stays minimal: it confirms the server is up and exposes
 * nothing about the environment.
 *
 * `GET /api/health?check=config` reports whether the callback form can reach
 * the database. It returns booleans and variable NAMES only — never a value,
 * prefix or length — so it cannot leak a key. This exists because the most
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

  const missing = missingPublicConfig();

  // Calling the submit function with input it will reject proves the whole
  // path works — credentials valid, function present, grants correct — without
  // creating a row. A validation error back from the database IS the success
  // signal here; anything else means the path is broken.
  let database = "unknown";
  if (missing.length === 0) {
    try {
      const { createServerSupabase } = await import("@/lib/supabase/server");
      const supabase = await createServerSupabase();
      const { error } = await supabase.rpc("submit_callback_request", {
        p_full_name: "",
        p_phone_number: "",
        p_service: "",
        p_additional_notes: null,
      });

      if (!error) database = "ok";
      else if (error.message.includes("invalid_name")) database = "ok";
      else if (error.code === "PGRST202")
        database = "unreachable: submit_callback_request() is missing. Run supabase/migrations/0001_setup.sql";
      else database = `unreachable: ${error.message}`;
    } catch (error) {
      database = `unreachable: ${error instanceof Error ? error.message : "unknown error"}`;
    }
  } else {
    database = "not checked: Supabase configuration is incomplete";
  }

  const ready = missing.length === 0 && database === "ok";

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      publicForm: { ready: missing.length === 0, missing },
      database,
    },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
