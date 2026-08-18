import type { Metadata } from "next";
import { LabsPage } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Lab Centers & Home Lab Tests",
  description:
    "Book home lab sample collection with eShifa. Trained phlebotomists, secure sample handling and digital reports across Pakistan.",
  alternates: { canonical: "/labs" },
  openGraph: { title: "Lab Centers & Home Lab Tests", description: "Book home lab sample collection with eShifa. Trained phlebotomists, secure sample handling and digital reports across Pakistan.", url: "/labs" },
};

export default function Page() {
  return <LabsPage />;
}
