"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, Loader2, CheckCircle2, PhoneCall, CalendarClock, Timer, ArrowRight } from "lucide-react";
import { StatsSkeleton } from "@/components/admin/skeletons";
import { useNewRequestNotifications } from "@/components/admin/use-new-request-count";

interface Stats {
  newCount: number;
  inProgress: number;
  completedToday: number;
  total: number;
  todayTotal: number;
  averageResponseMinutes: number | null;
}

/** Live dashboard summary. All figures come from the database, none hard-coded. */
export default function DashboardView() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.ok) {
        setError(payload.message ?? "Could not load dashboard data.");
        return;
      }
      setStats(payload.stats);
      setError(null);
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // A submission arriving while the dashboard is open refreshes the figures.
  useNewRequestNotifications(load);

  const cards = stats
    ? [
        { label: "New Requests", value: stats.newCount, icon: Inbox, tone: "text-[#ED3237] bg-[#ED3237]/10" },
        { label: "In Progress", value: stats.inProgress, icon: Loader2, tone: "text-[#B7791F] bg-[#B7791F]/10" },
        { label: "Completed Today", value: stats.completedToday, icon: CheckCircle2, tone: "text-[#0E7A4E] bg-[#0E7A4E]/10" },
        { label: "Total Requests", value: stats.total, icon: PhoneCall, tone: "text-[#0289E8] bg-[#0289E8]/10" },
      ]
    : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B004E]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#777777]">Callback activity across the eShifa care team.</p>
        </div>
        <Link
          href="/admin/requests"
          className="inline-flex items-center gap-2 rounded-[80px] bg-[#0289E8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0270C4]"
        >
          View all requests
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      {error && (
        <p role="alert" className="rounded-2xl bg-[#FDF0F0] px-5 py-4 text-sm text-[#C0392B]">
          {error}
        </p>
      )}

      {!stats && !error ? (
        <StatsSkeleton />
      ) : stats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-[#E6E9EF] bg-white p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#777777]">{card.label}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}>
                    <card.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-[#1B004E]">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#E6E9EF] bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0289E8]/10 text-[#0289E8]">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-[#777777]">Today&apos;s Requests</p>
              </div>
              <p className="mt-4 text-3xl font-semibold text-[#1B004E]">{stats.todayTotal}</p>
            </div>

            <div className="rounded-2xl border border-[#E6E9EF] bg-white p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E7A4E]/10 text-[#0E7A4E]">
                  <Timer className="h-4 w-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-[#777777]">Average Response Time</p>
              </div>
              <p className="mt-4 text-3xl font-semibold text-[#1B004E]">
                {stats.averageResponseMinutes === null ? (
                  <span className="text-lg font-medium text-[#777777]">Not enough data yet</span>
                ) : (
                  `${stats.averageResponseMinutes} min`
                )}
              </p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
