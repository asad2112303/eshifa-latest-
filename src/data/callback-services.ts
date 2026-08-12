/**
 * Options offered in the "How can we help?" field.
 *
 * Shared by the form and the API route: the server uses this as an allow-list
 * so only a published service name can ever reach the spreadsheet.
 */
export const callbackServiceOptions = [
  "Home Laboratory Services",
  "Home Nursing Services",
  "Home Rehabilitation Services",
  "Home Pharmacy Services",
  "Home Medical Equipment",
  "Doctor Teleconsultation",
  "Home Vaccination Services",
  "Specialized Care Programs",
  "International Family Care",
] as const;

export type CallbackServiceOption = (typeof callbackServiceOptions)[number];
