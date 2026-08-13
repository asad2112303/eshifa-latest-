import type { Metadata } from "next";
import { PartnerPage } from "@/components/site/sections";

const description =
  "Partner with eShifa, Pakistan's first digital and home healthcare services provider. Lab collection point and telemedicine franchise models, investment requirements, revenue share and partner support.";

export const metadata: Metadata = {
  title: "Healthcare Partnership",
  description,
  alternates: { canonical: "/partner" },
  openGraph: { title: "Healthcare Partnership with eShifa", description, url: "/partner" },
};

export default function Page() {
  return <PartnerPage />;
}
