import { ReactNode, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, ChevronRight, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServiceGlyph } from "@/components/icons/service-glyphs";
import { Reveal } from "@/motion/components";
import { staggerContainer, staggerItem } from "@/motion/variants";
import { VIEWPORT_ONCE } from "@/motion/transitions";
import { services, serviceList, servicePath, type ServiceContent, type ServiceSlug } from "@/data/services";

/**
 * Reusable building blocks for the six service pages. Each page composes these
 * from its entry in `src/data/services.ts` — there is no per-service markup, so
 * a layout fix here lands on all six pages at once.
 */

const CARD =
  "group card-lift rounded-2xl border border-[#ECECEC] hover:border-[#0289E8]/30 hover:shadow-lg";

const Eyebrow = ({ children }: { children: ReactNode }) => (
  <div className="text-sm font-medium uppercase tracking-[0.15em] text-[#1B004E] mb-4">{children}</div>
);

/* ------------------------------------------------------------------ Hero */

export function ServiceHero({ service }: { service: ServiceContent }) {
  return (
    <section className="relative bg-gradient-to-b from-[#EAF4FF] via-[#F5F9FF] to-white pt-32 pb-16 sm:pt-36 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-[#777777]">
            <li>
              <Link href="/" className="hover:text-[#0289E8] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-4 h-4" />
            </li>
            <li>
              <Link href="/services" className="hover:text-[#0289E8] transition-colors">
                Our Services
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="w-4 h-4" />
            </li>
            <li aria-current="page" className="font-medium text-[#1B004E]">
              {service.shortName}
            </li>
          </ol>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div
              variants={staggerItem}
              className="inline-flex items-center gap-3 rounded-full border border-[#0289E8]/20 bg-white px-4 py-2 mb-6"
            >
              <ServiceGlyph slug={service.slug} size={20} strokeWidth={1.75} className="text-[#0289E8]" />
              <span className="text-sm font-semibold text-[#1B004E]">{service.name}</span>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-4xl sm:text-5xl font-light leading-[1.08] text-[#1B004E] mb-6"
            >
              {service.hero.headline}
            </motion.h1>

            <motion.p variants={staggerItem} className="text-lg text-[#444444] leading-relaxed max-w-xl mb-8">
              {service.hero.supporting}
            </motion.p>

            <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
              <Button asChild className="rounded-[80px] bg-[#0289E8] hover:bg-[#0289E8] text-white px-7 py-6 font-semibold">
                <Link href={service.hero.primaryCta.href}>{service.hero.primaryCta.label}</Link>
              </Button>
              <Button
                asChild
                className="rounded-[80px] border border-[#0289E8] bg-white text-[#0289E8] hover:bg-[#F5F5F5] px-7 py-6 font-semibold"
              >
                <Link href={service.hero.secondaryCta.href}>{service.hero.secondaryCta.label}</Link>
              </Button>
            </motion.div>

            <motion.p variants={staggerItem} className="mt-6 flex items-center gap-2 text-sm text-[#777777]">
              <CheckCircle2 className="w-4 h-4 text-[#0E7A4E] shrink-0" aria-hidden="true" />
              {service.hero.trustIndicator}
            </motion.p>
          </motion.div>

          <Reveal direction="right">
            <img
              src={`${import.meta.env.BASE_URL}images/${service.hero.image}`}
              alt={service.hero.imageAlt}
              className="w-full aspect-[4/3] rounded-[28px] object-cover shadow-xl"
              width={800}
              height={600}
              decoding="async"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- About */

export function ServiceAbout({ service }: { service: ServiceContent }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <Reveal>
          <Eyebrow>About the Service</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-8">{service.about.heading}</h2>
        </Reveal>
        <div className="space-y-5">
          {service.about.paragraphs.map((paragraph, i) => (
            <Reveal key={paragraph.slice(0, 32)} delay={i * 60}>
              <p className="text-lg text-[#444444] leading-relaxed">{paragraph}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Benefits */

export function ServiceBenefits({ service }: { service: ServiceContent }) {
  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Key Benefits</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E]">What This Service Gives You</h2>
        </Reveal>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {service.benefits.map((benefit) => (
            <motion.li key={benefit} variants={staggerItem} className={`${CARD} bg-white flex items-start gap-4 p-6`}>
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0289E8]/8 text-[#0289E8]">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-base leading-relaxed text-[#1B004E] font-medium">{benefit}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Included */

export function ServiceIncluded({ service }: { service: ServiceContent }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <Reveal>
          <Eyebrow>What's Included</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-5">{service.included.heading}</h2>
          {service.included.note && (
            <p className="flex items-start gap-3 rounded-2xl border border-[#ECECEC] bg-[#F9FAFB] p-5 text-base leading-relaxed text-[#444444]">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0289E8]" aria-hidden="true" />
              {service.included.note}
            </p>
          )}
        </Reveal>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="space-y-3"
        >
          {service.included.items.map((item) => (
            <motion.li
              key={item}
              variants={staggerItem}
              className="flex items-start gap-3 text-lg leading-relaxed text-[#444444]"
            >
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#0E7A4E]" aria-hidden="true" />
              <span>{item}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Process */

export function ServiceProcess({ service }: { service: ServiceContent }) {
  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E]">From Booking to Care</h2>
        </Reveal>

        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {service.steps.map((step, index) => (
            <motion.li key={step.title} variants={staggerItem} className={`${CARD} bg-white h-full p-6`}>
              <span
                aria-hidden="true"
                className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0289E8] text-base font-semibold text-white"
              >
                {index + 1}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-[#1B004E]">{step.title}</h3>
              <p className="text-base leading-relaxed text-[#444444]">{step.body}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Audience */

export function ServiceAudience({ service }: { service: ServiceContent }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <Reveal>
          <Eyebrow>Who It Is For</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-8">{service.audience.heading}</h2>
        </Reveal>
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid gap-4 sm:grid-cols-2"
        >
          {service.audience.items.map((item) => (
            <motion.li
              key={item}
              variants={staggerItem}
              className={`${CARD} bg-[#F9FAFB] flex items-start gap-3 p-5`}
            >
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#0E7A4E]" aria-hidden="true" />
              <span className="text-base leading-relaxed text-[#444444]">{item}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- Trust */

export function ServiceTrust({ service }: { service: ServiceContent }) {
  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <Reveal>
          <Eyebrow>Why Choose eShifa</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-8">{service.trust.heading}</h2>
        </Reveal>
        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="space-y-4"
        >
          {service.trust.points.map((point) => (
            <motion.li key={point} variants={staggerItem} className={`${CARD} bg-white flex items-start gap-4 p-6`}>
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#0E7A4E]" aria-hidden="true" />
              <span className="text-lg leading-relaxed text-[#444444]">{point}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- FAQ */

function FaqItem({ faq, index }: { faq: { q: string; a: string }; index: number }) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;

  return (
    <div className="rounded-2xl border border-[#ECECEC] bg-white overflow-hidden">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-[#F9FAFB]"
        >
          <span className="text-lg font-semibold text-[#1B004E]">{faq.q}</span>
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-[#0289E8] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 text-base leading-relaxed text-[#444444]">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ServiceFAQ({ service }: { service: ServiceContent }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        <Reveal className="text-center mb-10">
          <Eyebrow>FAQs</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E]">Frequently Asked Questions</h2>
        </Reveal>

        {service.notice && (
          <Reveal>
            <p className="mb-8 flex items-start gap-3 rounded-2xl border border-[#ED3237]/25 bg-[#FDF0F0] p-5 text-base leading-relaxed text-[#444444]">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#ED3237]" aria-hidden="true" />
              <span>{service.notice}</span>
            </p>
          </Reveal>
        )}

        <div className="space-y-4">
          {service.faqs.map((faq, index) => (
            <Reveal key={faq.q} delay={index * 40}>
              <FaqItem faq={faq} index={index} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- Related services */

export function RelatedServices({ service }: { service: ServiceContent }) {
  return (
    <section className="py-20 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <Eyebrow>Related Services</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E]">Other Ways We Can Help</h2>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid gap-6 md:grid-cols-3"
        >
          {service.related.map((slug) => (
            <motion.div key={slug} variants={staggerItem}>
              <ServiceCard service={services[slug]} tone="grey" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Final CTA */

export function ServiceFinalCTA({ service }: { service: ServiceContent }) {
  return (
    <section className="py-16 bg-[#ED3237] text-white">
      <Reveal className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-light mb-3">{service.finalCta.heading}</h2>
          <p className="text-lg text-white max-w-2xl">{service.finalCta.body}</p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Button asChild className="rounded-[80px] bg-white hover:bg-white/90 text-[#1B004E] font-semibold px-8 py-6">
            <Link href="/contact">{service.hero.primaryCta.label}</Link>
          </Button>
          <Button
            asChild
            className="rounded-[80px] border border-white bg-transparent text-white hover:bg-white/10 font-semibold px-8 py-6"
          >
            <a href="tel:051111111567">Call 051-111-111-567</a>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

/* -------------------------------------------------------- Shared service card */

/**
 * The service card used by the /services grid, the home page grid and the
 * related-services strip. The whole card is a single link, so the entire surface
 * is clickable and there is exactly one tab stop per card.
 */
export function ServiceCard({ service, tone = "white" }: { service: ServiceContent; tone?: "white" | "grey" }) {
  return (
    <Link
      href={servicePath(service.slug)}
      className={`${CARD} ${tone === "grey" ? "bg-white" : "bg-[#F9FAFB]"} flex h-full flex-col p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0289E8] focus-visible:ring-offset-2`}
    >
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0289E8]/8 text-[#0289E8] transition-transform duration-200 group-hover:scale-105">
        <ServiceGlyph slug={service.slug} size={32} strokeWidth={1.5} />
      </span>

      <h3 className="mb-3 text-xl font-semibold text-[#1B004E] transition-colors group-hover:text-[#0289E8]">
        {service.name}
      </h3>
      <p className="mb-6 flex-1 text-base leading-relaxed text-[#777777]">{service.cardBlurb}</p>

      <span className="inline-flex items-center gap-2 text-base font-semibold text-[#0289E8]">
        Learn More
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

/** The six-card grid, shared by /services and the home page. */
export function ServiceCardGrid({ tone = "white" }: { tone?: "white" | "grey" }) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {serviceList.map((service) => (
        <motion.div key={service.slug} variants={staggerItem}>
          <ServiceCard service={service} tone={tone} />
        </motion.div>
      ))}
    </motion.div>
  );
}

export type { ServiceSlug };
