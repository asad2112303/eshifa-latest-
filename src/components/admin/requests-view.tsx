"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, BellRing } from "lucide-react";
import { TableSkeleton } from "@/components/admin/skeletons";
import RequestDrawer from "@/components/admin/request-drawer";
import { useNewRequestNotifications } from "@/components/admin/use-new-request-count";
import { callbackServiceOptions } from "@/data/callback-services";
import { CALLBACK_STATUSES, formatRequestNo, type CallbackStatus } from "@/lib/supabase/types";
import { STATUS_LABELS, STATUS_STYLES, displayPhone, formatReceived } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export interface RequestRow {
  id: string;
  request_no: number;
  full_name: string;
  phone_number: string;
  service: string;
  additional_notes: string | null;
  status: CallbackStatus;
  assigned_to: string | null;
  created_at: string;
  contacted_at: string | null;
  completed_at: string | null;
}


type DatePreset = "" | "today" | "yesterday" | "7d" | "30d" | "custom";

/** Start of a Pakistan day, offset in days, as a UTC ISO instant. */
function pkDayStart(offsetDays: number): string {
  const pk = new Date(Date.now() + 5 * 60 * 60 * 1000);
  pk.setUTCHours(0, 0, 0, 0);
  pk.setUTCDate(pk.getUTCDate() + offsetDays);
  return new Date(pk.getTime() - 5 * 60 * 60 * 1000).toISOString();
}

export default function RequestsView() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") ?? "") as CallbackStatus | "";

  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CallbackStatus | "">(initialStatus);
  const [service, setService] = useState("");
  const [datePreset, setDatePreset] = useState<DatePreset>("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Reflect sidebar links like /admin/requests?status=new
  useEffect(() => {
    setStatus((searchParams.get("status") ?? "") as CallbackStatus | "");
  }, [searchParams]);

  const dateRange = useMemo(() => {
    switch (datePreset) {
      case "today":
        return { from: pkDayStart(0), to: undefined };
      case "yesterday":
        return { from: pkDayStart(-1), to: pkDayStart(0) };
      case "7d":
        return { from: pkDayStart(-6), to: undefined };
      case "30d":
        return { from: pkDayStart(-29), to: undefined };
      case "custom":
        return {
          from: customFrom ? new Date(`${customFrom}T00:00:00+05:00`).toISOString() : undefined,
          to: customTo ? new Date(`${customTo}T23:59:59+05:00`).toISOString() : undefined,
        };
      default:
        return { from: undefined, to: undefined };
    }
  }, [datePreset, customFrom, customTo]);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      if (service) params.set("service", service);
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);
      params.set("pageSize", "50");

      const res = await fetch(`/api/admin/callback-requests?${params}`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.ok) {
        setError(payload.message ?? "Could not load requests.");
        setRows([]);
        return;
      }
      setRows(payload.requests);
      setTotal(payload.total);
      setError(null);
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
      setRows([]);
    }
  }, [search, status, service, dateRange]);

  // Debounce so typing in the search box does not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);


  const arrivals = useNewRequestNotifications(load);

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setService("");
    setDatePreset("");
    setCustomFrom("");
    setCustomTo("");
  };

  const hasFilters = Boolean(search || status || service || datePreset);
  const selectClass =
    "h-10 rounded-xl border border-[#E6E9EF] bg-white px-3 text-sm text-[#1B004E] outline-none focus:border-[#0289E8]";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B004E]">Callback Requests</h1>
          <p className="mt-1 text-sm text-[#777777]">
            {rows === null ? "Loading…" : `${total} request${total === 1 ? "" : "s"}`}
          </p>
        </div>
        {arrivals > 0 && (
          <p className="inline-flex items-center gap-2 rounded-full bg-[#0289E8]/10 px-4 py-2 text-sm font-medium text-[#0270C4]">
            <BellRing className="h-4 w-4" aria-hidden="true" />
            New callback request received
          </p>
        )}
      </header>

      {/* Search + filters */}
      <div className="space-y-3 rounded-2xl border border-[#E6E9EF] bg-white p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or request ID"
            aria-label="Search name, phone or request ID"
            className="h-11 w-full rounded-xl border border-[#E6E9EF] bg-[#F8F9FC] pl-10 pr-4 text-sm outline-none focus:border-[#0289E8] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value as CallbackStatus | "")} className={selectClass} aria-label="Filter by status">
            <option value="">All statuses</option>
            {CALLBACK_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <select value={service} onChange={(e) => setService(e.target.value)} className={selectClass} aria-label="Filter by service">
            <option value="">All services</option>
            {callbackServiceOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={datePreset} onChange={(e) => setDatePreset(e.target.value as DatePreset)} className={selectClass} aria-label="Filter by date">
            <option value="">Any date</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom range</option>
          </select>

          {datePreset === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className={selectClass} aria-label="From date" />
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className={selectClass} aria-label="To date" />
            </>
          )}

          {hasFilters && (
            <button type="button" onClick={clearFilters} className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#0289E8] hover:bg-[#0289E8]/5">
              <X className="h-4 w-4" aria-hidden="true" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {error && <p role="alert" className="rounded-2xl bg-[#FDF0F0] px-5 py-4 text-sm text-[#C0392B]">{error}</p>}

      {rows === null ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-[#E6E9EF] bg-white p-12 text-center">
          <p className="text-lg font-medium text-[#1B004E]">No callback requests yet.</p>
          <p className="mt-2 text-sm text-[#777777]">
            {hasFilters ? "No requests match these filters." : "New requests will appear here as soon as they arrive."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-[#E6E9EF] bg-white lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[#E6E9EF] bg-[#F8F9FC] text-xs uppercase tracking-wide text-[#777777]">
                <tr>
                  {["Request ID", "Patient", "Phone", "Service", "Received", "Status", ""].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={cn("border-b border-[#F0F2F6] last:border-0", row.status === "new" && "bg-[#ED3237]/[0.03]")}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1B004E]">{formatRequestNo(row.request_no)}</td>
                    <td className="px-4 py-3 font-medium text-[#1B004E]">{row.full_name}</td>
                    <td className="px-4 py-3 text-[#444444]">{displayPhone(row.phone_number)}</td>
                    <td className="px-4 py-3 text-[#444444]">{row.service}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[#777777]">{formatReceived(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[row.status])}>
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setSelectedId(row.id)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#0289E8] hover:bg-[#0289E8]/5">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — a wide table is unusable on a phone */}
          <div className="space-y-3 lg:hidden">
            {rows.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={cn(
                  "w-full rounded-2xl border border-[#E6E9EF] bg-white p-4 text-left",
                  row.status === "new" && "border-[#ED3237]/30 bg-[#ED3237]/[0.03]",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-semibold text-[#777777]">{formatRequestNo(row.request_no)}</p>
                    <p className="mt-1 font-semibold text-[#1B004E]">{row.full_name}</p>
                    <p className="text-sm text-[#444444]">{displayPhone(row.phone_number)}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[row.status])}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#777777]">
                  <span>{row.service}</span>
                  <span>{formatReceived(row.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedId && (
        <RequestDrawer
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
