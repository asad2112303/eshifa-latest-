import { withBase } from "./custom";
import type { ServiceSlug } from "@/data/services";
import type { CustomIconProps } from "./custom";
import * as React from "react";

/**
 * Purpose-drawn glyphs for the six eShifa service pages.
 *
 * These are composites the Lucide set has no single equivalent for — "home +
 * nursing", "home + laboratory", "shield + syringe" — so they are drawn here to
 * the same contract as every other icon on the site: 24x24 viewBox, no fill,
 * currentColor stroke, round caps and joins, so weight and colour stay uniform.
 */

/* A shared house shell keeps the four "at home" glyphs visually consistent. */
const houseRoof = <path d="M3 10.4 12 3.2l9 7.2" />;
const houseBody = <path d="M5.4 9.6V19.4a1.4 1.4 0 0 0 1.4 1.4h10.4a1.4 1.4 0 0 0 1.4-1.4V9.6" />;

/** Home Nursing — house with a medical cross. */
export const HomeNursingGlyph = withBase(
  "HomeNursingGlyph",
  <>
    {houseRoof}
    {houseBody}
    <path d="M12 12.2v5" />
    <path d="M9.5 14.7h5" />
  </>,
);

/** Home Laboratory — house with a test tube. */
export const HomeLabGlyph = withBase(
  "HomeLabGlyph",
  <>
    {houseRoof}
    {houseBody}
    <path d="M10.4 12.2v4.2a1.6 1.6 0 0 0 3.2 0v-4.2" />
    <path d="M9.6 12.2h4.8" />
    <path d="M10.4 15h3.2" />
  </>,
);

/** Home Pharmacy — medicine package in transit, with a cross. */
export const HomePharmacyGlyph = withBase(
  "HomePharmacyGlyph",
  <>
    <rect x="7" y="6.6" width="13" height="12.8" rx="2" />
    <path d="M7 11.2h13" />
    <path d="M13.5 13.6v3.4" />
    <path d="M11.8 15.3h3.4" />
    <path d="M4.4 9.6H2.6" />
    <path d="M4.4 13H1.4" />
    <path d="M4.4 16.4H3" />
  </>,
);

/** Home Rehabilitation — a figure mid-movement. */
export const HomeRehabGlyph = withBase(
  "HomeRehabGlyph",
  <>
    <circle cx="12.4" cy="4.4" r="2" />
    <path d="M12.4 8v5.4" />
    <path d="M8.2 9.8 12.4 8l4.2 1.8" />
    <path d="M12.4 13.4 9.2 20" />
    <path d="M12.4 13.4 16 19.2" />
  </>,
);

/** Doctor Teleconsultation — video screen carrying a medical cross. */
export const TeleconsultGlyph = withBase(
  "TeleconsultGlyph",
  <>
    <rect x="2.4" y="5.4" width="13.4" height="11.6" rx="2" />
    <path d="M15.8 9.6 21.6 6.6v9.2l-5.8-3z" />
    <path d="M9.1 8.6v4.4" />
    <path d="M6.9 10.8h4.4" />
    <path d="M6.4 20.4h6.6" />
  </>,
);

/** Home Vaccination — protective shield with a syringe. */
export const VaccinationGlyph = withBase(
  "VaccinationGlyph",
  <>
    <path d="M12 21.2c4.6-2.2 6.8-5.6 6.8-9.6V5.7L12 3.2 5.2 5.7v5.9c0 4 2.2 7.4 6.8 9.6Z" />
    <path d="M14.9 8.3 9.7 13.5" />
    <path d="M13.4 6.9 16.3 9.8" />
    <path d="M10.9 9.4l2.9 2.9" />
    <path d="M9.5 13.7 8.2 15" />
  </>,
);

export const serviceGlyphs: Record<
  ServiceSlug,
  React.ForwardRefExoticComponent<CustomIconProps & React.RefAttributes<SVGSVGElement>>
> = {
  "home-nursing": HomeNursingGlyph,
  "home-laboratory": HomeLabGlyph,
  "home-pharmacy": HomePharmacyGlyph,
  "home-rehabilitation": HomeRehabGlyph,
  "doctor-teleconsultation": TeleconsultGlyph,
  "home-vaccination": VaccinationGlyph,
};

/** Renders the glyph for a service slug. Decorative by default. */
export function ServiceGlyph({
  slug,
  size = 32,
  strokeWidth = 1.5,
  className,
  label,
}: {
  slug: ServiceSlug;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}) {
  const Glyph = serviceGlyphs[slug];
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  return <Glyph size={size} strokeWidth={strokeWidth} className={className} {...a11y} />;
}
