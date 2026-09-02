/**
 * Patient and family education leaflets, served as downloadable PDFs.
 *
 * The files live in public/resources and are shipped with the site rather than
 * fetched from elsewhere, so a download never depends on a third party being up.
 *
 * `sizeLabel` is written down rather than measured at runtime: the file sizes
 * only change when a leaflet is reissued, and a visitor on a slow connection
 * deserves to know a download is 575 KB before starting it.
 */

export interface PatientResource {
  /** Filename in public/resources, without the extension. */
  file: string;
  title: string;
  description: string;
  sizeLabel: string;
}

export const patientResources: PatientResource[] = [
  {
    file: "Hand-Washing-Steps",
    title: "Hand Washing Steps",
    description: "The correct technique, step by step.",
    sizeLabel: "563 KB",
  },
  {
    file: "Fall-Alert-Prevention",
    title: "Fall Alert and Prevention",
    description: "Reducing the risk of falls at home and in hospital.",
    sizeLabel: "424 KB",
  },
  {
    file: "Contact-precaution",
    title: "Contact Precautions",
    description: "What to do when contact precautions are in place.",
    sizeLabel: "229 KB",
  },
  {
    file: "Airborne-Precaution",
    title: "Airborne Precautions",
    description: "Precautions for airborne infection control.",
    sizeLabel: "576 KB",
  },
  {
    file: "Emergency-Contacts-Card-Updated-August-2026",
    title: "Emergency Contacts Card",
    description: "Key numbers to keep to hand. Updated August 2026.",
    sizeLabel: "424 KB",
  },
];

export const resourcePath = (resource: PatientResource) => `/resources/${resource.file}.pdf`;

/** Filename the browser saves as, rather than the internal one. */
export const resourceDownloadName = (resource: PatientResource) =>
  `eShifa - ${resource.title}.pdf`;
