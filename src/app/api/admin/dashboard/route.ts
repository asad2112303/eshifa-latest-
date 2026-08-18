import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminSupabase, SupabaseNotConfiguredError } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Start of "today" in Pakistan (UTC+5), expressed as a UTC instant. */
function startOfPakistanDay(offsetDays = 0): string {
  const now = new Date();
  const pk = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  pk.setUTCHours(0, 0, 0, 0);
  pk.setUTCDate(pk.getUTCDate() + offsetDays);
  return new Date(pk.getTime() - 5 * 60 * 60 * 1000).toISOString();
}

/** Counts for the summary cards. All derived from live data. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // Server-only client; requireAdmin() above is the authorization boundary.
    const supabase = createAdminSupabase();
    const todayStart = startOfPakistanDay();

    const countOf = async (build: (q: ReturnType<typeof baseQuery>) => ReturnType<typeof baseQuery>) => {
      const { count, error } = await build(baseQuery());
      if (error) throw error;
      return count ?? 0;
    };
    function baseQuery() {
      return supabase.from("callback_requests").select("id", { count: "exact", head: true });
    }

    const [newCount, inProgress, completedToday, total, todayTotal] = await Promise.all([
      countOf((q) => q.eq("status", "new")),
      countOf((q) => q.eq("status", "in_progress")),
      countOf((q) => q.eq("status", "completed").gte("completed_at", todayStart)),
      countOf((q) => q),
      countOf((q) => q.gte("created_at", todayStart)),
    ]);

    // Average minutes from submission to first contact, over the last 200 contacted requests.
    const { data: contacted } = await supabase
      .from("callback_requests")
      .select("created_at, contacted_at")
      .not("contacted_at", "is", null)
      .order("contacted_at", { ascending: false })
      .limit(200);

    let averageResponseMinutes: number | null = null;
    if (contacted?.length) {
      const totalMinutes = contacted.reduce((sum, r) => {
        const delta = new Date(r.contacted_at as string).getTime() - new Date(r.created_at as string).getTime();
        return sum + Math.max(0, delta) / 60000;
      }, 0);
      averageResponseMinutes = Math.round(totalMinutes / contacted.length);
    }

    return NextResponse.json({
      ok: true,
      stats: { newCount, inProgress, completedToday, total, todayTotal, averageResponseMinutes },
    });
  } catch (error) {
    if (error instanceof SupabaseNotConfiguredError) {
      // Distinguish "not set up yet" from "something broke". Without this the
      // portal reports a generic failure and gives no clue what to fix.
      console.error("[admin/dashboard] not configured:", error.message);
      return NextResponse.json(
        {
          ok: false,
          message:
            "The database connection is not configured. Add SUPABASE_SECRET_KEY to .env.local and restart the server.",
        },
        { status: 503 },
      );
    }
    console.error("[admin/dashboard] failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ ok: false, message: "Could not load dashboard data." }, { status: 500 });
  }
}
