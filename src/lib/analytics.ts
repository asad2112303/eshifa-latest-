/**
 * Minimal analytics dispatcher.
 *
 * The project currently ships no analytics library, and this deliberately does
 * not add one. It forwards events only if a provider is already present on the
 * page (gtag or a GTM dataLayer); otherwise it is a silent no-op. That keeps the
 * call sites clean today and makes them work the moment a provider is added.
 *
 * Never pass personally identifying information here — no names, phone numbers,
 * free-text notes or anything that identifies a patient.
 */

type EventPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: EventPayload) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(eventName: string, payload: EventPayload = {}): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
      return;
    }
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: eventName, ...payload });
    }
  } catch {
    // Analytics must never break a user action; failures are intentionally ignored.
  }
}
