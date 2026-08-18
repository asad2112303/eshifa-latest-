import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { services, serviceOrder, servicePath, isServiceSlug } from "@/data/services";
import { absoluteUrl, siteConfig } from "@/lib/site-config";
import {
  ServiceHero,
  ServiceAbout,
  ServiceBenefits,
  ServiceIncluded,
  ServiceProcess,
  ServiceAudience,
  ServiceTrust,
  ServiceFAQ,
  RelatedServices,
  ServiceFinalCTA,
} from "@/components/service/sections";

/** Pre-render all six service pages at build time. */
export function generateStaticParams() {
  return serviceOrder.map((slug) => ({ slug }));
}

/** Any slug outside the six returns a 404 rather than rendering. */
export const dynamicParams = false;

/** Next 15+ delivers route params asynchronously. */
type RouteParams = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  if (!isServiceSlug(slug)) return {};
  const { seo } = services[slug];
  const url = servicePath(slug);

  return {
    title: seo.title.replace(" | eShifa", ""), // layout template appends "| eShifa"
    description: seo.description,
    alternates: { canonical: url },
    openGraph: { title: seo.ogTitle, description: seo.ogDescription, url },
    twitter: { title: seo.ogTitle, description: seo.ogDescription },
  };
}

export default async function ServicePage({ params }: RouteParams) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) notFound();

  const service = services[slug];

  /** FAQPage structured data, generated from the same content the page renders. */
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: service.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.seo.description,
    url: absoluteUrl(servicePath(service.slug)),
    provider: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    areaServed: { "@type": "Country", name: "Pakistan" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <ServiceHero service={service} />
      <ServiceAbout service={service} />
      <ServiceBenefits service={service} />
      <ServiceIncluded service={service} />
      <ServiceProcess service={service} />
      <ServiceAudience service={service} />
      <ServiceTrust service={service} />
      <RelatedServices service={service} />
      <ServiceFAQ service={service} />
      <ServiceFinalCTA service={service} />
    </>
  );
}
