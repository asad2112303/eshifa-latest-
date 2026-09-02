"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  PARTNERSHIP_LIMITS,
  validatePartnership,
  type PartnershipErrors,
  type PartnershipInput,
} from "@/lib/partnership-validation";

/**
 * Partnership enquiry form.
 *
 * The arithmetic check is issued by the server and verified there, so it cannot
 * be satisfied by editing the request. The client-side validation below is a
 * convenience: the same rules run again on the server, which is what actually
 * decides.
 */

const UAN = "051-111-111-567";

/** Pakistan first, since it is the default and the overwhelming majority. */
const COUNTRIES = [
  "Pakistan",
  "United Arab Emirates",
  "Saudi Arabia",
  "United Kingdom",
  "United States",
  "Canada",
  "Australia",
  "Qatar",
  "Oman",
  "Kuwait",
  "Bahrain",
  "Other",
];

const EMPTY: PartnershipInput = {
  fullName: "",
  phone: "",
  email: "",
  country: "Pakistan",
  nationalId: "",
  shifaReference: "",
  mailingAddress: "",
  proposedLocation: "",
  message: "",
};

const FieldError = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} role="alert" className="mt-1.5 text-sm text-[#C0392B]">
      {message}
    </p>
  ) : null;

const Required = () => (
  <span className="text-[#C0392B]" aria-hidden="true">
    {" *"}
  </span>
);

export default function PartnershipForm() {
  const [values, setValues] = useState<PartnershipInput>(EMPTY);
  const [errors, setErrors] = useState<PartnershipErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");

  const set = <K extends keyof PartnershipInput>(key: K, value: PartnershipInput[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  /** Ask the server for a new sum. It remembers the answer, not this component. */
  const loadChallenge = useCallback(async () => {
    setQuestion(null);
    setAnswer("");
    try {
      const res = await fetch("/api/partnership-requests/captcha", { cache: "no-store" });
      const data = (await res.json()) as { question?: string };
      setQuestion(data.question ?? null);
    } catch {
      setQuestion(null);
    }
  }, []);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError(null);
    // Clear any previous success, so a failed retry cannot show a green
    // confirmation and a red error at the same time.
    setIsSubmitted(false);
    setIsDuplicate(false);
    setRequestId(null);

    const next = validatePartnership(values);
    if (!answer.trim()) next.captcha = "Please answer the calculation.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/partnership-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, captchaAnswer: answer, website: "" }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        requestId?: string | null;
        duplicate?: boolean;
        errors?: PartnershipErrors;
      };

      if (!res.ok || !payload.ok) {
        if (res.status === 422 && payload.errors) {
          setErrors(payload.errors);
          // Every server error must land somewhere visible. If it rejects on a
          // key this form has no field for, show it at form level rather than
          // failing with nothing on screen.
          if (!Object.values(payload.errors).some(Boolean)) {
            setFormError(payload.message ?? `Please check your details, or call us on ${UAN}.`);
          }
        } else {
          setFormError(payload.message ?? `Something went wrong. Please call us on ${UAN}.`);
        }
        // The challenge is single-use on the server, so always fetch a fresh one.
        loadChallenge();
        return;
      }

      setRequestId(payload.requestId ?? null);
      setIsDuplicate(Boolean(payload.duplicate));
      setIsSubmitted(true);
      setValues(EMPTY);
      setErrors({});
      loadChallenge();
    } catch {
      setFormError(`We could not reach our servers. Please check your connection or call us on ${UAN}.`);
      loadChallenge();
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `bg-[#F5F5F5] focus:bg-white ${hasError ? "border-[#C0392B]" : "border-transparent"}`;

  const labelClass = "block text-sm font-medium text-[#1B004E]";

  return (
    <div className="rounded-3xl border border-[#E6E9EF] bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold text-[#1B004E]">Partnership Form</h2>
      <p className="mt-2 text-sm text-[#777777]">
        Fields marked with an <span className="text-[#C0392B]">*</span> are required.
      </p>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        {/* Honeypot: positioned off-screen rather than display:none, which some
            bots detect. Never announced, never tabbable. */}
        <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="pf-website">Do not fill this in</label>
          <input id="pf-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-name" className={labelClass}>
              Name<Required />
            </label>
            <Input
              id="pf-name"
              value={values.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              maxLength={PARTNERSHIP_LIMITS.fullName}
              autoComplete="name"
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "pf-name-error" : undefined}
              className={`mt-1.5 ${fieldClass(Boolean(errors.fullName))}`}
            />
            <FieldError id="pf-name-error" message={errors.fullName} />
          </div>

          <div>
            <label htmlFor="pf-phone" className={labelClass}>
              Tel/Cell Number<Required />
            </label>
            <Input
              id="pf-phone"
              type="tel"
              inputMode="tel"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              maxLength={PARTNERSHIP_LIMITS.phone}
              autoComplete="tel"
              placeholder="0300 1234567"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "pf-phone-error" : undefined}
              className={`mt-1.5 ${fieldClass(Boolean(errors.phone))}`}
            />
            <FieldError id="pf-phone-error" message={errors.phone} />
          </div>

          <div>
            <label htmlFor="pf-email" className={labelClass}>
              Email Address<Required />
            </label>
            <Input
              id="pf-email"
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              maxLength={PARTNERSHIP_LIMITS.email}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "pf-email-error" : undefined}
              className={`mt-1.5 ${fieldClass(Boolean(errors.email))}`}
            />
            <FieldError id="pf-email-error" message={errors.email} />
          </div>

          <div>
            <label htmlFor="pf-country" className={labelClass}>
              Country<Required />
            </label>
            <select
              id="pf-country"
              value={values.country}
              onChange={(e) => set("country", e.target.value)}
              aria-invalid={Boolean(errors.country)}
              aria-describedby={errors.country ? "pf-country-error" : undefined}
              className={`mt-1.5 h-9 w-full rounded-md border px-3 text-base text-[#1B004E] outline-none focus:border-[#0289E8] md:text-sm ${fieldClass(Boolean(errors.country))}`}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <FieldError id="pf-country-error" message={errors.country} />
          </div>

          <div>
            <label htmlFor="pf-cnic" className={labelClass}>
              CNIC/Passport No
            </label>
            <Input
              id="pf-cnic"
              value={values.nationalId}
              onChange={(e) => set("nationalId", e.target.value)}
              maxLength={PARTNERSHIP_LIMITS.nationalId}
              placeholder="61101-1234567-1"
              aria-invalid={Boolean(errors.nationalId)}
              aria-describedby={errors.nationalId ? "pf-cnic-error" : undefined}
              className={`mt-1.5 ${fieldClass(Boolean(errors.nationalId))}`}
            />
            <FieldError id="pf-cnic-error" message={errors.nationalId} />
          </div>

          <div>
            <label htmlFor="pf-reference" className={labelClass}>
              Relative/Reference in Shifa
            </label>
            <Input
              id="pf-reference"
              value={values.shifaReference}
              onChange={(e) => set("shifaReference", e.target.value)}
              maxLength={PARTNERSHIP_LIMITS.shifaReference}
              aria-describedby={errors.shifaReference ? "pf-reference-error" : undefined}
              className={`mt-1.5 ${fieldClass(Boolean(errors.shifaReference))}`}
            />
            <FieldError id="pf-reference-error" message={errors.shifaReference} />
          </div>
        </div>

        <div>
          <label htmlFor="pf-address" className={labelClass}>
            Mailing Address
          </label>
          <Textarea
            id="pf-address"
            value={values.mailingAddress}
            onChange={(e) => set("mailingAddress", e.target.value)}
            maxLength={PARTNERSHIP_LIMITS.mailingAddress}
            autoComplete="street-address"
            aria-describedby={errors.mailingAddress ? "pf-address-error" : undefined}
            className={`mt-1.5 min-h-[80px] ${fieldClass(Boolean(errors.mailingAddress))}`}
          />
          <FieldError id="pf-address-error" message={errors.mailingAddress} />
        </div>

        <div>
          <label htmlFor="pf-location" className={labelClass}>
            City/Address of Proposed Lab Collection Point
          </label>
          <Textarea
            id="pf-location"
            value={values.proposedLocation}
            onChange={(e) => set("proposedLocation", e.target.value)}
            maxLength={PARTNERSHIP_LIMITS.proposedLocation}
            aria-describedby={errors.proposedLocation ? "pf-location-error" : undefined}
            className={`mt-1.5 min-h-[80px] ${fieldClass(Boolean(errors.proposedLocation))}`}
          />
          <FieldError id="pf-location-error" message={errors.proposedLocation} />
        </div>

        <div>
          <label htmlFor="pf-message" className={labelClass}>
            Message<Required />
          </label>
          <Textarea
            id="pf-message"
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            maxLength={PARTNERSHIP_LIMITS.message}
            placeholder="Tell us about the partnership you are interested in."
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "pf-message-error" : undefined}
            className={`mt-1.5 min-h-[120px] ${fieldClass(Boolean(errors.message))}`}
          />
          <FieldError id="pf-message-error" message={errors.message} />
        </div>

        {/* Arithmetic check */}
        <div>
          <label htmlFor="pf-captcha" className={labelClass}>
            {question ? `${question} =` : "Loading verification..."}
            <Required />
          </label>
          <div className="mt-1.5 flex flex-wrap items-start gap-3">
            <Input
              id="pf-captcha"
              inputMode="numeric"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              maxLength={6}
              autoComplete="off"
              disabled={!question}
              aria-invalid={Boolean(errors.captcha)}
              aria-describedby={errors.captcha ? "pf-captcha-error" : undefined}
              className={`w-32 ${fieldClass(Boolean(errors.captcha))}`}
            />
            <button
              type="button"
              onClick={loadChallenge}
              className="inline-flex items-center gap-2 rounded-[80px] border border-[#0289E8] px-4 py-2 text-sm font-semibold text-[#0289E8] transition-colors hover:bg-[#0289E8]/5"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              New question
            </button>
          </div>
          <FieldError id="pf-captcha-error" message={errors.captcha} />
        </div>

        {formError && (
          <p role="alert" className="rounded-xl bg-[#FDF0F0] px-4 py-3 text-sm text-[#C0392B]">
            {formError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-[80px] bg-[#0289E8] py-6 font-semibold text-white hover:bg-[#0289E8] disabled:opacity-70"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Sending...
            </span>
          ) : (
            "Submit Partnership Enquiry"
          )}
        </Button>

        {isSubmitted && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-3 rounded-2xl border border-[#0E7A4E]/25 bg-[#F1F9F5] p-4"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0E7A4E]" aria-hidden="true" />
            <div className="text-sm leading-relaxed text-[#1B004E]">
              {isDuplicate ? (
                /* Nothing new was stored: an earlier enquiry from this address
                   is already with the team. Saying "received" without
                   qualification would hide that these details were discarded. */
                <p>
                  <span className="font-semibold">You already have an enquiry with us.</span> We received an
                  earlier enquiry from this email address, so we have not created a second one. Our
                  partnership team will be in touch. To add anything, call {UAN}.
                </p>
              ) : (
                <>
                  <p>
                    <span className="font-semibold">Thank you.</span> Your partnership enquiry has been
                    received. Our team will review it and contact you.
                  </p>
                  {requestId && (
                    <p className="mt-2 font-mono text-xs text-[#444444]">Reference: {requestId}</p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
