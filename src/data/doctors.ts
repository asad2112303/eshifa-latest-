/**
 * Doctors and allied health professionals available for eShifa tele
 * consultation.
 *
 * Source: the "Expert Healthcare, Just a Call Away" tele consultation flyer
 * (October 2026). Names, qualifications and designations are reproduced as
 * printed there. Portraits come from the eShifa doctor photo set supplied in
 * October 2026 (studio shots on white), resized to 640x800 JPEGs under
 * public/images/doctors/. Dr. Quainat Amin Khan and Rabia Siddiqui were shot
 * wider than the rest, so their files are cropped from the originals to match
 * the head-and-shoulders framing of the other three. A doctor without a photo
 * falls back to a profession icon on the page.
 */

export type DoctorKind = "physician" | "nutritionist";

export interface Doctor {
  /** Name with honorific exactly as printed, e.g. "Dr. Maryam Sharif". */
  name: string;
  /** Clinical discipline where the flyer states one separately. */
  specialty?: string;
  /** Degrees and diplomas as printed, e.g. "MBBS, FCPS". */
  qualifications: string;
  /** Designation shown as the badge, e.g. "Medical Specialist". */
  designation: string;
  /** Picks the fallback icon when there is no photo; the badge text stays the source of truth. */
  kind: DoctorKind;
  /** Portrait file name under public/images/doctors/, e.g. "maryam-sharif.jpg". */
  photo?: string;
}

export const doctors: Doctor[] = [
  {
    name: "Dr. Quainat Amin Khan",
    specialty: "Internal Medicine",
    qualifications: "MBBS, FCPS",
    designation: "Medical Specialist",
    kind: "physician",
    photo: "quainat-amin-khan.jpg",
  },
  {
    name: "Dr. Maryam Sharif",
    specialty: "Internal Medicine",
    qualifications: "MBBS, FCPS",
    designation: "Medical Specialist",
    kind: "physician",
    photo: "maryam-sharif.jpg",
  },
  {
    name: "Dr. Saeeda Ahmed Rani",
    qualifications: "BSc, MBBS, MRCGP UK, DRCOG, PG Diploma Clinical Dermatology",
    designation: "Consultant Family Medicine",
    kind: "physician",
    photo: "saeeda-ahmed-rani.jpg",
  },
  {
    name: "Ms. Tajwer",
    qualifications: "Bachelors in Human Nutrition & Dietetics, Masters in Public Health (Ongoing)",
    designation: "Nutritionist",
    kind: "nutritionist",
    photo: "tajwer.jpg",
  },
  {
    name: "Rabia Siddiqui",
    qualifications: "Bachelors (Hons.) in Human Nutrition & Dietetics",
    designation: "Nutritionist",
    kind: "nutritionist",
    photo: "rabia-siddiqui.jpg",
  },
];

/** The credential line under a name: specialty first, then degrees, as the flyer prints it. */
export function doctorCredentials(doctor: Doctor): string {
  return [doctor.specialty, doctor.qualifications].filter(Boolean).join(", ");
}
