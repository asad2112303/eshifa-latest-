/**
 * Validation shared by the client form and the API route.
 *
 * The server re-runs this on every request — client-side validation is a UX
 * affordance only and is trivially bypassed, so it is never trusted.
 */

export interface CallbackInput {
  fullName: string;
  phone: string;
  service: string;
  additionalNotes?: string;
}

export type CallbackFieldErrors = Partial<
  Record<"fullName" | "phone" | "service" | "additionalNotes", string>
>;

/** Upper bounds so a crafted request cannot write an unbounded cell. */
export const LIMITS = { fullName: 100, phone: 30, service: 80, additionalNotes: 1000 } as const;

/**
 * Normalises a Pakistani mobile number to 92XXXXXXXXXX.
 * Accepts 03001234567, +923001234567, 923001234567 and spaced/dashed variants.
 * Returns null when the value is not a valid PK mobile number.
 */
export function normalizePakistaniPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let national: string;
  if (digits.startsWith("92") && digits.length === 12) national = digits.slice(2);
  else if (digits.startsWith("0") && digits.length === 11) national = digits.slice(1);
  else if (digits.length === 10) national = digits;
  else return null;

  return /^3\d{9}$/.test(national) ? `92${national}` : null;
}

/** Formats a normalised number for display: +92 300 1234567 */
export function formatPakistaniPhone(normalized: string): string {
  const n = normalized.slice(2);
  return `+92 ${n.slice(0, 3)} ${n.slice(3)}`;
}

/** Collapses whitespace and strips control characters. */
export function clean(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Same, but preserves paragraph breaks in the free-text notes. */
export function cleanMultiline(value: string): string {
  return value
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

export function validateCallback(
  input: CallbackInput,
  allowedServices: readonly string[],
): CallbackFieldErrors {
  const errors: CallbackFieldErrors = {};

  const fullName = clean(input.fullName ?? "");
  if (!fullName) errors.fullName = "Please enter your name.";
  else if (fullName.length > LIMITS.fullName) errors.fullName = "That name is too long.";

  const phone = (input.phone ?? "").trim();
  if (!phone) errors.phone = "Please enter a phone number.";
  else if (phone.length > LIMITS.phone || !normalizePakistaniPhone(phone))
    errors.phone = "Enter a valid Pakistani mobile number, e.g. 0300 1234567.";

  const service = clean(input.service ?? "");
  if (!service) errors.service = "Please select a service.";
  // Reject anything not in the published list, so the sheet cannot be seeded
  // with arbitrary attacker-controlled text via a crafted request.
  else if (!allowedServices.includes(service)) errors.service = "Please select a valid service.";

  const notes = cleanMultiline(input.additionalNotes ?? "");
  if (notes.length > LIMITS.additionalNotes) errors.additionalNotes = "Please shorten your notes.";

  return errors;
}
