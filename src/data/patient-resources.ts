/**
 * Patient and family education leaflets, served as downloadable PDFs.
 *
 * The files live in public/resources and ship with the site rather than being
 * fetched from elsewhere, so a download never depends on a third party.
 *
 * `sizeLabel` and `pages` are written down rather than measured at runtime:
 * they only change when a document is reissued, and someone on a slow
 * connection deserves to know a download is 1.8 MB before starting it.
 *
 * Descriptions restate each document's own title. Most of these PDFs are
 * image-only exports with no extractable text, so writing anything more
 * specific would mean inventing detail about clinical guidance.
 */

export type ResourceCategory = "Safety" | "Infection Control" | "Your Care" | "About eShifa";

/** Order the groups appear in, on the page and in the navbar dropdown. */
export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  "Safety",
  "Infection Control",
  "Your Care",
  "About eShifa",
];

export interface PatientResource {
  /** Filename in public/resources, without the extension. */
  file: string;
  title: string;
  description: string;
  category: ResourceCategory;
  pages: number;
  sizeLabel: string;
}

export const patientResources: PatientResource[] = [
  // --- Safety -------------------------------------------------------------
  {
    file: "Safety-at-home",
    title: "Safety at Home",
    description: "Keeping the home environment safe during care.",
    category: "Safety",
    pages: 4,
    sizeLabel: "1.6 MB",
  },
  {
    file: "Fall-Alert-Prevention",
    title: "Fall Alert and Prevention",
    description: "Reducing the risk of falls.",
    category: "Safety",
    pages: 1,
    sizeLabel: "424 KB",
  },
  {
    file: "Medication-Safety",
    title: "Medication Safety",
    description: "Taking and storing medicines safely.",
    category: "Safety",
    pages: 4,
    sizeLabel: "653 KB",
  },
  {
    file: "Home-Oxygen-Safety",
    title: "Home Oxygen Safety",
    description: "Using oxygen equipment safely at home.",
    category: "Safety",
    pages: 2,
    sizeLabel: "814 KB",
  },

  // --- Infection Control --------------------------------------------------
  {
    file: "Hand-Washing-Steps",
    title: "Hand Washing Steps",
    description: "The correct technique, step by step.",
    category: "Infection Control",
    pages: 1,
    sizeLabel: "563 KB",
  },
  {
    file: "Contact-precaution",
    title: "Contact Precautions",
    description: "What to do when contact precautions are in place.",
    category: "Infection Control",
    pages: 1,
    sizeLabel: "229 KB",
  },
  {
    file: "Airborne-Precaution",
    title: "Airborne Precautions",
    description: "Precautions for airborne infection control.",
    category: "Infection Control",
    pages: 1,
    sizeLabel: "576 KB",
  },

  // --- Your Care ----------------------------------------------------------
  {
    file: "Patients-Families-Rights-and-Responsibilities-2026",
    title: "Patients' and Families' Rights and Responsibilities",
    description: "What you can expect from us, and what we ask of you.",
    category: "Your Care",
    pages: 2,
    sizeLabel: "413 KB",
  },
  {
    file: "What-you-must-know",
    title: "What You Must Know",
    description: "Key information for patients and families.",
    category: "Your Care",
    pages: 4,
    sizeLabel: "1.5 MB",
  },
  {
    file: "Zero-Tolerance",
    title: "Zero Tolerance",
    description: "Our zero tolerance policy.",
    category: "Your Care",
    pages: 1,
    sizeLabel: "1.8 MB",
  },
  {
    file: "Emergency-Contacts-Card-Updated-August-2026",
    title: "Emergency Contacts Card",
    description: "Key numbers to keep to hand. Updated August 2026.",
    category: "Your Care",
    pages: 1,
    sizeLabel: "424 KB",
  },

  // --- About eShifa -------------------------------------------------------
  {
    file: "eShifa-Home-Health-Services",
    title: "eShifa Home Health Services",
    description: "An overview of the services we provide at home.",
    category: "About eShifa",
    pages: 4,
    sizeLabel: "1005 KB",
  },
];

export const resourcePath = (resource: PatientResource) => `/resources/${resource.file}.pdf`;

/** Filename the browser saves as, rather than the internal one. */
export const resourceDownloadName = (resource: PatientResource) =>
  `eShifa - ${resource.title}.pdf`;

/** Grouped in the order RESOURCE_CATEGORIES declares, skipping empty groups. */
export function resourcesByCategory(): Array<{
  category: ResourceCategory;
  items: PatientResource[];
}> {
  return RESOURCE_CATEGORIES.map((category) => ({
    category,
    items: patientResources.filter((r) => r.category === category),
  })).filter((group) => group.items.length > 0);
}
