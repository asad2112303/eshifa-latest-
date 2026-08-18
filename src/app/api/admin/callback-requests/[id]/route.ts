import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/server";
import { CALLBACK_STATUSES, type CallbackStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Single request with its activity timeline. */
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  try {
    // Server-only client. requireAdmin() above is the authorization boundary:
    // the database cannot make this call, because the admin is not a Supabase
    // user and RLS has no identity to match them against.
    const supabase = createAdminSupabase();

    const { data: callbackRequest, error } = await supabase
      .from("callback_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!callbackRequest) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

    const { data: activity } = await supabase
      .from("callback_request_activity")
      .select("*")
      .eq("callback_request_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({ ok: true, request: callbackRequest, activity: activity ?? [] });
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      // Distinguish "not set up yet" from "something broke". Without this the
      // portal reports a generic failure and gives no clue what to fix.
      console.error("[admin/callback-request] not configured:", error.message);
      return NextResponse.json(
        {
          ok: false,
          message:
            "The database connection is not configured. Add SUPABASE_SECRET_KEY to .env.local and restart the server.",
        },
        { status: 503 },
      );
    }
    console.error("[admin/callback-request] fetch failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, message: "Could not load the request." }, { status: 500 });
  }
}

/**
 * Update a request's status.
 *
 * The status is compared before writing so a no-op change does not add a
 * misleading entry to the timeline. contacted_at and completed_at are stamped
 * by a database trigger, so they cannot drift from the status they describe.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

  try {
    const body = (await request.json().catch(() => ({}))) as { status?: string };

    if (body.status === undefined) {
      return NextResponse.json({ ok: false, message: "Nothing to update." }, { status: 422 });
    }
    if (!CALLBACK_STATUSES.includes(body.status as CallbackStatus)) {
      return NextResponse.json({ ok: false, message: "Invalid status." }, { status: 422 });
    }

    const supabase = createAdminSupabase();

    const { data: current } = await supabase
      .from("callback_requests")
      .select("id, status")
      .eq("id", id)
      .maybeSingle<{ id: string; status: CallbackStatus }>();

    if (!current) return NextResponse.json({ ok: false, message: "Not found." }, { status: 404 });

    if (body.status !== current.status) {
      const { error } = await supabase
        .from("callback_requests")
        .update({ status: body.status })
        .eq("id", id);
      if (error) throw error;

      await supabase.from("callback_request_activity").insert({
        callback_request_id: id,
        action: "status_changed",
        old_value: current.status,
        new_value: body.status,
        actor_email: auth.email,
      });
    }

    const { data: updated } = await supabase
      .from("callback_requests")
      .select("*")
      .eq("id", id)
      .single();

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      // Distinguish "not set up yet" from "something broke". Without this the
      // portal reports a generic failure and gives no clue what to fix.
      console.error("[admin/callback-request] not configured:", error.message);
      return NextResponse.json(
        {
          ok: false,
          message:
            "The database connection is not configured. Add SUPABASE_SECRET_KEY to .env.local and restart the server.",
        },
        { status: 503 },
      );
    }
    console.error("[admin/callback-request] update failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, message: "Could not update the request." }, { status: 500 });
  }
}
