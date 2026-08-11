import { NextResponse } from "next/server";

/**
 * Liveness probe for load balancers and uptime monitoring.
 *
 * Deliberately minimal: it confirms the server is up and serving, and exposes
 * nothing about the environment, versions, dependencies or configuration.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
