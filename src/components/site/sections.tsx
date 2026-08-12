"use client";

import React, { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Reveal, AnimatedWords } from "@/motion/components";
import { staggerContainer, staggerItem, fadeDown, drawerAnimation } from "@/motion/variants";
import { springSmooth, VIEWPORT_ONCE } from "@/motion/transitions";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { ServiceGlyph } from "@/components/icons/service-glyphs";
import { ServiceCardGrid } from "@/components/service/sections";
import { serviceList, servicePath, type ServiceSlug } from "@/data/services";
import { normalizePakistaniPhone } from "@/lib/callback-validation";
import { trackEvent } from "@/lib/analytics";
import { callbackServiceOptions } from "@/data/callback-services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FaFacebookF } from "react-icons/fa";
import {
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ArrowDown,
  ArrowRight,
  Globe,
  UserRoundCheck,
  ShieldCheck,
  ClipboardList,
  CheckCircle2,
  Smartphone,
  ChevronDown,
} from "lucide-react";

const APPLE_STORE_URL = "https://apps.apple.com/pk/app/eshifa/id1525359185";
const PLAY_STORE_URL = "https://play.google.com/store/search?q=eShifa&c=apps";
const FACEBOOK_URL = "https://facebook.com/eshifa.official";
const CONTACT_EMAIL = "info@eshifa.org";
const UAN_DISPLAY = "051-111-111-567";
const BRAND_PROMISE = "Quality Healthcare at Your Doorstep";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Our Services" },
  { href: "/doctors", label: "Our Doctors" },
  { href: "/labs", label: "Lab Centers" },
  { href: "/international", label: "International Patients" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const transparentHeroRoutes = ["/", "/services", "/doctors", "/labs"];

/**
 * Shared card shell. Every content card on the site composes one of these so the
 * radius, border, hover lift, and focus of attention stay identical everywhere.
 * The only thing that varies is the fill, which is always offset one step from
 * the section behind it — grey card on a white section, white card on a grey one.
 */
const CARD_SHELL = "group card-lift rounded-2xl border border-[#ECECEC] hover:border-[#0289E8]/30 hover:shadow-lg";
/** Use inside sections with a white background. */
const CARD_ON_WHITE = `${CARD_SHELL} bg-[#F9FAFB]`;
/** Use inside sections with a grey (#F5F5F5 / #F3F4F6) background. */
const CARD_ON_GREY = `${CARD_SHELL} bg-white`;


const carePrograms = [
  {
    title: "Diabetes Care Plan",
    image: "diabetes-care-plan.png",
    alt: "eShifa nurse performing a home blood sugar test for an elderly patient in Pakistan",
    body: "Personalized home-based diabetes management with regular blood sugar monitoring, medication support, dietary guidance, and ongoing clinical follow-up.",
  },
  {
    title: "Elderly Care Plan",
    image: "elderly-care-plan.png",
    alt: "eShifa caregiver supporting an elderly patient at home in Pakistan",
    body: "Personalized home care for elderly and dependent individuals, focused on regular health monitoring, medication support, daily care needs, and coordinated clinical follow-up.",
  },
  {
    title: "LRTI Care Plan",
    image: "lrti-care-plan.png",
    alt: "eShifa clinician assessing a patient's breathing at home in Pakistan",
    body: "Home-based care and monitoring for patients with lower respiratory tract infections, including symptom monitoring, medication support, respiratory assessment, and timely clinical intervention.",
  },
  {
    title: "Arthritis Care Plan",
    image: "arthritis-care-plan.png",
    alt: "eShifa therapist supporting joint mobility for an arthritis patient at home",
    body: "Comprehensive home-based support for arthritis patients, focusing on pain management, mobility, medication adherence, physiotherapy, and ongoing clinical monitoring.",
  },
  {
    title: "Post Stroke Care Plan",
    image: "post-stroke-care-plan.png",
    alt: "eShifa therapist assisting a stroke recovery patient with mobility at home",
    body: "Specialized home-based care for stroke recovery, supporting mobility, speech, daily activities, medication management, and prevention of complications through coordinated follow-up.",
  },
  {
    title: "Mother & Baby Care Plan",
    image: "mother-baby-care-plan.png",
    alt: "eShifa nurse providing postnatal care to a mother and newborn at home",
    body: "Comprehensive home-based support for mothers and newborns, covering postnatal care, newborn monitoring, breastfeeding support, and guidance for healthy mother-and-baby recovery.",
  },
  {
    title: "Dengue Home Monitoring",
    image: "dengue-home-monitoring.png",
    alt: "eShifa nurse monitoring vital signs of a dengue patient at home",
    body: "Comprehensive home-based monitoring and supportive care for dengue patients, including regular vital signs monitoring, symptom assessment, hydration support, and timely escalation when required.",
  },
  {
    title: "Home Phototherapy Care Plan",
    image: "home-phototherapy-care-plan.png",
    alt: "Newborn receiving eShifa home phototherapy treatment under clinical supervision",
    body: "Specialized home phototherapy support for eligible patients, with treatment monitoring, safety guidance, and regular follow-up to ensure effective and safe care.",
  },
];

const coreValues = [
  { name: "Integrity" },
  { name: "Respect" },
  { name: "Innovation" },
  { name: "Self-Learning" },
  { name: "Team Working" },
  { name: "Professionalism" },
  {
    name: "Global Trust",
    note: "Trusted by overseas Pakistanis (UK, US, Middle East) who depend on a reliable, accountable home-care presence for their families back home.",
  },
];

const visionStatement = "To be the region's leader by providing Quality Healthcare Services beyond boundaries.";
const missionStatement = "Healthcare with compassion for all.";

/** Rendered as alternating image/text sections, matching the service-detail layout. */
const visionMissionSections = [
  {
    eyebrow: "OUR PURPOSE",
    title: "Our Vision",
    body: visionStatement,
    image: "lab.png",
    alt: "eShifa healthcare professional delivering quality diagnostic care at a patient's home in Pakistan",
  },
  {
    eyebrow: "OUR PURPOSE",
    title: "Our Mission",
    body: missionStatement,
    image: "rehab.png",
    alt: "eShifa nurse supporting an elderly patient with compassionate care at home in Pakistan",
  },
];

const aboutParagraphs = [
  "SIHT (Private) Limited (“the Company”) was incorporated in Pakistan on December 16, 2019, as a private limited company under the Companies Act, 2017. The Company is a wholly owned subsidiary of Shifa International Hospitals Ltd. and Shifa Foundation.",
  "eShifa is a healthcare platform focused on delivering quality, accessible, and convenient healthcare services beyond traditional healthcare settings. Powered by the expertise and healthcare ecosystem of Shifa, eShifa brings a comprehensive range of healthcare services closer to individuals and families by delivering quality and compassionate care at their doorstep.",
  "eShifa is committed to transforming the traditional healthcare experience through innovation, technology, convenience, and patient-centered care. By reducing the need for unnecessary travel and waiting times, eShifa aims to make quality healthcare more accessible while ensuring that patients receive professional and compassionate care when and where they need it.",
  "With a commitment to continuous improvement and innovation, eShifa strives to create a seamless healthcare experience that connects patients with trusted healthcare services beyond the boundaries of conventional healthcare facilities.",
];

const companyFacts = [
  { label: "Legal Entity", value: "SIHT (Private) Limited" },
  { label: "Parent Organization", value: "Shifa International Hospitals Ltd. (SIHL) & Shifa Foundation" },
  { label: "Incorporated", value: "16 December 2019, under the Companies Act, 2017" },
];

const accessSteps = [
  {
    title: "Download the App",
    body: "Search “eShifa” on the Google Play Store or Apple App Store to book services, track visits, and receive results.",
    icon: Smartphone,
  },
  {
    title: "Call the Helpline",
    body: `Connect instantly with our care team via the 24/7 UAN line (${UAN_DISPLAY}).`,
    icon: Phone,
  },
];

/**
 * A section either has a photograph *with* its alt text, or has neither and
 * falls back to the icon panel. Modelling it as a union means an image can never
 * be rendered without alt text.
 */
type AlternatingSection = {
  title: string;
  /** Links the section through to its dedicated service page. */
  slug: ServiceSlug;
  points: string[];
} & ({ image: string; alt: string } | { image?: undefined; alt?: undefined });

const servicesAlternatingSections: AlternatingSection[] = [
  {
    title: "Home Nursing Services",
    slug: "home-nursing",
    image: "nursing.png",
    alt: "eShifa certified nurse providing home nursing care in Islamabad Pakistan",
    points: [
      "Disease-based nursing care and general nursing support",
      "IV cannulation and infusions, wound care, and catheterization",
      "Post-surgical care and daily clinical monitoring at the bedside",
    ],
  },
  {
    title: "Home Laboratory Services",
    slug: "home-laboratory",
    image: "lab.png",
    alt: "eShifa phlebotomist collecting home lab sample for patient in Lahore",
    points: [
      "Home sample collection at your preferred time",
      "An extensive laboratory network across Pakistan",
      "Digital reports delivered via the app or SMS for doctor review",
    ],
  },
  {
    title: "Home Pharmacy Services",
    slug: "home-pharmacy",
    image: "pharmacy.png",
    alt: "eShifa pharmacist verified home medicine delivery in Pakistan",
    points: [
      "Prescribed, over-the-counter, and specialized medications",
      "Careful packaging including cold-chain where required",
      "Convenient home delivery across major cities",
    ],
  },
  {
    title: "Home Rehabilitation Services",
    slug: "home-rehabilitation",
    image: "rehab.png",
    alt: "eShifa physiotherapist delivering home rehabilitation therapy in Pakistan",
    points: [
      "Physiotherapy, speech therapy, and occupational therapy",
      "Personalized rehabilitation plans delivered in your home",
      "Focused on supporting recovery and improving quality of life",
    ],
  },
  {
    title: "Doctor Teleconsultation",
    slug: "doctor-teleconsultation",
    image: "teleconsultation.png",
    alt: "Patient consulting an eShifa certified physician by video teleconsultation in Pakistan",
    points: [
      "General physician and specialist consultations",
      "Digital prescriptions recorded in your care record",
      "Care continues without interruption through integrated services",
    ],
  },
  {
    title: "Home Vaccination Services",
    slug: "home-vaccination",
    image: "vaccination.png",
    alt: "eShifa nurse administering a vaccination at home with a cold-chain carrier in Pakistan",
    points: [
      "Routine vaccinations administered at home",
      "Travel vaccinations arranged before you depart",
      "Given safely by certified clinical staff",
    ],
  },
];

const medicalEquipmentItems = [
  "Oxygen Concentrators",
  "Nebulizers",
  "Suction Machines",
  "BiPAP and CPAP Machines",
  "Cardiac Monitors",
];

const whyChooseItems = [
  "Pakistan's first JCI-accredited home healthcare provider",
  "In a largely unregulated home healthcare market, eShifa provides access to highly experienced, qualified, and trained healthcare professionals",
  "Home health services are provided at the patient's doorstep",
  "Reduced travel costs for patients",
  "No hassle, long queues, or unnecessary waiting with our home health services",
  "Reduced risk of hospital-acquired infections",
  "Service tracking through a mobile app, with results delivered via the app or SMS",
  "Secure management of patient databases, accessible from anywhere in the world",
  "Home health services offer convenient medical care options for elderly, frail, and housebound patients",
];

const homeFaqItems = [
  {
    q: "What is eShifa?",
    a: "eShifa is Pakistan's first JCI-accredited home healthcare service, offering home laboratory, nursing, rehabilitation, pharmacy, and medical equipment services, alongside teleconsultation and specialized care programs, across Islamabad, Lahore, and nationwide.",
  },
  {
    q: "How do I book an eShifa service?",
    a: `You can book in two ways: download the eShifa app from the Google Play Store or Apple App Store, or call our 24/7 UAN helpline at ${UAN_DISPLAY}.`,
  },
  {
    q: "What specialized care programs does eShifa offer?",
    a: "eShifa runs eight home-based care programs: Diabetes, Elderly, LRTI, Arthritis, Post Stroke, Mother & Baby, Dengue Home Monitoring, and Home Phototherapy.",
  },
  {
    q: "Can I rent medical equipment for use at home?",
    a: "Yes. eShifa offers convenient rental of essential medical equipment, including oxygen concentrators, nebulizers, suction machines, BiPAP and CPAP machines, and cardiac monitors.",
  },
  {
    q: "Is eShifa available in Islamabad and Lahore?",
    a: "Yes. eShifa operates 24/7 in Islamabad and Lahore, with expanding coverage across Pakistan's major cities and home sample collection across 80+ points nationwide.",
  },
  {
    q: "What does JCI accreditation mean for patients?",
    a: "JCI accreditation confirms that eShifa meets leading international clinical safety and quality standards for home healthcare.",
  },
  {
    q: "Can overseas Pakistanis manage care through eShifa?",
    a: "Yes. eShifa provides dedicated coordination for diaspora families in the UK, US, and Middle East with regular updates and managed care plans.",
  },
  {
    q: "How quickly can eShifa send support?",
    a: "eShifa operates 24/7. Response times vary by location and service; call the care team or submit a callback request for scheduling.",
  },
];

const doctorNetworkItems = [
  "General Physicians - same-day urgent consultations and ongoing primary care",
  "Specialist Network - cardiology, endocrinology, orthopaedics, paediatrics, and more",
  "Teleconsult Support - dedicated coordination for patients requiring multi-disciplinary input",
];

const labWhyItems = [
  "Certified, trained phlebotomists with hospital-grade protocols",
  "80+ home collection points across Pakistan",
  "Secure sample handling and cold-chain transport",
  "Digital reports delivered to you and your doctor",
  "Ideal for seniors, children, pregnant women, and busy professionals",
  "Available in Islamabad, Lahore, and expanding cities",
];

const internationalCards = [
  {
    title: "Dedicated Care Coordinator",
    body: "A single point of contact who understands your case, communicates proactively, and escalates when needed.",
    icon: UserRoundCheck,
  },
  {
    title: "Continuity of Care Across Time Zones",
    body: "24/7 operations so families abroad can manage updates and care decisions confidently.",
    icon: Globe,
  },
  {
    title: "Transparent, Regular Updates",
    body: "Clinical summaries, lab updates, and care plan changes delivered in your preferred format.",
    icon: ClipboardList,
  },
  {
    title: "Full Service Ecosystem",
    body: "Nursing, labs, pharmacy, and specialists coordinated through one trusted platform.",
    icon: ShieldCheck,
  },
];

function detectStoreUrl() {
  if (typeof navigator === "undefined") return APPLE_STORE_URL;

  const ua = navigator.userAgent.toLowerCase();
  return ua.includes("android") || ua.includes("windows") ? PLAY_STORE_URL : APPLE_STORE_URL;
}

/**
 * Resolves the app store link for the visitor's platform.
 *
 * Reading `navigator` during render caused a hydration mismatch: the server
 * always produced the Apple URL while an Android client produced the Play URL,
 * and React logged "this won't be patched up" — leaving Android users pointed at
 * the App Store. Instead the first client render matches the server, and the
 * platform-specific URL is applied in an effect after hydration.
 */
function useStoreUrl() {
  const [storeUrl, setStoreUrl] = useState(APPLE_STORE_URL);

  useEffect(() => {
    setStoreUrl(detectStoreUrl());
  }, []);

  return storeUrl;
}


/**
 * Stand-in for a service photograph, used where no image exists yet.
 * Matches the photo slot exactly — same radius, shadow and 4:3 ratio — so the
 * alternating rhythm holds. Swap in an <img> the moment a real photo lands.
 */
const ServiceIconPanel = ({ service }: { service: string }) => (
  <div className="relative flex w-full aspect-[4/3] items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-[#EAF4FF] via-[#F5F9FF] to-[#E3F0FF] shadow-xl">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(2,137,232,0.14),transparent_55%)]" />
    <div className="relative flex h-28 w-28 items-center justify-center rounded-[32px] border border-white/70 bg-white/80 shadow-sm backdrop-blur-sm">
      <ServiceIcon service={service} size={56} strokeWidth={1.25} className="text-[#0289E8]" />
    </div>
  </div>
);

const SectionEyebrow = ({ children }: { children: ReactNode }) => (
  <div className="text-sm font-medium uppercase tracking-[0.15em] text-[#1B004E] mb-4">{children}</div>
);

/**
 * Desktop services dropdown. Opens on hover and on focus, closes on Escape or
 * blur, so it is usable by both pointer and keyboard.
 */
const ServicesDropdown = ({
  linkClass,
  location,
}: {
  linkClass: (href: string) => string;
  location: string;
}) => {
  const [open, setOpen] = useState(false);
  const active = location.startsWith("/services");

  useEffect(() => {
    setOpen(false);
  }, [location]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <Link
        href="/services"
        aria-haspopup="true"
        aria-expanded={open}
        className={`relative inline-flex items-center gap-1 ${linkClass("/services")}`}
      >
        Our Services
        <ChevronDown aria-hidden="true" className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        {active && (
          <motion.span
            layoutId="nav-active-indicator"
            transition={springSmooth}
            className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full bg-current"
          />
        )}
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 pt-4"
          >
            <div className="rounded-2xl border border-[#ECECEC] bg-white p-3 shadow-xl">
              <ul className="grid grid-cols-2 gap-1">
                {serviceList.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={servicePath(service.slug)}
                      className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[#F5F9FF]"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0289E8]/8 text-[#0289E8]">
                        <ServiceGlyph slug={service.slug} size={20} strokeWidth={1.75} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-[#1B004E] group-hover:text-[#0289E8]">
                          {service.name}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-[#777777]">{service.shortName}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/services"
                className="mt-1 flex items-center justify-between rounded-xl bg-[#F9FAFB] px-4 py-3 text-sm font-semibold text-[#1B004E] transition-colors hover:text-[#0289E8]"
              >
                View all services
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesAccordionOpen, setServicesAccordionOpen] = useState(false);
  const storeUrl = useStoreUrl();
  const location = usePathname() ?? "/";

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const nextScrolled = window.scrollY > 20;
        setScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const hasTransparentHero = transparentHeroRoutes.includes(location);
  const solidNav = scrolled || !hasTransparentHero;

  const navButtonClass = `rounded-[80px] px-4 py-2 nav-text font-semibold border transition-all ${
    solidNav
      ? "bg-[#0289E8] hover:bg-[#0289E8] text-white border-[#0289E8] shadow-sm"
      : "bg-transparent hover:bg-transparent text-white border-white/60"
  }`;

  const linkClass = (href: string) => {
    const active = location === href;
    if (solidNav) {
      return active ? "text-[#1B004E] font-semibold" : "text-[#1B004E] hover:text-[#0E7A4E] transition-colors";
    }
    return active ? "text-white font-semibold" : "text-white hover:text-white/70 transition-colors";
  };

  return (
    <motion.header
      variants={fadeDown}
      initial="hidden"
      animate="visible"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div
        className={`bg-[#0289E8] text-white topbar-text py-2 px-4 sm:px-8 flex justify-center items-center transition-transform duration-300 ${
          scrolled ? "-translate-y-full absolute w-full" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-center">
          <Phone className="w-3 h-3 text-[#0E7A4E]" />
          <span className="font-medium tracking-wide">UAN: 051-111-111-567</span>
        </div>
      </div>

      <div className={`px-4 sm:px-8 py-3 transition-all duration-300 ${solidNav ? "bg-white shadow-md" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Image
              src={"/eshifa-logo.png"}
              alt={"eShifa Logo"}
              width={342}
              height={428}
              priority
              className={`h-14 sm:h-16 w-auto transition-all duration-300 ${solidNav ? "" : "brightness-0 invert drop-shadow-md"}`}
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-7 nav-text font-medium">
            {navLinks.map((item) =>
              item.href === "/services" ? (
                <ServicesDropdown key={item.href} linkClass={linkClass} location={location} />
              ) : (
                <Link key={item.href} href={item.href} className={`relative ${linkClass(item.href)}`}>
                  {item.label}
                  {location === item.href && (
                    <motion.span
                      layoutId="nav-active-indicator"
                      transition={springSmooth}
                      className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full bg-current"
                    />
                  )}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button asChild className={navButtonClass}>
              <a href="tel:051111111567">Call Now</a>
            </Button>
            <Button asChild className={navButtonClass}>
              <Link href="/contact">Partner</Link>
            </Button>
            <Button asChild className={navButtonClass}>
              <a href={storeUrl} target="_blank" rel="noreferrer">
                Download App
              </a>
            </Button>
          </div>

          <button
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            className={`lg:hidden transition-colors ${solidNav ? "text-[#1B004E]" : "text-white"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={mobileMenuOpen ? "close" : "open"}
                className="block"
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.15 }}
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            variants={drawerAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="lg:hidden bg-white border-t border-[#EEEEEE] shadow-lg absolute top-full left-0 right-0 p-4 flex flex-col gap-3 max-h-[75vh] overflow-y-auto"
          >
            {navLinks.map((item) =>
              item.href === "/services" ? (
                <div key={item.href} className="border-b border-[#EEEEEE]">
                  <button
                    type="button"
                    aria-expanded={servicesAccordionOpen}
                    aria-controls="mobile-services-panel"
                    onClick={() => setServicesAccordionOpen((v) => !v)}
                    className="flex w-full items-center justify-between py-2 font-medium text-[#1B004E]"
                  >
                    Our Services
                    <ChevronDown
                      aria-hidden="true"
                      className={`h-5 w-5 text-[#0289E8] transition-transform duration-200 ${servicesAccordionOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {servicesAccordionOpen && (
                      <motion.ul
                        id="mobile-services-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <li>
                          <Link href="/services" className="block py-2 pl-3 text-sm font-semibold text-[#0289E8]">
                            All Services
                          </Link>
                        </li>
                        {serviceList.map((service) => (
                          <li key={service.slug}>
                            <Link
                              href={servicePath(service.slug)}
                              className="flex items-center gap-3 py-2 pl-3 text-sm text-[#444444]"
                            >
                              <ServiceGlyph slug={service.slug} size={18} strokeWidth={1.75} className="text-[#0289E8]" />
                              {service.name}
                            </Link>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[#1B004E] font-medium py-2 border-b border-[#EEEEEE] ${location === item.href ? "text-[#0E7A4E]" : ""}`}
                >
                  {item.label}
                </Link>
              ),
            )}
            <Button asChild className="bg-[#0289E8] hover:bg-[#0289E8] text-white rounded-[80px] w-full mt-2">
              <a href="tel:051111111567">Call Now</a>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

const Hero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      window.requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
      ticking = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const prefersReducedMotion = useReducedMotion();

  const y = prefersReducedMotion ? 0 : Math.min(scrollY, 800);
  const imgTranslate = y * 0.35;
  const imgScale = 1 + Math.min(y / 4000, 0.08);
  const overlayOpacity = Math.min(0.35 + y / 1500, 0.75);

  return (
    <section className="relative h-screen w-full overflow-hidden text-white">
      <div className="absolute inset-0 will-change-transform" style={{ transform: `translate3d(0, ${imgTranslate}px, 0) scale(${imgScale})` }}>
        <Image
          src={"/images/hero.png"}
          alt={"eShifa certified nurse providing home nursing care in Islamabad Pakistan"}
          fill
          priority
          sizes="100vw"
          className="object-cover hero-zoom"
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none transition-opacity"
        style={{
          background: "linear-gradient(to bottom, rgba(27,0,78,0.4) 0%, rgba(27,0,78,0.2) 35%, rgba(27,0,78,0.75) 100%)",
          opacity: overlayOpacity,
        }}
      ></div>

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-8 flex items-end pb-16 sm:pb-24">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={staggerItem}>
            <SectionEyebrow>Healthcare Without Walls</SectionEyebrow>
          </motion.div>
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-light leading-[1.05] max-w-4xl">
            <AnimatedWords text="Quality Healthcare at Your Doorstep" />
          </h1>
          <motion.p variants={staggerItem} className="text-lg sm:text-xl text-white/90 mt-6 max-w-3xl leading-relaxed">
            eShifa is a trusted healthcare platform, bringing quality healthcare services to patients beyond hospital walls. Pakistan's first
            JCI-accredited home healthcare service, available 24/7 in Islamabad, Lahore, and across the nation.
          </motion.p>
          <motion.div variants={staggerItem} className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-[80px] bg-[#0289E8] hover:bg-[#0289E8] text-white px-7 py-6 font-semibold">
              <Link href="/contact">Book Your Home Visit Now</Link>
            </Button>
            <Button asChild className="rounded-[80px] border border-white/60 bg-transparent text-white hover:bg-white/10 px-7 py-6">
              <Link href="/services">Explore Services</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute bottom-8 right-6 sm:right-12 lg:right-16"
      >
        <Link href="/services" className="group inline-flex items-center gap-2 text-white/90 nav-text font-light border-b border-white/40 pb-1 hover:border-white">
          <span>Discover eShifa</span>
          <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
        </Link>
      </motion.div>
    </section>
  );
};

const ContentBlock = ({ title, children }: { title: string; children: ReactNode }) => (
  <Reveal>
    <h3 className="text-2xl sm:text-3xl font-semibold text-[#1B004E] mb-4">{title}</h3>
    <div className="text-lg text-[#444444] leading-relaxed">{children}</div>
  </Reveal>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-3 text-lg text-[#444444]">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#0E7A4E] mt-1 shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const HomeWorldClass = () => {
  return (
    <section className="py-24 bg-[#F5F5F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-4 bg-[#1B004E]/10 rounded-[40px] transform -rotate-3 -z-10"></div>
              <Image
                src={"/images/about.png"}
                alt={"eShifa JCI-accredited home healthcare team Pakistan"}
                width={800}
                height={600}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={"w-full rounded-[32px] shadow-xl object-cover aspect-[4/3]"}
              />
            </div>
          </Reveal>
          <div>
            <SectionEyebrow>ABOUT ESHIFA</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-6 leading-tight">Quality Healthcare, Beyond Hospital Walls</h2>
            <p className="text-lg text-[#444444] leading-relaxed mb-5">
              Through quality home healthcare services, eShifa makes healthcare more accessible, convenient, and patient-centered — right at
              your doorstep. Powered by the expertise and healthcare ecosystem of Shifa, eShifa brings a comprehensive range of healthcare
              services closer to individuals and families.
            </p>
            <p className="text-lg text-[#444444] leading-relaxed mb-5">
              eShifa is committed to transforming the traditional healthcare experience through innovation, technology, convenience, and
              patient-centered care. By reducing the need for unnecessary travel and waiting times, eShifa aims to make quality healthcare
              more accessible while ensuring that patients receive professional and compassionate care when and where they need it.
            </p>
            <p className="text-lg text-[#444444] leading-relaxed">
              Backed by the clinical heritage of Shifa International Hospitals and accredited to Joint Commission International (JCI)
              standards, eShifa is trusted by families in Islamabad, Lahore, and across Pakistan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const HomeServices = () => (
  <section className="py-24 bg-[#F3F4F6]">
    <div className="max-w-7xl mx-auto px-4 sm:px-8">
      <Reveal className="text-center max-w-3xl mx-auto mb-14">
        <SectionEyebrow>WHAT WE DO</SectionEyebrow>
        <h2 className="text-3xl sm:text-4xl font-semibold text-[#1B004E] mb-4">eShifa Services</h2>
        <p className="text-lg text-[#777777]">
          Six home healthcare services, each delivered by qualified professionals at your doorstep.
        </p>
      </Reveal>

      <ServiceCardGrid tone="grey" />

      <div className="mt-12 text-center">
        <Button
          asChild
          className="rounded-[80px] border border-[#0289E8] bg-white text-[#0289E8] hover:bg-[#F5F5F5] px-7 py-6 font-semibold"
        >
          <Link href="/services">View All Services</Link>
        </Button>
      </div>
    </div>
  </section>
);

const WhyChoose = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <SectionEyebrow>WHY ESHIFA</SectionEyebrow>
        <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-4">Why eShifa? What Sets Us Apart</h2>
        <p className="text-lg text-[#777777] mb-8">The advantages families gain when clinical care comes to them.</p>
        <BulletList items={whyChooseItems} />
      </div>
    </section>
  );
};

const VisionMissionValues = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="space-y-20 mb-24">
          {visionMissionSections.map((item, index) => {
            const imageOnRight = index % 2 === 0;

            return (
              <div key={item.title} className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                <Reveal direction={imageOnRight ? "right" : "left"} className={imageOnRight ? "lg:order-2" : ""}>
                  <Image
                    src={`/images/${item.image}`}
                    alt={item.alt}
                    width={800}
                    height={600}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className={"rounded-[28px] shadow-xl w-full aspect-[4/3] object-cover"}
                  />
                </Reveal>

                <Reveal delay={100} className={imageOnRight ? "lg:order-1" : ""}>
                  <SectionEyebrow>{item.eyebrow}</SectionEyebrow>
                  <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-5">{item.title}</h2>
                  <p className="text-xl sm:text-2xl text-[#444444] font-light leading-relaxed">{item.body}</p>
                </Reveal>
              </div>
            );
          })}
        </div>

        <Reveal delay={150}>
          <SectionEyebrow>CORE VALUES</SectionEyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-8">The Values Behind Every Visit</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coreValues.map((value) => (
              <div
                key={value.name}
                className={`${CARD_ON_WHITE} p-6 ${value.note ? "sm:col-span-2 lg:col-span-3" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#0E7A4E] mt-1 shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-[#1B004E]">{value.name}</h3>
                    {value.note && <p className="text-lg text-[#444444] leading-relaxed mt-2">{value.note}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const BrandPromise = () => {
  return (
    /* #ED3237 is sampled directly from the red in the eShifa logo. */
    <section className="py-20 bg-[#ED3237] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 text-center">
        {/* White, not the old mint — mint on red clashes and drops to 2.5:1 contrast. */}
        <div className="text-sm font-semibold uppercase tracking-[0.15em] text-white mb-5">Our Brand Promise</div>
        <p className="text-3xl sm:text-5xl font-light leading-tight">{BRAND_PROMISE}</p>
      </div>
    </section>
  );
};

const CareProgramsSection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionEyebrow>SPECIALIZED CARE PROGRAMS</SectionEyebrow>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#1B004E] mb-4">Specialized Care Programs</h2>
          <p className="text-lg text-[#777777]">
            Structured, home-based care plans built around a specific condition, with clinical monitoring and coordinated follow-up.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {carePrograms.map((program) => (
            <motion.article
              key={program.title}
              variants={staggerItem}
              className={`${CARD_ON_WHITE} flex h-full flex-col overflow-hidden`}
            >
              <div className="relative">
                <Image
                  src={`/images/care-plans/${program.image}`}
                  alt={program.alt}
                  width={800}
                  height={600}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={"aspect-[4/3] w-full object-cover"}
                />
                {/* Icon badge straddles the image edge, tying the card back to the icon system. */}
                <ServiceIcon
                  service={program.title}
                  variant="chip"
                  size={22}
                  strokeWidth={1.75}
                  interactive
                  containerClassName="absolute -bottom-5 left-5 w-11 h-11 rounded-xl bg-white border-[#ECECEC] shadow-md"
                />
              </div>
              <div className="flex flex-1 flex-col p-6 pt-8">
                <h3 className="text-xl font-semibold text-[#1B004E] mb-3">{program.title}</h3>
                <p className="text-base text-[#444444] leading-relaxed">{program.body}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const HowToAccess = () => {
  const storeUrl = useStoreUrl();

  return (
    /* Red-to-white gradient built from the logo red (#ED3237). The lightest stop
       stays faintly tinted rather than pure white so the white cards keep their edge. */
    <section className="relative overflow-hidden py-24 bg-gradient-to-br from-[#FDE8E8] via-[#F8C8CA] to-[#F09EA1]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(237,50,55,0.18),transparent_58%)]"
      />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <SectionEyebrow>HOW TO ACCESS SERVICES</SectionEyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-4">Two Ways to Reach Us</h2>
          {/* Darker than the usual #777777 — the tinted background needs it to stay legible. */}
          <p className="text-lg text-[#444444]">Book a service in a few taps, or speak to our care team directly, any time of day.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {accessSteps.map((step, index) => (
            <Reveal key={step.title} delay={index * 80}>
              <article className={`${CARD_ON_GREY} h-full p-6`}>
                <div className="w-12 h-12 rounded-xl bg-[#0289E8]/10 text-[#0289E8] flex items-center justify-center mb-5">
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-semibold text-[#1B004E] mb-3">{step.title}</h3>
                <p className="text-lg text-[#444444] leading-relaxed">{step.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-[80px] bg-[#0289E8] hover:bg-[#0289E8] text-white px-7 py-6 font-semibold">
            <a href="tel:051111111567">Call {UAN_DISPLAY}</a>
          </Button>
          <Button asChild className="rounded-[80px] border border-[#0289E8] bg-white text-[#0289E8] hover:bg-[#F5F5F5] px-7 py-6 font-semibold">
            <a href={storeUrl} target="_blank" rel="noreferrer">
              Download the eShifa App
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

const HomeFaq = () => {
  return (
    <section className="py-24 bg-[#F5F5F5]">
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <SectionEyebrow>FAQ</SectionEyebrow>
        <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-10">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {homeFaqItems.map((item, idx) => (
            <Reveal key={item.q} delay={idx * 50}>
              <article className={`${CARD_ON_GREY} p-6`}>
                <h3 className="text-xl font-semibold text-[#1B004E] mb-3">{item.q}</h3>
                <p className="text-lg text-[#444444]">{item.a}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

/** Animated inline validation message. */
/**
 * Inline field error.
 *
 * Deliberately not wrapped in AnimatePresence: with an `height: auto -> 0` exit,
 * framer-motion animated the node out of sight but left it in the DOM, so a
 * stale `role="alert"` stayed in the accessibility tree after the field was
 * corrected. Rendering conditionally removes the node outright; the entrance is
 * still animated, only the exit is instant.
 */
const FieldError = ({ id, message }: { id: string; message?: string }) => {
  if (!message) return null;

  return (
    <motion.p
      id={id}
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="text-sm text-[#C0392B]"
    >
      {message}
    </motion.p>
  );
};

type CallbackErrors = { name?: string; phone?: string; service?: string };

/**
 * Callback request form.
 *
 * Submits to /api/callback, which appends the request to an .xlsx workbook on
 * the server. The success state is only shown once the server confirms the row
 * was written — it never claims success optimistically. On failure the visitor's
 * input is preserved so nothing has to be retyped.
 */
const CallbackForm = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<CallbackErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): CallbackErrors => {
    const next: CallbackErrors = {};
    if (!name.trim()) next.name = "Please enter your name.";

    if (!phone.trim()) {
      next.phone = "Please enter a phone number.";
    } else if (!normalizePakistaniPhone(phone)) {
      next.phone = "Enter a valid Pakistani mobile number, e.g. 0300 1234567.";
    }

    if (!service) next.service = "Please select a service.";
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, phone, service, additionalNotes: notes }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !payload.ok) {
        // Server-side validation failures map back onto the fields.
        if (response.status === 422 && payload.errors) {
          setErrors({
            name: payload.errors.fullName,
            phone: payload.errors.phone,
            service: payload.errors.service,
          });
        } else {
          setFormError(payload.message ?? `Something went wrong. Please call us on ${UAN_DISPLAY}.`);
        }
        return;
      }

      // Service name only — never the visitor's name, number or notes.
      trackEvent("callback_request", {
        selected_service: service,
        page: typeof window === "undefined" ? "" : window.location.pathname,
        source: "contact_form",
      });

      setIsSubmitted(true);
      setName("");
      setPhone("");
      setService("");
      setNotes("");
    } catch {
      setFormError(
        `We could not reach our servers. Please check your connection or call us on ${UAN_DISPLAY}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `bg-[#F5F5F5] focus:bg-white ${hasError ? "border-[#C0392B]" : "border-transparent"}`;

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-[#EEEEEE]">
      <h3 className="text-2xl font-semibold text-[#1B004E] mb-6">Request a Callback</h3>
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="cb-name" className="block text-sm font-medium text-[#1B004E]">
            Full Name
          </label>
          <Input
            id="cb-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cb-name-error" : undefined}
            className={fieldClass(!!errors.name)}
          />
          <FieldError id="cb-name-error" message={errors.name} />
        </div>

        <div className="space-y-2">
          <label htmlFor="cb-phone" className="block text-sm font-medium text-[#1B004E]">
            Phone Number
          </label>
          <Input
            id="cb-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 3XX XXXXXXX"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "cb-phone-error" : undefined}
            className={fieldClass(!!errors.phone)}
          />
          <FieldError id="cb-phone-error" message={errors.phone} />
        </div>

        <div className="space-y-2">
          <label htmlFor="cb-service" className="block text-sm font-medium text-[#1B004E]">
            How can we help?
          </label>
          <select
            id="cb-service"
            value={service}
            onChange={(e) => setService(e.target.value)}
            aria-invalid={!!errors.service}
            aria-describedby={errors.service ? "cb-service-error" : undefined}
            className={`w-full h-10 rounded-md border bg-[#F5F5F5] px-3 text-sm outline-none focus:border-[#1B004E]/30 focus:bg-white ${
              errors.service ? "border-[#C0392B]" : "border-transparent"
            }`}
          >
            <option value="">Select a service</option>
            {callbackServiceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError id="cb-service-error" message={errors.service} />
        </div>

        <div className="space-y-2">
          <label htmlFor="cb-notes" className="block text-sm font-medium text-[#1B004E]">
            Additional Notes
          </label>
          <Textarea
            id="cb-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Briefly describe your requirements..."
            className="min-h-[110px] bg-[#F5F5F5] border-transparent focus:bg-white"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0289E8] hover:bg-[#0289E8] text-white py-6 rounded-[80px] mt-4 disabled:opacity-70"
        >
          {isSubmitting ? "Sending request..." : "Request a Callback"}
        </Button>

        {formError && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="pt-1 text-sm text-[#C0392B]"
          >
            {formError}
          </motion.p>
        )}

        {isSubmitted && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-3 rounded-2xl border border-[#0E7A4E]/25 bg-[#F1F9F5] p-4"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0E7A4E]" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-[#1B004E]">
              <span className="font-semibold">Request received.</span> Our care team will call you shortly. For
              anything urgent, call {UAN_DISPLAY}.
            </p>
          </motion.div>
        )}
      </form>
    </div>
  );
};

const ContactPreview = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#F5F5F5] -skew-x-12 transform origin-top-right -z-10 hidden lg:block"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          <Reveal>
            <SectionEyebrow>ESHIFA 24/7 - REQUEST A CALLBACK</SectionEyebrow>
            <h2 className="text-4xl font-semibold text-[#1B004E] mb-4">eShifa 24/7 - Request a Callback</h2>
            <p className="text-lg text-[#444444] font-medium mb-10">
              24/7 access to quality home healthcare. Call our care team or submit your details and we will contact you within minutes.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0E7A4E]/10 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-[#0E7A4E]" />
                </div>
                <div>
                  <div className="text-sm text-[#777777] font-medium mb-1">Call Us Now</div>
                  <div className="text-base font-semibold text-[#1B004E]">{UAN_DISPLAY}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#1B004E]/10 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-[#1B004E]" />
                </div>
                <div>
                  <div className="text-sm text-[#777777] font-medium mb-1">Email Us</div>
                  <div className="text-base font-medium text-[#1B004E]">{CONTACT_EMAIL}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#00E5B9]/10 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-[#00E5B9]" />
                </div>
                <div>
                  <div className="text-sm text-[#777777] font-medium mb-1">Head Office</div>
                  <div className="text-base font-medium text-[#1B004E] max-w-sm">Plot No. 17 and 18, 2nd Floor, EOBI Building, I-8 Markaz, Islamabad</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <CallbackForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const ImageHero = ({ eyebrow, title, description, image }: { eyebrow: string; title: string; description: string; image: string }) => {
  return (
    <section className="relative h-screen w-full overflow-hidden text-white">
      <motion.div
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        <Image src={`/images/${image}`} alt={title} fill priority sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#1B004E]/90 via-[#1B004E]/65 to-[#0289E8]/45"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,229,185,0.25),transparent_35%)]"></div>

      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-8 flex items-end pb-20 sm:pb-28">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={staggerItem}>
            <SectionEyebrow>{eyebrow}</SectionEyebrow>
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.05] font-light max-w-4xl">
            {title}
          </motion.h1>
          <motion.p variants={staggerItem} className="text-lg sm:text-xl text-white/90 mt-6 max-w-3xl leading-relaxed">
            {description}
          </motion.p>
          <motion.div variants={staggerItem} className="mt-8 inline-flex items-center gap-2 border-b border-white/40 pb-1 text-white/90">
            <span className="nav-text">Healthcare Without Walls</span>
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

/**
 * Card grid used for both services and non-service content.
 * Items may supply an explicit `icon`; service items omit it and the icon is
 * resolved from the title through the central service icon map.
 */
const FeatureGrid = ({ items }: { items: Array<{ title: string; body: string; icon?: React.ElementType }> }) => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT_ONCE}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {items.map((item) => (
            <motion.article
              key={item.title}
              variants={staggerItem}
              className={`${CARD_ON_WHITE} h-full p-6`}
            >
              {item.icon ? (
                <div className="w-12 h-12 rounded-xl bg-[#1B004E]/8 text-[#1B004E] flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6" aria-hidden="true" />
                </div>
              ) : (
                <ServiceIcon
                  service={item.title}
                  variant="chip"
                  size={24}
                  strokeWidth={1.75}
                  interactive
                  containerClassName="mb-4 bg-[#0289E8]/8 border-transparent shadow-none"
                />
              )}
              <h3 className="text-2xl font-semibold text-[#1B004E] mb-3">{item.title}</h3>
              <p className="text-lg text-[#444444] leading-relaxed">{item.body}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const CtaBand = ({ title, body, ctaText }: { title: string; body: string; ctaText: string }) => {
  return (
    /* #ED3237 is the red sampled from the eShifa logo. */
    <section className="py-16 bg-[#ED3237] text-white">
      <Reveal className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-light mb-3">{title}</h2>
          <p className="text-lg text-white max-w-2xl">{body}</p>
        </div>
        {/* White on red: the site's blue button would sit at 1.12:1 here and vanish. */}
        <Button
          asChild
          className="rounded-[80px] bg-white hover:bg-white/90 text-[#1B004E] font-semibold px-8 py-6 shrink-0"
        >
          <Link href="/contact">{ctaText}</Link>
        </Button>
      </Reveal>
    </section>
  );
};

export const Footer = () => {
  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Our Services" },
    { href: "/doctors", label: "Our Doctors" },
    { href: "/labs", label: "Lab Centers" },
    { href: "/international", label: "International Patients" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="bg-[#171A20] text-white pt-16 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-10 xl:gap-8">
          <div>
            <h4 className="text-xl font-semibold text-white mb-4">About eShifa</h4>
            <div className="h-px bg-white/20 mb-6"></div>
            <p className="text-lg text-white/70 leading-relaxed">
              Pakistan's first JCI-accredited home healthcare service, delivering quality healthcare to your doorstep, 24/7.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="eShifa on Facebook"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-white/40 transition-colors"
              >
                <FaFacebookF className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-white mb-4">Services</h4>
            <div className="h-px bg-white/20 mb-6"></div>
            <ul className="space-y-3 text-white/80">
              {serviceList.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={servicePath(service.slug)}
                    className="inline-flex items-start gap-2 hover:text-white transition-colors"
                  >
                    <span className="text-xs mt-1.5">{">"}</span>
                    <span>{service.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-white mb-4">Quick Links</h4>
            <div className="h-px bg-white/20 mb-6"></div>
            <ul className="space-y-3 text-white/80">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="inline-flex items-center gap-2 hover:text-white transition-colors">
                    <span className="text-xs">{">"}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-white mb-4">Contact Details</h4>
            <div className="h-px bg-white/20 mb-6"></div>
            <ul className="space-y-4 text-white/80">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#2F8AD8] shrink-0 mt-1" />
                <a href="tel:051111111567" className="hover:text-white transition-colors">
                  UAN: {UAN_DISPLAY}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#2F8AD8] shrink-0 mt-1" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white transition-colors">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="w-4 h-4 text-[#2F8AD8] shrink-0 mt-1" />
                <a href="https://www.eshifa.org" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  www.eshifa.org
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#2F8AD8] shrink-0 mt-1" />
                <span>Available 24/7, Mon to Sun</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-white mb-4">Download eShifa App</h4>
            <div className="h-px bg-white/20 mb-6"></div>
            <div className="flex flex-wrap gap-3">
              <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className="bg-black border border-white/20 rounded-[80px] px-4 py-2 hover:border-white/40 transition-colors" aria-label="Get it on Google Play">
                <span className="text-[11px] text-white/70 block leading-none">GET IT ON</span>
                <span className="text-sm font-semibold leading-none">Google Play</span>
              </a>
              <a href={APPLE_STORE_URL} target="_blank" rel="noreferrer" className="bg-black border border-white/20 rounded-[80px] px-4 py-2 hover:border-white/40 transition-colors" aria-label="Download on the App Store">
                <span className="text-[11px] text-white/70 block leading-none">Download on the</span>
                <span className="text-sm font-semibold leading-none">App Store</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


export function LandingPage() {

  return (
    <>
      <Hero />
      <HomeWorldClass />
      <VisionMissionValues />
      <BrandPromise />
      <HomeServices />
      <CareProgramsSection />
      <WhyChoose />
      <HowToAccess />
      <HomeFaq />
      <ContactPreview />
    </>
  );
}

export function ServicesPage() {

  return (
    <>
      <ImageHero
        eyebrow="HOME HEALTHCARE SERVICES"
        title="Complete Home Healthcare Services - Clinical Care You Can Count On"
        description="From laboratory and nursing to rehabilitation, pharmacy, and medical equipment, eShifa delivers the full spectrum of home healthcare services with JCI-accredited standards."
        image="nursing.png"
      />

      <section className="py-20 bg-[#F3F4F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <SectionEyebrow>WHAT WE DO</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-semibold text-[#1B004E] mb-4">Browse eShifa's Full Service Menu</h2>
            <p className="text-lg text-[#777777]">Explore each service in detail and book the care you need.</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-20">
          {servicesAlternatingSections.map((service, index) => {
            const imageOnRight = index % 2 === 0;

            return (
              <div key={service.title} className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                <Reveal direction={imageOnRight ? "right" : "left"} className={imageOnRight ? "lg:order-2" : ""}>
                  {service.image ? (
                    <Image
                      src={`/images/${service.image}`}
                      alt={service.alt}
                      width={800}
                      height={600}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className={"rounded-[28px] shadow-xl w-full aspect-[4/3] object-cover"}
                    />
                  ) : (
                    <ServiceIconPanel service={service.title} />
                  )}
                </Reveal>

                <Reveal delay={100} className={imageOnRight ? "lg:order-1" : ""}>
                  <SectionEyebrow>SERVICE DETAIL</SectionEyebrow>
                  <h3 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-5">
                    <Link href={servicePath(service.slug)} className="transition-colors hover:text-[#0289E8]">
                      {service.title}
                    </Link>
                  </h3>
                  <ul className="space-y-3">
                    {service.points.map((point) => (
                      <li key={point} className="flex items-start gap-3 text-lg text-[#444444] leading-relaxed">
                        <CheckCircle2 className="w-5 h-5 mt-1 text-[#0E7A4E] shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={servicePath(service.slug)}
                    className="group mt-7 inline-flex items-center gap-2 text-base font-semibold text-[#0289E8]"
                  >
                    Learn more about {service.title}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </Link>
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-20 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <Reveal className="text-center max-w-3xl mx-auto mb-12">
            <SectionEyebrow>HOME MEDICAL EQUIPMENT</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-5">Equipment Rental for Care at Home</h2>
            <p className="text-lg text-[#444444] leading-relaxed">
              Convenient rental of essential medical equipment to support quality care and recovery at home.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            <Reveal direction="left">
              <Image
                src={"/images/nursing.png"}
                alt={"eShifa nurse using a home blood pressure monitor with an elderly patient in Pakistan"}
                width={800}
                height={600}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={"rounded-[28px] shadow-xl w-full aspect-[4/3] object-cover"}
              />
            </Reveal>

            <motion.ul
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT_ONCE}
              className="grid sm:grid-cols-2 gap-4"
            >
              {medicalEquipmentItems.map((item) => (
                <motion.li
                  key={item}
                  variants={staggerItem}
                  className={`${CARD_ON_GREY} flex items-center gap-4 p-4`}
                >
                  <ServiceIcon
                    service={item}
                    variant="chip"
                    size={24}
                    strokeWidth={1.75}
                    interactive
                    containerClassName="w-12 h-12 rounded-xl bg-[#0289E8]/8 border-transparent shadow-none"
                  />
                  <span className="text-base font-medium text-[#1B004E] leading-snug">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      <CareProgramsSection />

      <CtaBand
        title="Need Help Choosing a Service?"
        body="Our care coordinators are available 24/7 to assess your requirements and recommend the most appropriate package."
        ctaText="Speak to a Care Coordinator"
      />
    </>
  );
}

export function DoctorsPage() {

  return (
    <>
      <ImageHero
        eyebrow="ONLINE DOCTOR CONSULTATION"
        title="Consult Certified Doctors Without Delay - Anytime, Anywhere in Pakistan"
        description="General physicians and specialists through a seamless digital-first consultation experience, with proper follow-up care built in."
        image="about.png"
      />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionEyebrow>HOW YOUR CONSULTATION WORKS</SectionEyebrow>
          <h2 className="text-3xl sm:text-4xl font-light text-[#1B004E] mb-10">How Your Consultation Works</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            <ContentBlock title="Step 1 - Book Your Doctor">
              Select doctor type, preferred slot, and consultation format (teleconsult or home visit) in minutes.
            </ContentBlock>
            <ContentBlock title="Step 2 - Receive Your Consultation">
              Connect securely and receive digital notes, a care plan, and prescription documented in your care record.
            </ContentBlock>
            <ContentBlock title="Step 3 - Continue Your Care">
              If labs, medications, or nursing are needed, eShifa's integrated services handle the next steps.
            </ContentBlock>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <Image
              src={"/images/teleconsultation.png"}
              alt={"Patient conducting online doctor teleconsultation with eShifa certified physician Pakistan"}
              width={800}
              height={600}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={"rounded-[28px] shadow-xl w-full aspect-[4/3] object-cover"}
            />
          </Reveal>
          <Reveal delay={100}>
            <SectionEyebrow>OUR MEDICAL NETWORK</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-6">Our Medical Network</h2>
            <BulletList items={doctorNetworkItems} />
            <h3 className="text-2xl text-[#1B004E] font-semibold mt-8 mb-3">Urgent Teleconsultation</h3>
            <p className="text-lg text-[#444444]">Need a doctor now? Connect with a certified physician within minutes, 24/7 across Pakistan.</p>
          </Reveal>
        </div>
      </section>

      <CtaBand title="Book A Doctor Today" body="Start your teleconsultation or schedule an in-home doctor visit with a certified physician." ctaText="Start a Teleconsultation" />
    </>
  );
}

export function LabsPage() {

  return (
    <>
      <ImageHero
        eyebrow="HOME LAB TESTS"
        title="Fast, Reliable Home Lab Tests - Diagnostics Without the Wait"
        description="Certified phlebotomists, secure sample handling, and timely digital reports reviewed by your care team."
        image="lab.png"
      />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionEyebrow>WHY CHOOSE ESHIFA HOME LAB COLLECTION</SectionEyebrow>
          <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-8">Why Choose eShifa Home Lab Collection?</h2>
          <BulletList items={labWhyItems} />
        </div>
      </section>

      <section className="py-20 bg-[#F5F5F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal className="lg:order-2">
            <Image src="/images/lab.png" alt="eShifa certified phlebotomist collecting home blood sample in Islamabad" width={800} height={600} sizes="(max-width: 1024px) 100vw, 50vw" className="rounded-[28px] shadow-xl w-full aspect-[4/3] object-cover" />
          </Reveal>
          <Reveal delay={100} className="lg:order-1">
            <SectionEyebrow>DIAGNOSTIC TESTS AVAILABLE</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-6">Diagnostic Tests Available</h2>
            <ContentBlock title="Routine Profiles">
              CBC, lipid panels, LFTs, KFTs, thyroid panels, HbA1c, and glucose monitoring.
            </ContentBlock>
            <ContentBlock title="Specialised Tests">
              Hormonal panels, tumour markers, vitamin screens, coagulation studies, and infectious disease panels.
            </ContentBlock>
            <ContentBlock title="Home Collection for Seniors and Children">
              Comfortable, low-stress collection techniques for vulnerable patients.
            </ContentBlock>
          </Reveal>
        </div>
      </section>

      <CtaBand title="Schedule Your Home Lab Collection" body="Select your preferred time and location. Our support team will confirm your slot quickly." ctaText="Book a Home Lab Test" />
    </>
  );
}

export function InternationalPatientsPage() {

  return (
    <>
      <section className="pt-36 pb-20 bg-gradient-to-b from-[#EAF4FF] via-[#F5F5F5] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionEyebrow>INTERNATIONAL PATIENTS</SectionEyebrow>
          <h1 className="text-4xl sm:text-5xl font-light text-[#1B004E] mb-6 leading-tight">Healthcare Support for Families Abroad - Your Boots on the Ground in Pakistan</h1>
          <p className="text-lg text-[#444444] max-w-4xl leading-relaxed">
            If you are living in the UK, US, Middle East, or anywhere overseas, eShifa handles every detail of your loved one's healthcare in
            Pakistan while keeping you fully informed.
          </p>
        </div>
      </section>

      <FeatureGrid items={internationalCards} />

      <CtaBand
        title="Support Your Family From Anywhere"
        body="Set up a managed care plan with our international support team. We handle clinical details while you maintain visibility and peace of mind."
        ctaText="Speak to Our International Coordinator"
      />
    </>
  );
}

export function AboutPage() {

  return (
    <>
      <section className="pt-36 pb-20 bg-gradient-to-b from-[#EAF4FF] via-[#F5F5F5] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionEyebrow>ABOUT ESHIFA</SectionEyebrow>
          <h1 className="text-4xl sm:text-5xl font-light text-[#1B004E] mb-6 leading-tight">Built Around Trust, Quality, and Care - The eShifa Story</h1>
          <p className="text-lg text-[#444444] max-w-4xl leading-relaxed">
            eShifa is a trusted healthcare platform, bringing quality healthcare services to patients beyond hospital walls. Through quality
            home healthcare services, eShifa makes healthcare more accessible, convenient, and patient-centered — right at your doorstep.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <SectionEyebrow>WHO WE ARE</SectionEyebrow>
          <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-8">About eShifa</h2>
          <div className="space-y-5">
            {aboutParagraphs.map((paragraph, index) => (
              <Reveal key={paragraph.slice(0, 40)} delay={index * 60}>
                <p className="text-lg text-[#444444] leading-relaxed">{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <VisionMissionValues />

      <BrandPromise />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-12">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-6">Why eShifa Is Different</h2>
            <BulletList
              items={[
                "Pakistan's first JCI accredited home healthcare service",
                "A wholly owned subsidiary of Shifa International Hospitals Ltd. and Shifa Foundation",
                "Not a gig platform; frontline professionals are vetted, trained, and clinically accountable",
                "Serving patients and diaspora families across Pakistan and internationally",
              ]}
            />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-6">Company Overview & Legal Identity</h2>
            <dl className="space-y-5">
              {companyFacts.map((fact) => (
                <div key={fact.label} className="border-l-4 border-[#00E5B9] pl-5">
                  <dt className="text-sm text-[#777777] font-medium uppercase tracking-wide mb-1">{fact.label}</dt>
                  <dd className="text-lg text-[#1B004E] font-medium">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <CtaBand title="Let Us Build Your Care Plan" body="Talk to our team and design a practical care journey for your family." ctaText="Talk to Our Team" />
    </>
  );
}

export function ContactPage() {

  return (
    <>
      <section className="pt-36 pb-20 bg-gradient-to-b from-[#EAF4FF] via-[#F5F5F5] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionEyebrow>CONTACT</SectionEyebrow>
          <h1 className="text-4xl sm:text-5xl font-light text-[#1B004E] mb-6 leading-tight">Talk to Our Care Team - We Are Available 24/7</h1>
          <p className="text-lg text-[#444444] max-w-4xl leading-relaxed">
            Whether you need home nursing tonight, a lab collection tomorrow morning, or international coordination for your family, our care
            coordinators are ready to help.
          </p>
        </div>
      </section>

      <ContactPreview />

      <HowToAccess />

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <SectionEyebrow>OUR SERVICE AREAS</SectionEyebrow>
          <h2 className="text-3xl sm:text-4xl text-[#1B004E] font-light mb-8">Our Service Areas</h2>
          <BulletList
            items={[
              "Islamabad and Rawalpindi - Core service area",
              "Lahore - Full service coverage",
              "Karachi, Faisalabad, Multan, Peshawar - Expanding coverage",
              "International - Diaspora coordination available globally",
            ]}
          />
        </div>
      </section>
    </>
  );
}




