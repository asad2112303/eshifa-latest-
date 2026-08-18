"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { DetailSkeleton } from "@/components/admin/skeletons";
import { CALLBACK_STATUSES, formatRequestNo, type CallbackStatus } from "@/lib/supabase/types";
import {
  STATUS_LABELS,
  STATUS_STYLES,
  ACTIVITY_LABELS,
  displayPhone,
  telHref,
  whatsappHref,
  formatDate,
  formatTime,
  formatDateTime,
} from "@/lib/admin/format";
import { cn } from "@/lib/utils";

interface Detail {
  id: string;
  request_no: number;
  full_name: string;
  phone_number: string;
  service: string;
  additional_notes: string | null;
  status: CallbackStatus;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  completed_at: string | null;
}

interface Activity {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor?: { id: string; full_name: string | null; email: string } | null;
}

interface StaffOption {
  id: string;
  full_name: string | null;
  email: string;
}

/** Slide-over showing everything about one request, with the actions staff need. */
export default function RequestDrawer({
  requestId,
  onClose,
  onChanged,
}: {
  requestId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/callback-requests/${requestId}`, { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.ok) {
        setError(payload.message ?? "Could not load this request.");
        return;
      }
      setDetail(payload.request);
      setActivity(payload.activity ?? []);
      setError(null);
    } catch {
      setError("We could not reach the server.");
    }
  }, [requestId]);

  useEffect(() => {
    load();
  }, [load]);

  // Escape closes the drawer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const patch = async (body: Record<string, unknown>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/callback-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok || !payload.ok) {
        // 409 = someone else claimed it first; refresh so the UI shows who.
        setError(payload.message ?? "Could not update this request.");
        if (res.status === 409) await load();
        return;
      }
      setDetail(payload.request);
      await load();
      onChanged();
    } catch {
      setError("We could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const timeline = detail
    ? [
        { label: "Submitted", at: detail.created_at },
        { label: "Contacted", at: detail.contacted_at },
        { label: "In Progress", at: detail.status === "in_progress" ? detail.updated_at : null },
        { label: "Completed", at: detail.completed_at },
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close details" onClick={onClose} className="absolute inset-0 bg-black/40" />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Callback request details"
        className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl"
      >
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-[#E6E9EF] bg-white px-6 py-4">
          <div>
            <p className="font-mono text-xs font-semibold text-[#777777]">
              {detail ? formatRequestNo(detail.request_no) : "Loading…"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#1B004E]">{detail?.full_name ?? "Request"}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[#777777] hover:text-[#1B004E]">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 px-6 py-6">
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-[#FDF0F0] px-4 py-3 text-sm text-[#C0392B]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {!detail ? (
            <DetailSkeleton />
          ) : (
            <>
              {/* Duplicate-call guard: make ownership obvious before anyone dials. */}

              <div className="flex flex-wrap gap-3">
                <a
                  href={telHref(detail.phone_number)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[80px] bg-[#0289E8] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0270C4]"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Call Patient
                </a>
                <a
                  href={whatsappHref(detail.phone_number, detail.full_name, detail.service)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-[80px] bg-[#0E7A4E] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0b6640]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </div>

              <dl className="grid gap-4 rounded-2xl border border-[#E6E9EF] bg-[#F8F9FC] p-5 text-sm sm:grid-cols-2">
                {[
                  ["Phone Number", displayPhone(detail.phone_number)],
                  ["Requested Service", detail.service],
                  ["Received Date", formatDate(detail.created_at)],
                  ["Received Time", formatTime(detail.created_at)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-[#777777]">{label}</dt>
                    <dd className="mt-1 font-medium text-[#1B004E]">{value}</dd>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-[#777777]">Additional Notes</dt>
                  <dd className="mt-1 whitespace-pre-line text-[#444444]">
                    {detail.additional_notes || <span className="text-[#999999]">None provided</span>}
                  </dd>
                </div>
              </dl>

              {/* Status */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#1B004E]">Status</h3>
                <div className="flex flex-wrap gap-2">
                  {CALLBACK_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy || detail.status === s}
                      onClick={() => patch({ status: s })}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-100",
                        detail.status === s ? STATUS_STYLES[s] : "border-[#E6E9EF] text-[#777777] hover:border-[#0289E8] hover:text-[#0289E8]",
                      )}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </section>

              {/* Progress */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#1B004E]">Progress</h3>
                <ol className="space-y-3">
                  {timeline.map((step) => (
                    <li key={step.label} className="flex items-start gap-3">
                      <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", step.at ? "bg-[#0E7A4E]" : "bg-[#DDE1E8]")} />
                      <div>
                        <p className={cn("text-sm font-medium", step.at ? "text-[#1B004E]" : "text-[#999999]")}>{step.label}</p>
                        {step.at && <p className="text-xs text-[#777777]">{formatDateTime(step.at)}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Activity */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-[#1B004E]">Activity History</h3>
                {activity.length === 0 ? (
                  <p className="text-sm text-[#777777]">No activity recorded yet.</p>
                ) : (
                  <ol className="space-y-3 border-l border-[#E6E9EF] pl-4">
                    {activity.map((entry) => (
                      <li key={entry.id}>
                        <p className="text-xs text-[#777777]">{formatTime(entry.created_at)}</p>
                        <p className="text-sm text-[#1B004E]">
                          {ACTIVITY_LABELS[entry.action] ?? entry.action}
                          {entry.action === "status_changed" && entry.new_value
                            ? ` to ${STATUS_LABELS[entry.new_value as CallbackStatus] ?? entry.new_value}`
                            : ""}
                          {entry.actor ? ` · ${entry.actor.full_name || entry.actor.email}` : ""}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
