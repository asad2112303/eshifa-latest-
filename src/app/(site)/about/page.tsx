import type { Metadata } from "next";
import { AboutPage } from "@/components/site/sections";

export const metadata: Metadata = {
  title: { absolute: "About eShifa | Quality Healthcare at Your Doorstep" },
  description:
    "eShifa is a healthcare platform delivering quality, accessible home healthcare beyond hospital walls, backed by Shifa International Hospitals.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About eShifa", description: "eShifa is a healthcare platform delivering quality, accessible home healthcare beyond hospital walls, backed by Shifa International Hospitals.", url: "/about" },
};

export default function Page() {
  return <AboutPage />;
}
