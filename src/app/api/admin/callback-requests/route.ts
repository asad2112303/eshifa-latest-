import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/server";
import { CALLBACK_STATUSES, type CallbackStatus } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Paged, filtered list of callback requests. Staff only. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const service = url.searchParams.get("service");
    const search = (url.searchParams.get("search") ?? "").trim();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 25) || 25));

    // Server-only client. requireAdmin() above is the authorization boundary:
    // the database cannot make this call, because the admin is not a Supabase
    // user and RLS has no identity to match them against.
    const supabase = createAdminSupabase();
    let query = supabase
      .from("callback_requests")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (status && CALLBACK_STATUSES.includes(status as CallbackStatus)) query = query.eq("status", status);
    if (service) query = query.eq("service", service);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    if (search) {
      // Escape PostgREST's or() delimiters so a crafted search cannot alter the filter.
      const safe = search.replace(/[,()]/g, " ").trim();
      const digits = safe.replace(/\D/g, "");
      const clauses = [`full_name.ilike.%${safe}%`];
      if (digits) clauses.push(`phone_number.ilike.%${digits}%`);
      const asNumber = Number(safe.replace(/^ESH-?/i, ""));
      if (Number.isFinite(asNumber) && asNumber > 0) clauses.push(`request_no.eq.${Math.trunc(asNumber)}`);
      query = query.or(clauses.join(","));
    }

    const start = (page - 1) * pageSize;
    const { data, error, count } = await query.range(start, start + pageSize - 1);
    if (error) throw error;

    return NextResponse.json({ ok: true, requests: data ?? [], total: count ?? 0, page, pageSize });
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      // Distinguish "not set up yet" from "something broke". Without this the
      // portal reports a generic failure and gives no clue what to fix.
      console.error("[admin/callback-requests] not configured:", error.message);
      return NextResponse.json(
        {
          ok: false,
          message:
            "The database connection is not configured. Add SUPABASE_SECRET_KEY to .env.local and restart the server.",
        },
        { status: 503 },
      );
    }
    console.error("[admin/callback-requests] list failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, message: "Could not load requests." }, { status: 500 });
  }
}
