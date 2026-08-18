"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Live-ish count of unhandled ("new") requests, used by the sidebar badge.
 *
 * Polled through /api/admin/dashboard rather than Supabase Realtime. Realtime
 * would require the browser to hold a database identity, and it deliberately
 * has none: the admin session is a server-side cookie, and no policy grants the
 * publishable key any access to patient data. Polling keeps that property.
 *
 * 30s is frequent enough for a call centre and costs one HEAD-style count query.
 */
const POLL_MS = 30_000;

async function fetchNewCount(signal: AbortSignal): Promise<number | null> {
  try {
    const response = await fetch("/api/admin/dashboard", { cache: "no-store", signal });
    if (!response.ok) return null;
    const body = (await response.json()) as { ok?: boolean; stats?: { newCount?: number } };
    return typeof body.stats?.newCount === "number" ? body.stats.newCount : null;
  } catch {
    // Never surface badge failures to the user.
    return null;
  }
}

export function useNewRequestCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      const next = await fetchNewCount(controller.signal);
      if (!controller.signal.aborted) {
        if (next !== null) setCount(next);
        timer = setTimeout(tick, POLL_MS);
      }
    };
    tick();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  return count;
}

/**
 * Notifies when new requests arrive while a page is open.
 * Returns how many have appeared since mount, so a page can prompt a refresh.
 */
export function useNewRequestNotifications(onInsert?: () => void): number {
  const [arrivals, setArrivals] = useState(0);
  const baseline = useRef<number | null>(null);
  const handler = useRef(onInsert);
  handler.current = onInsert;

  const check = useCallback(async (signal: AbortSignal) => {
    const next = await fetchNewCount(signal);
    if (next === null || signal.aborted) return;

    // The first reading establishes the baseline; only growth beyond it counts
    // as an arrival, so opening the page never reports a false notification.
    if (baseline.current === null) {
      baseline.current = next;
      return;
    }
    if (next > baseline.current) {
      const added = next - baseline.current;
      baseline.current = next;
      setArrivals((n) => n + added);
      handler.current?.();
    } else if (next < baseline.current) {
      // Requests were handled elsewhere; re-baseline so the next arrival counts.
      baseline.current = next;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      await check(controller.signal);
      if (!controller.signal.aborted) timer = setTimeout(tick, POLL_MS);
    };
    tick();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [check]);

  return arrivals;
}
