import { normalizePakistaniPhone, formatPakistaniPhone } from "@/lib/callback-validation";
import type { CallbackStatus } from "@/lib/supabase/types";

/**
 * Display helpers for the admin dashboard.
 * Timestamps are stored in UTC and rendered in Asia/Karachi.
 */

const PK_TIMEZONE = "Asia/Karachi";

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: PK_TIMEZONE,
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: PK_TIMEZONE,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

/** "Today" gets the time only; anything older shows the date. */
export function formatReceived(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const sameDay =
    new Intl.DateTimeFormat("en-CA", { timeZone: PK_TIMEZONE }).format(now) ===
    new Intl.DateTimeFormat("en-CA", { timeZone: PK_TIMEZONE }).format(then);
  return sameDay ? formatTime(iso) : formatDateTime(iso);
}

/** Stored numbers are normalised (923001234567); show them readably. */
export function displayPhone(stored: string): string {
  const normalized = normalizePakistaniPhone(stored);
  return normalized ? formatPakistaniPhone(normalized) : stored;
}

/** tel: link — E.164 with the leading +. */
export function telHref(stored: string): string {
  const normalized = normalizePakistaniPhone(stored);
  return `tel:${normalized ? `+${normalized}` : stored.replace(/[^\d+]/g, "")}`;
}

/**
 * WhatsApp click-to-chat with a prefilled greeting.
 * wa.me needs digits only — no +, spaces or dashes.
 */
export function whatsappHref(stored: string, patientName: string, service: string): string {
  const normalized = normalizePakistaniPhone(stored) ?? stored.replace(/\D/g, "");
  const firstName = patientName.trim().split(/\s+/)[0] || "there";
  const message =
    `Assalam-o-Alaikum ${firstName},\n\n` +
    `This is the eShifa Care Team regarding your callback request for ${service}.\n\n` +
    `How may we assist you?`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export const STATUS_LABELS: Record<CallbackStatus, string> = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Green for done, amber for in-flight, red reserved for attention. */
export const STATUS_STYLES: Record<CallbackStatus, string> = {
  new: "bg-[#ED3237]/10 text-[#C0392B] border-[#ED3237]/25",
  contacted: "bg-[#0289E8]/10 text-[#0270C4] border-[#0289E8]/25",
  in_progress: "bg-[#B7791F]/10 text-[#B7791F] border-[#B7791F]/25",
  completed: "bg-[#0E7A4E]/10 text-[#0E7A4E] border-[#0E7A4E]/25",
  cancelled: "bg-[#777777]/10 text-[#555555] border-[#777777]/25",
};

/** Human labels for activity rows. */
export const ACTIVITY_LABELS: Record<string, string> = {
  request_created: "Request received",
  assigned: "Assigned",
  unassigned: "Unassigned",
  status_changed: "Status changed",
  request_opened: "Request opened",
};
