import type { Metadata } from "next";
import { ServicesPage } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Home Healthcare Services",
  description:
    "Explore eShifa home healthcare services: home nursing, laboratory, pharmacy, rehabilitation, doctor teleconsultation and vaccination, delivered across Pakistan.",
  alternates: { canonical: "/services" },
  openGraph: { title: "Home Healthcare Services", description: "Explore eShifa home healthcare services: home nursing, laboratory, pharmacy, rehabilitation, doctor teleconsultation and vaccination, delivered across Pakistan.", url: "/services" },
};

export default function Page() {
  return <ServicesPage />;
}
