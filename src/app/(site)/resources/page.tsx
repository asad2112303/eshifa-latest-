import type { Metadata } from "next";
import { PatientResourcesPage } from "@/components/site/patient-resources-page";

export const metadata: Metadata = {
  title: "Patient Resources",
  description:
    "Downloadable patient and family education leaflets from eShifa: hand washing, fall prevention, contact and airborne precautions, and emergency contacts.",
  alternates: { canonical: "/resources" },
  openGraph: {
    title: "Resources for Patient & Family Education",
    description:
      "Printable guidance on infection control, safety at home, and emergency contacts.",
    url: "/resources",
  },
};

export default function Page() {
  return <PatientResourcesPage />;
}
