import { useSeo } from "@/hooks/use-seo";
import { isServiceSlug, services, servicePath } from "@/data/services";
import NotFound from "@/pages/not-found";
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

/**
 * One page implementation for all six services.
 *
 * The route is dynamic (`/services/:slug`); content comes entirely from
 * `src/data/services.ts`. An unrecognised slug renders the 404 page rather than
 * throwing, so a mistyped URL degrades gracefully.
 */
export default function ServicePage({ params }: { params: { slug: string } }) {
  const slug = params.slug;

  if (!isServiceSlug(slug)) {
    return <NotFound />;
  }

  return <ServiceDetail slug={slug} />;
}

/** Split out so the SEO hook is never called conditionally. */
function ServiceDetail({ slug }: { slug: keyof typeof services }) {
  const service = services[slug];

  useSeo({
    title: service.seo.title,
    description: service.seo.description,
    path: servicePath(slug),
    ogTitle: service.seo.ogTitle,
    ogDescription: service.seo.ogDescription,
  });

  return (
    <>
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
