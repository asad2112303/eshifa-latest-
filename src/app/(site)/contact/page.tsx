import type { Metadata } from "next";
import { ContactPage } from "@/components/site/sections";

export const metadata: Metadata = {
  title: { absolute: "Contact eShifa | 24/7 Care Team" },
  description:
    "Contact the eShifa care team 24/7 on 051-111-111-567, or request a callback for home healthcare services across Pakistan.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contact eShifa | 24/7 Care Team", description: "Contact the eShifa care team 24/7 on 051-111-111-567, or request a callback for home healthcare services across Pakistan.", url: "/contact" },
};

export default function Page() {
  return <ContactPage />;
}
