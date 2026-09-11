"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/motion/components";
import { staggerContainer, staggerItem } from "@/motion/variants";
import { VIEWPORT_ONCE } from "@/motion/transitions";
import { serviceList, servicePath, type ServiceSlug } from "@/data/services";

/**
 * The home page services showcase: an asymmetrical bento grid of six
 * photography-led cards.
 *
 * Deliberately minimal. Each card carries a photograph and the service name and
 * nothing else — no icon, no blurb, no badge, no "Learn more" link. The whole
 * card is the link, so the name doubles as the affordance and there is nothing
 * competing with the image for attention. Descriptions live on /services, which
 * is one tap away.
 */

/**
 * Where each photograph should sit when the card crops it.
 *
 * All six share the same composition — a bright, empty left third with the
 * people right of centre — which is what lets the service name sit over the
 * left edge and stay readable.
 *
 * The tall and narrow cards are taller than the 4:3 source, so they crop
 * horizontally and only the X value does anything. A *lower* X shows more of
 * the empty left, which pushes the people further right in the card and away
 * from the name; the trio is tuned low for exactly that reason. The two wide
 * cards are wider than the source, so they crop vertically instead and X is
 * inert there.
 */
const PHOTO_POSITION: Record<ServiceSlug, string> = {
  "home-nursing": "object-[68%_center]",
  "home-laboratory": "object-[center_40%]",
  "home-pharmacy": "object-[center_40%]",
  "home-rehabilitation": "object-[56%_center]",
  "doctor-teleconsultation": "object-[45%_center]",
  "specialized-care-programs": "object-[50%_center]",
};

/**
 * Where each name breaks.
 *
 * Left to itself the text wraps against the card width, which changes at every
 * breakpoint and sends "Home Laboratory Services" across the photograph on some
 * of them. These are the breaks the layout was designed around, so they are set
 * rather than discovered. The rendered text is the service name either way.
 */
const TITLE_LINES: Record<ServiceSlug, readonly string[]> = {
  "home-nursing": ["Home Nursing", "Services"],
  "home-laboratory": ["Home Laboratory", "Services"],
  "home-pharmacy": ["Home Pharmacy", "Services"],
  "home-rehabilitation": ["Home", "Rehabilitation", "Services"],
  "doctor-teleconsultation": ["Doctor", "Teleconsultation"],
  "specialized-care-programs": ["Specialized", "Care Programs"],
};

/** Described rather than left empty: the photographs carry meaning of their own. */
const PHOTO_ALT: Record<ServiceSlug, string> = {
  "home-nursing": "An eShifa nurse sitting at the bedside of an elderly patient at home",
  "home-laboratory": "An eShifa phlebotomist labelling a blood sample beside a patient in his living room",
  "home-pharmacy": "An eShifa courier handing a sealed medicine package to a patient at her door",
  "home-rehabilitation": "An eShifa physiotherapist guiding an elderly man through a resistance band exercise",
  "doctor-teleconsultation": "A woman consulting an eShifa doctor by video call from her sofa",
  "specialized-care-programs": "An eShifa doctor reviewing a care plan on a tablet with an elderly patient",
};

/**
 * The card titles are hand-broken above, so they could drift from the service
 * data without anything failing. In development, say so instead.
 */
const titleLines = (slug: ServiceSlug): readonly string[] => {
  const lines = TITLE_LINES[slug];

  if (process.env.NODE_ENV !== "production") {
    const name = serviceList.find((item) => item.slug === slug)?.name;
    if (name && lines.join(" ") !== name) {
      console.warn(`[home-services] TITLE_LINES for "${slug}" no longer spells "${name}".`);
    }
  }
  return lines;
};

interface ServiceCardProps {
  slug: ServiceSlug;
  /**
   * The anchor card. Taller than it is wide on desktop, so the white wash runs
   * diagonally instead of straight across, and the name is set larger.
   */
  featured?: boolean;
  /** Passed to next/image so each card downloads only what it displays. */
  sizes: string;
  className?: string;
}

const ServiceCard = ({ slug, featured = false, sizes, className = "" }: ServiceCardProps) => {
  const lines = titleLines(slug);

  return (
    <Link
      href={servicePath(slug)}
      className={`group relative isolate block overflow-hidden rounded-[24px] bg-white ring-1 ring-[#0289E8]/10 shadow-[0_18px_44px_-30px_rgba(7,27,85,0.5)] transition duration-500 ease-out hover:-translate-y-1 hover:ring-[#0289E8]/30 hover:shadow-[0_30px_60px_-28px_rgba(7,27,85,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0289E8] ${className}`}
    >
      <Image
        src={`/images/services/photos/${slug}.jpg`}
        alt={PHOTO_ALT[slug]}
        fill
        sizes={sizes}
        className={`object-cover ${PHOTO_POSITION[slug]} transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]`}
      />

      {/*
        The photographs are bright on the left but not uniformly so. This wash
        guarantees contrast behind the name at every crop and viewport, and
        fades out before it reaches the subject.
      */}
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: featured
            ? "linear-gradient(152deg, #FFFFFF 0%, rgba(255,255,255,0.88) 20%, rgba(255,255,255,0.36) 42%, rgba(255,255,255,0) 62%)"
            : "linear-gradient(100deg, #FFFFFF 0%, rgba(255,255,255,0.9) 22%, rgba(255,255,255,0.42) 46%, rgba(255,255,255,0) 68%)",
        }}
      />

      <h3
        className={`relative z-10 font-bold leading-[1.25] tracking-[-0.01em] text-[#071B55] ${
          featured
            ? "p-6 text-[22px] sm:p-7 sm:text-[26px]"
            : "p-5 text-[17px] sm:p-6 sm:text-[19px] lg:text-[17px] xl:text-[18px]"
        }`}
      >
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </h3>
    </Link>
  );
};

const HomeServices = () => (
  <section id="services" className="relative overflow-hidden bg-[#F2F8FF] py-20 sm:py-24 lg:py-28">
    {/* Soft atmosphere. Purely decorative, and never over the text. */}
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-56 right-[-12%] h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(2,137,232,0.14),rgba(2,137,232,0)_62%)]" />
      <div className="absolute bottom-[-14rem] left-[-16%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(2,137,232,0.09),rgba(2,137,232,0)_62%)]" />
      <svg
        className="absolute inset-x-0 bottom-0 h-24 w-full text-white/50"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        fill="none"
      >
        <path d="M0 64C240 16 480 8 720 40s480 56 720 8v72H0V64Z" fill="currentColor" />
      </svg>
    </div>

    <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8">
      <Reveal>
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
          <h2 className="text-[clamp(1.9rem,4.6vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.025em] text-[#071B55]">
            Care Beyond Walls,
            <br />
            For a <span className="text-[#0289E8]">Healthier Tomorrow</span>
          </h2>

          <Link
            href="/services"
            className="group inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-white py-1.5 pl-6 pr-1.5 text-sm font-semibold text-[#071B55] shadow-[0_14px_34px_-16px_rgba(7,27,85,0.4)] ring-1 ring-[#0289E8]/10 transition duration-300 hover:shadow-[0_18px_40px_-16px_rgba(7,27,85,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0289E8] sm:gap-4 sm:py-2 sm:pl-7 sm:pr-2 sm:text-[15px] md:self-auto"
          >
            View All Services
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0289E8] text-white transition-transform duration-300 group-hover:translate-x-0.5 sm:h-11 sm:w-11">
              <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
            </span>
          </Link>
        </div>
      </Reveal>

      {/*
        Desktop composition: a full-height anchor card on the left, a pair above
        and a trio below on the right. Fixed row heights are what make the anchor
        span cleanly; below lg the cards fall back to their own aspect ratios and
        stack, so nothing depends on a fixed height on small screens.
      */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT_ONCE}
        className="mt-12 grid gap-4 sm:gap-5 lg:mt-16 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.9fr)] lg:grid-rows-[264px_264px]"
      >
        <motion.div variants={staggerItem} className="lg:row-span-2">
          <ServiceCard
            slug="home-nursing"
            featured
            sizes="(max-width: 1023px) 92vw, 32vw"
            className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto lg:h-full"
          />
        </motion.div>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
          {(["home-laboratory", "home-pharmacy"] as const).map((slug) => (
            <motion.div key={slug} variants={staggerItem} className="h-full">
              <ServiceCard
                slug={slug}
                sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 31vw"
                className="aspect-[16/10] sm:aspect-[16/11] lg:aspect-auto lg:h-full"
              />
            </motion.div>
          ))}
        </div>

        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(["home-rehabilitation", "doctor-teleconsultation", "specialized-care-programs"] as const).map((slug) => (
            <motion.div key={slug} variants={staggerItem} className="h-full">
              <ServiceCard
                slug={slug}
                sizes="(max-width: 639px) 92vw, (max-width: 1023px) 46vw, 21vw"
                className="aspect-[16/10] sm:aspect-[16/11] lg:aspect-auto lg:h-full"
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default HomeServices;
