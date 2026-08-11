import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar, Footer } from "@/components/site/sections";
import { siteConfig, absoluteUrl } from "@/lib/site-config";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Quality Healthcare at Your Doorstep | eShifa Pakistan",
    template: "%s | eShifa",
  },
  description:
    "Pakistan's first JCI-accredited home healthcare — laboratory, nursing, rehabilitation, pharmacy, teleconsultation and vaccination at home. 24/7 nationwide. UAN: 051-111-111-567.",
  keywords: [
    "home healthcare Pakistan",
    "home nursing Pakistan",
    "home laboratory services",
    "home rehabilitation Pakistan",
    "home pharmacy delivery",
    "doctor teleconsultation Pakistan",
    "home vaccination Pakistan",
    "JCI accredited home care",
  ],
  authors: [{ name: "eShifa" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "eShifa",
    locale: "en_PK",
    url: "/",
    title: "Quality Healthcare at Your Doorstep | eShifa Pakistan",
    description:
      "Pakistan's first JCI-accredited home healthcare — laboratory, nursing, rehabilitation, pharmacy, teleconsultation and vaccination at home.",
    images: [{ url: "/opengraph.jpg", width: 1200, height: 630, alt: "eShifa home healthcare" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quality Healthcare at Your Doorstep | eShifa Pakistan",
    description: "JCI-accredited home healthcare in Pakistan — nursing, labs, pharmacy, rehab, teleconsult, vaccination.",
    images: ["/opengraph.jpg"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0289E8",
};

/** Organization-level structured data, emitted once for the whole site. */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  "@id": siteConfig.url,
  name: "eShifa",
  legalName: siteConfig.legalName,
  slogan: siteConfig.slogan,
  description:
    "Pakistan's first JCI-accredited home healthcare service offering home laboratory, nursing, rehabilitation, pharmacy and medical equipment services, alongside teleconsultation and specialized care programs, 24/7 nationwide",
  url: siteConfig.url,
  logo: absoluteUrl("/eshifa-logo.png"),
  telephone: siteConfig.contact.uanE164,
  email: siteConfig.contact.email,
  foundingDate: "2019-12-16",
  parentOrganization: { "@type": "Organization", name: "Shifa International Hospitals Ltd." },
  sameAs: [siteConfig.social.facebook],
  address: {
    "@type": "PostalAddress",
    streetAddress: "Plot No. 17-18, 2nd Floor, EOBI Building, I-8 Markaz",
    addressLocality: "Islamabad",
    addressRegion: "Islamabad Capital Territory",
    postalCode: "44000",
    addressCountry: "PK",
  },
  areaServed: ["PK"],
  award: "JCI Accreditation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen w-full bg-white text-[#444444] font-sans selection:bg-[#1B004E] selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
