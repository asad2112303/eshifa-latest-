/**
 * Validation for the partnership enquiry form.
 *
 * Shared by the form and the API route so the two cannot drift: a rule relaxed
 * in one place but not the other is how a submit ends up rejected with no
 * explanation the visitor can act on.
 */

import { clean, cleanMultiline, normalizePakistaniPhone } from "@/lib/callback-validation";

export interface PartnershipInput {
  fullName: string;
  phone: string;
  email: string;
  country: string;
  nationalId: string;
  shifaReference: string;
  mailingAddress: string;
  proposedLocation: string;
  message: string;
}

export type PartnershipErrors = Partial<Record<keyof PartnershipInput | "captcha", string>>;

export const PARTNERSHIP_LIMITS = {
  fullName: 100,
  phone: 30,
  email: 150,
  country: 60,
  nationalId: 40,
  shifaReference: 150,
  mailingAddress: 400,
  proposedLocation: 300,
  message: 2000,
} as const;

/**
 * Deliberately permissive. A stricter pattern rejects addresses that are
 * perfectly deliverable, and the address is confirmed by the team contacting
 * the applicant anyway.
 */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** Digits only, 13 of them. Passports are alphanumeric and shorter. */
const CNIC = /^\d{13}$/;

export function validatePartnership(input: PartnershipInput): PartnershipErrors {
  const errors: PartnershipErrors = {};

  const name = clean(input.fullName);
  if (!name) errors.fullName = "Please enter your name.";
  else if (name.length < 2) errors.fullName = "Please enter your full name.";
  else if (name.length > PARTNERSHIP_LIMITS.fullName) errors.fullName = "Please shorten your name.";

  const phone = clean(input.phone);
  if (!phone) {
    errors.phone = "Please enter a phone number.";
  } else if (phone.replace(/\D/g, "").length < 7) {
    errors.phone = "Enter a valid phone number.";
  } else if (
    // A Pakistani number must be a real one. Numbers from elsewhere are
    // accepted on length alone, since this form invites overseas applicants.
    /^(0|92|\+92)/.test(phone.replace(/[\s()-]/g, "")) &&
    !normalizePakistaniPhone(phone)
  ) {
    errors.phone = "Enter a valid Pakistani mobile number, e.g. 0300 1234567.";
  }

  const email = clean(input.email);
  if (!email) errors.email = "Please enter an email address.";
  else if (!EMAIL.test(email)) errors.email = "Enter a valid email address.";
  else if (email.length > PARTNERSHIP_LIMITS.email) errors.email = "Please shorten your email address.";

  const country = clean(input.country);
  if (!country) errors.country = "Please select a country.";
  else if (country.length > PARTNERSHIP_LIMITS.country) errors.country = "Please shorten the country.";

  const nationalId = clean(input.nationalId);
  if (nationalId) {
    const digits = nationalId.replace(/\D/g, "");
    // Accept a CNIC with or without dashes, or any plausible passport number.
    const looksLikeCnic = /^\d[\d-]*$/.test(nationalId);
    if (looksLikeCnic && !CNIC.test(digits)) {
      errors.nationalId = "A CNIC has 13 digits, e.g. 61101-1234567-1.";
    } else if (nationalId.length > PARTNERSHIP_LIMITS.nationalId) {
      errors.nationalId = "Please shorten this.";
    }
  }

  const optional: Array<[keyof PartnershipInput, number]> = [
    ["shifaReference", PARTNERSHIP_LIMITS.shifaReference],
    ["mailingAddress", PARTNERSHIP_LIMITS.mailingAddress],
    ["proposedLocation", PARTNERSHIP_LIMITS.proposedLocation],
  ];
  for (const [field, limit] of optional) {
    if (cleanMultiline(input[field]).length > limit) errors[field] = "Please shorten this.";
  }

  const message = cleanMultiline(input.message);
  if (!message) errors.message = "Please tell us about your enquiry.";
  else if (message.length < 5) errors.message = "Please add a little more detail.";
  else if (message.length > PARTNERSHIP_LIMITS.message) errors.message = "Please shorten your message.";

  return errors;
}
