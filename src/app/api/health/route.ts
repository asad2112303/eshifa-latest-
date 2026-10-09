import { securityConfig } from "@/lib/security-config";
import { enforceRateLimit } from "@/lib/rate-limit";
import { apiJson, bearerToken, clientIp, requestId, tokenMatches, tooManyRequests } from "@/lib/request-security";
import { logSecurityEvent } from "@/lib/security-log";
import { missingPublicConfig } from "@/lib/supabase/env";

/**
 * Liveness and readiness probe.
 *
 * `GET /api/health` stays minimal: it confirms the server is up and exposes
 * nothing about the environment.
 *
 * `GET /api/health?check=config` reports whether the forms can reach the
 * database. It is for operators, so it requires the HEALTH_CHECK_TOKEN as a
 * bearer token; in production with no token configured it does not exist
 * (404). It answers with variable NAMES and fixed category words only. The
 * underlying error text goes to the server log under the request id, never
 * to the caller.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

const ROUTE = "/api/health";

type DatabaseState = "ok" | "function_missing" | "unreachable" | "not_checked";

export async function GET(request: Request) {
  const id = requestId(request.headers);
  const ip = clientIp(request.headers);

  const limit = await enforceRateLimit("health", ip);
  if (!limit.allowed) {
    logSecurityEvent("rate_limited", { requestId: id, route: ROUTE, ip, status: 429, reason: "health" });
    return tooManyRequests("Too many requests.", limit.retryAfterSeconds);
  }

  const wantsConfig = new URL(request.url).searchParams.get("check") === "config";
  if (!wantsConfig) {
    return apiJson({ status: "ok", timestamp: new Date().toISOString() });
  }

  const token = securityConfig.healthCheckToken;
  if (!token) {
    if (securityConfig.isProduction) {
      logSecurityEvent("health_check_denied", { requestId: id, route: ROUTE, ip, status: 404, reason: "disabled" });
      return apiJson({ ok: false, message: "Not found." }, { status: 404 });
    }
    // Development only: no token configured, so local diagnosis stays easy.
  } else if (!tokenMatches(bearerToken(request.headers), token)) {
    logSecurityEvent("health_check_denied", { requestId: id, route: ROUTE, ip, status: 401, reason: "bad_token" });
    return apiJson(
      { ok: false, message: "Unauthorized." },
      { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="health"' } },
    );
  }

  const missing = missingPublicConfig();

  // Calling the submit function with input it will reject proves the whole
  // path works — credentials valid, function present, grants correct — without
  // creating a row. A validation error back from the database IS the success
  // signal here; anything else means the path is broken.
  let database: DatabaseState = "not_checked";
  if (missing.length === 0) {
    try {
      const { createServerSupabase } = await import("@/lib/supabase/server");
      const supabase = await createServerSupabase();
      const { error } = await supabase
        .rpc("submit_callback_request", { p_full_name: "", p_phone_number: "", p_service: "", p_additional_notes: null })
        .abortSignal(AbortSignal.timeout(securityConfig.databaseTimeoutMs));

      if (!error || error.message.includes("invalid_name")) database = "ok";
      else if (error.code === "PGRST202") database = "function_missing";
      else database = "unreachable";

      if (database !== "ok") {
        logSecurityEvent("health_check_degraded", {
          requestId: id, route: ROUTE, ip, reason: database, detail: error?.message,
        });
      }
    } catch (error) {
      database = "unreachable";
      logSecurityEvent("health_check_degraded", {
        requestId: id, route: ROUTE, ip, reason: database, detail: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  const ready = missing.length === 0 && database === "ok";
  return apiJson(
    {
      status: ready ? "ready" : "not_ready",
      timestamp: new Date().toISOString(),
      requestId: id,
      publicForm: { ready: missing.length === 0, missing },
      database,
      ...(database === "function_missing" ? { hint: "Run supabase/migrations/0001_setup.sql" } : {}),
    },
    { status: ready ? 200 : 503 },
  );
}
