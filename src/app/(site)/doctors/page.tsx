import type { Metadata } from "next";
import { DoctorsPage } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Our Doctors",
  description:
    "Consult certified general physicians and specialists through eShifa, with teleconsultation and in-home doctor visits across Pakistan.",
  alternates: { canonical: "/doctors" },
  openGraph: { title: "Our Doctors", description: "Consult certified general physicians and specialists through eShifa, with teleconsultation and in-home doctor visits across Pakistan.", url: "/doctors" },
};

export default function Page() {
  return <DoctorsPage />;
}
