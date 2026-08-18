import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Reports whether the caller holds a valid admin session. */
export async function GET() {
  const context = await getAdminContext();

  if (!context.ok) {
    return NextResponse.json(
      { ok: false },
      { status: context.reason === "not_configured" ? 503 : 401 },
    );
  }
  return NextResponse.json({ ok: true, email: context.email });
}
