import {
  Activity,
  Baby,
  Bone,
  Brain,
  Cross,
  Droplet,
  FlaskConical,
  HeartHandshake,
  PersonStanding,
  Pill,
  Stethoscope,
  Sun,
  Syringe,
  Thermometer,
  Video,
  Wind,
  BriefcaseMedical,
  ClipboardPlus,
  type LucideIcon,
} from "lucide-react";
import { CpapMask, Nebulizer, OxygenCylinder, SuctionPump } from "@/components/icons/custom";

/**
 * Single source of truth mapping every eShifa service to its icon.
 *
 * Add a service here once and every surface that renders it — home grid,
 * services page, care programs, equipment list — picks the icon up automatically.
 * Icons are chosen for clinical meaning, not decoration.
 */

/** Icons share Lucide's prop contract, so custom SVGs are interchangeable with library ones. */
export type ServiceIconComponent = LucideIcon | typeof OxygenCylinder;

export const serviceIcons = {
  // ---- Core service lines ----
  "home-laboratory-services": FlaskConical,
  "home-nursing-services": Stethoscope,
  "home-rehabilitation-services": PersonStanding,
  "home-pharmacy-services": Pill,
  "home-medical-equipment": BriefcaseMedical,
  "doctor-teleconsultation": Video,
  "home-vaccination-services": Syringe,
  "specialized-care-programs": ClipboardPlus,

  // ---- Specialized care programs ----
  "diabetes-care-plan": Droplet,
  "elderly-care-plan": HeartHandshake,
  "lrti-care-plan": Wind,
  "arthritis-care-plan": Bone,
  "post-stroke-care-plan": Brain,
  "mother-baby-care-plan": Baby,
  "dengue-home-monitoring": Thermometer,
  "home-phototherapy-care-plan": Sun,

  // ---- Rentable medical equipment ----
  "oxygen-concentrators": OxygenCylinder,
  nebulizers: Nebulizer,
  "suction-machines": SuctionPump,
  "bipap-and-cpap-machines": CpapMask,
  "cardiac-monitors": Activity,
} satisfies Record<string, ServiceIconComponent>;

export type ServiceSlug = keyof typeof serviceIcons;

/** Neutral medical mark shown when a service has no explicit mapping. */
export const FALLBACK_SERVICE_ICON: ServiceIconComponent = Cross;

/**
 * Alternate spellings that should resolve to an existing mapping — keeps display
 * copy free to change (e.g. adding a sub-brand) without breaking the icon.
 */
const slugAliases: Record<string, ServiceSlug> = {
  teleconsultation: "doctor-teleconsultation",
  "home-lab-sample-collection": "home-laboratory-services",
  "home-physiotherapy-and-rehabilitation": "home-rehabilitation-services",
  "home-pharmacy-delivery": "home-pharmacy-services",
};

/** Normalizes a display name into a lookup slug: "Mother & Baby Care Plan" → "mother-baby-care-plan". */
export function slugifyService(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

/**
 * Resolves a service display name or slug to its icon.
 * Never throws and never returns undefined — unknown services fall back to a
 * neutral medical mark so the UI cannot crash on unmapped content.
 */
export function getServiceIcon(nameOrSlug: string): ServiceIconComponent {
  const slug = slugifyService(nameOrSlug);
  const resolved = slugAliases[slug] ?? slug;
  return serviceIcons[resolved as ServiceSlug] ?? FALLBACK_SERVICE_ICON;
}
