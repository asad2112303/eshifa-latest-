import type { Metadata } from "next";
import { InternationalPatientsPage } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "International Patients",
  description:
    "eShifa supports overseas Pakistani families in the UK, US and Middle East with coordinated home healthcare for relatives in Pakistan.",
  alternates: { canonical: "/international" },
  openGraph: { title: "International Patients", description: "eShifa supports overseas Pakistani families in the UK, US and Middle East with coordinated home healthcare for relatives in Pakistan.", url: "/international" },
};

export default function Page() {
  return <InternationalPatientsPage />;
}
