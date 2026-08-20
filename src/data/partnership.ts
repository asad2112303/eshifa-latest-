/**
 * Content for the /partner page (healthcare partnership / franchise models).
 *
 * Source: "8Franchise Models eShifa Updated.docx". Figures are reproduced as
 * given; the page renders them from here so a commercial term is stated in
 * exactly one place and cannot drift between the two requirement tables.
 *
 * Icons are chosen in the component, not here, so this stays plain data.
 */

export const partnershipIntro = [
  "Shifa International Hospital Islamabad is a 550-bed quaternary care healthcare facility, offering quality services to local as well as international patient communities for over 25 years. The prestigious JCI accreditation has further strengthened our commitment and focus towards quality and patient safety.",
  "eShifa is Pakistan's First Digital and Home Healthcare Services Provider. eShifa is an outreach partner of Shifa International Hospitals.",
];

export const partnershipLead =
  "eShifa is providing a golden opportunity to be part of the leading healthcare system. eShifa gratifies its partners in a sustainable model with continuous growth, where the sky is the limit.";

export const partnershipFeatures = [
  "A jointly branded healthcare facility with the name of eShifa & Shifa.",
  "Access to all IT infrastructure of eShifa, comprising of Electronic Medical Records and Lab Information System.",
  "Appointment System, Billing and Registration, etc.",
  "Access to Medical Staff of eShifa.",
  "Access to eShifa telemedicine platform for greater patient reach.",
  "Access to eShifa home care program through field service management.",
  "Access to eShifa operational framework for efficient running of the facility.",
];

export interface BusinessModel {
  code: string;
  name: string;
  description: string;
  /** Category labels, for models offered at more than one investment tier. */
  categories?: string[];
}

export const businessModels: BusinessModel[] = [
  {
    code: "LPP",
    name: "eShifa Labs Collection Point",
    description: "eShifa Labs Collection Point for Laboratory Services.",
    categories: ["Category A", "Category B", "Category C"],
  },
  {
    code: "LPP+",
    name: "eShifa Labs Collection Point Plus",
    description:
      "eShifa Labs Collection Point and Telemedicine setup, providing services of Lab and Tele Consultation.",
  },
];

export interface RequirementTable {
  caption: string;
  /** Column headers, excluding the leading description column. */
  columns: string[];
  rows: Array<{ label: string; values: string[] }>;
}

const REGISTRATION_NOTE =
  "+ Registration charges as per location (Healthcare Regulatory Authority fee)";

export const lppRequirements: RequirementTable = {
  caption: "eShifa Labs Collection Point (LPP): Categories A, B and C",
  columns: ["LPP Category A", "LPP Category B", "LPP Category C"],
  rows: [
    {
      label: "Approximate Investment",
      values: [
        "Around PKR 2,000,000 +/- PKR 500,000",
        "Around PKR 1,200,000 +/- PKR 500,000",
        "Around PKR 900,000 +/- PKR 500,000",
      ],
    },
    {
      label: "One Time Franchise Onboarding Fee",
      values: [
        `PKR 525,000 (PKR 400,000 refundable + PKR 125,000 processing fee, non-refundable) ${REGISTRATION_NOTE}`,
        `PKR 425,000 (PKR 300,000 refundable + PKR 125,000 processing fee, non-refundable) ${REGISTRATION_NOTE}`,
        `PKR 325,000 (PKR 200,000 refundable + PKR 125,000 processing fee, non-refundable) ${REGISTRATION_NOTE}`,
      ],
    },
    {
      label: "Areas Eligible for the Category",
      values: [
        "All main cities of Pakistan",
        "All surrounding territories of main cities in Pakistan",
        "All rural areas, towns, etc.",
      ],
    },
    {
      label: "Required Area",
      values: ["Minimum 350 square feet", "Minimum 300 square feet", "Minimum 250 square feet"],
    },
    {
      label: "Software",
      values: ["Free of cost", "Free of cost", "Free of cost"],
    },
    {
      label: "Layout Design & Equipment",
      values: ["eShifa Standard", "eShifa Standard", "eShifa Standard"],
    },
    {
      label: "Yearly Franchise Retention Fee",
      values: [
        "No retention fee till agreement terms",
        "No retention fee till agreement terms",
        "No retention fee till agreement terms",
      ],
    },
    {
      label: "Revenue Share",
      values: [
        "30% of the lab revenue (5% extra for the first 3 months for marketing)",
        "30% of the lab revenue (5% extra for the first 3 months for marketing)",
        "30% of the lab revenue (5% extra for the first 3 months for marketing)",
      ],
    },
  ],
};

export const lppPlusRequirements: RequirementTable = {
  caption: "eShifa Labs Collection Point Plus (LPP+)",
  columns: ["LPP+"],
  rows: [
    { label: "Approximate Investment", values: ["Around PKR 2,000,000 +/- PKR 500,000"] },
    {
      label: "One Time Franchise Onboarding Fee",
      values: [
        `PKR 1,000,000 (PKR 400,000 refundable + PKR 200,000 processing fee, non-refundable, + PKR 400,000 for Telemedicine Kiosk) ${REGISTRATION_NOTE}`,
      ],
    },
    {
      label: "Areas Eligible for the Healthcare Partnership",
      values: ["All main cities of Pakistan"],
    },
    { label: "Required Area", values: ["Minimum 400 square feet"] },
    { label: "Software", values: ["Free of cost"] },
    { label: "Layout Design", values: ["eShifa Standard"] },
    { label: "Yearly Franchise Retention Fee", values: ["No retention fee till agreement terms"] },
    {
      label: "Revenue Share",
      values: [
        "30% of the revenue (5% extra for the first 3 months for marketing) / TBD, & 5% on tele-consultations",
      ],
    },
  ],
};

export const partnershipNotes = [
  "Above mentioned requirements may vary as per facility and Shifa/eShifa policy from time to time.",
  "Other terms and conditions apply as per the Franchise Agreement.",
];

export const eshifaSupport = [
  {
    title: "Brand Support",
    body: "With the help of our brand and trademarks, you will be in a position to compete with the existing market and increase your revenue.",
  },
  {
    title: "Collection Center Setup Support",
    body: "We will help you right from collection center design, infrastructure, equipment and other item selection lists through online (telephonic/email) mode.",
  },
  {
    title: "Collection Center SOPs",
    body: "With the SOPs, quality policies and other standardization of Shifa/eShifa, you can monitor and improve the in-house quality of the lab, which is essential for credibility.",
  },
  {
    title: "Internal/External Inspection",
    body: "eShifa holds the right to inspect the site, announced or unannounced.",
  },
  {
    title: "Operations Management Support",
    body: "eShifa will provide you lab supplies (non-capital items), staff training and operations management guidance.",
  },
  {
    title: "Business Promotion Support",
    body: "E-copies of marketing flyers, referral pads, skins, wall hangings, glass logos, glass-door stickers, etc.",
  },
];

export const expansionRights = [
  {
    category: "Category A",
    body: "The Category A franchise partner has the option to expand their network by obtaining two additional franchises from each category if they so desire.",
  },
  {
    category: "Category B",
    body: "The Category B franchise partner has the option to expand their network by obtaining one additional franchise from Category B and C if they so desire.",
  },
  {
    category: "Category C",
    body: "The Category C franchise partner has no option to expand their network.",
  },
];
