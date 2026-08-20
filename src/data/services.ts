/**
 * Content for the six eShifa service pages.
 *
 * Single source of truth: the /services grid, the home page grid, the navigation
 * dropdown, the footer, related-service links and every page body all read from
 * here, so a service is described in exactly one place.
 *
 * Copy discipline: no invented statistics, awards, certifications, turnaround
 * times or availability guarantees. Claims are limited to what the site already
 * states elsewhere (JCI accreditation, Shifa International Hospitals backing,
 * 24/7 UAN line, the mobile app).
 */

export type ServiceSlug =
  | "home-nursing"
  | "home-laboratory"
  | "home-pharmacy"
  | "home-rehabilitation"
  | "doctor-teleconsultation"
  | "home-vaccination";

export interface ServiceStep {
  title: string;
  body: string;
}

export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceContent {
  slug: ServiceSlug;
  /** Full display name, used in navigation, cards and headings. */
  name: string;
  /** Short label for tight spaces such as breadcrumbs. */
  shortName: string;
  /** One-line summary used on the service cards. */
  cardBlurb: string;
  seo: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  hero: {
    headline: string;
    supporting: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
    trustIndicator: string;
    image: string;
    imageAlt: string;
  };
  about: {
    heading: string;
    paragraphs: string[];
  };
  benefits: string[];
  included: {
    heading: string;
    note?: string;
    items: string[];
  };
  steps: ServiceStep[];
  audience: {
    heading: string;
    items: string[];
  };
  trust: {
    heading: string;
    points: string[];
  };
  /** Optional clinical-safety notice rendered above the FAQs. */
  notice?: string;
  faqs: ServiceFaq[];
  finalCta: {
    heading: string;
    body: string;
  };
  related: ServiceSlug[];
}

const CONTACT = "/contact";

export const services: Record<ServiceSlug, ServiceContent> = {
  /* ------------------------------------------------------------------ */
  "home-nursing": {
    slug: "home-nursing",
    name: "Home Nursing Services",
    shortName: "Home Nursing",
    cardBlurb: "Professional nursing support delivered conveniently to the patient's home.",
    seo: {
      title: "Home Nursing Services | eShifa",
      description:
        "Professional home nursing from eShifa — nursing assessment, vital-sign monitoring, medication support, wound care and post-discharge care delivered at home in Pakistan.",
      ogTitle: "Home Nursing Services | eShifa",
      ogDescription: "Professional nursing care delivered in the comfort of your home, 24/7 across Pakistan.",
    },
    hero: {
      headline: "Professional Nursing Care, Right at Home",
      supporting:
        "Receive professional nursing support in the comfort of your home. Our trained healthcare professionals help patients and families manage ongoing care, recovery, monitoring and daily healthcare needs without unnecessary hospital visits.",
      primaryCta: { label: "Book Home Nursing", href: CONTACT },
      secondaryCta: { label: "Contact Us", href: CONTACT },
      trustIndicator: "Backed by Shifa International Hospitals · Available 24/7",
      image: "nursing.png",
      imageAlt: "eShifa nurse providing bedside nursing care to an elderly patient at home in Pakistan",
    },
    about: {
      heading: "Nursing Care Without Leaving Home",
      paragraphs: [
        "Home Nursing brings professional, clinically guided nursing support to patients who need continued care outside a hospital setting — whether that is after a discharge, during an ongoing treatment plan, or because travelling to a facility has become difficult.",
        "A qualified nurse attends the patient at home and delivers care according to clinical requirements: assessment, monitoring, support with prescribed treatment, and guidance for the family members who share in day-to-day care.",
        "Admitted home-care patients receive 24/7 clinical support and escalation, with the medical team — including consultant oversight — providing timely guidance and intervention for changes in clinical condition or other care-related concerns.",
        "Our trained Home Care Assistants (HCAs) provide compassionate, safe, reliable and personalized support with daily living, hygiene, mobility, feeding, positioning, comfort and family assistance — bringing professional care to patients and elderly people in the comfort of their home.",
        "Because care happens in familiar surroundings, patients avoid unnecessary travel and waiting, and families stay directly involved in the recovery process.",
      ],
    },
    benefits: [
      "Professional nursing care delivered at home",
      "Reduced travel for patients with limited mobility",
      "Nursing support personalized to the care plan",
      "Convenient follow-up after hospital discharge",
      "Practical guidance for patients and their families",
      "Recovery in a comfortable, familiar environment",
    ],
    included: {
      heading: "What's Included",
      note: "Actual services provided depend on the patient's clinical requirements and assessment.",
      items: [
        "Nursing assessment",
        "Vital-sign monitoring",
        "Medication support as prescribed",
        "Wound care where applicable",
        "Post-discharge support",
        "Patient and family education",
        "Basic nursing procedures",
        "Follow-up monitoring",
      ],
    },
    steps: [
      { title: "Book the nursing service", body: "Request a visit through the eShifa app or by calling our 24/7 helpline." },
      { title: "Our team reviews the request", body: "We confirm the requirement and match a suitable healthcare professional." },
      { title: "A professional visits the patient", body: "A qualified nurse attends the patient at the scheduled time." },
      { title: "Care is delivered", body: "Nursing care proceeds according to clinical requirements, with follow-up arranged as needed." },
    ],
    audience: {
      heading: "Who This Service Is For",
      items: [
        "Elderly patients needing regular nursing attention",
        "Patients recently discharged from hospital",
        "Patients with limited mobility",
        "Patients requiring ongoing nursing support",
        "Families seeking professional home healthcare",
      ],
    },
    trust: {
      heading: "Why Choose eShifa for Home Nursing",
      points: [
        "Care delivered by experienced, qualified and trained healthcare professionals",
        "Part of the Shifa International Hospitals healthcare ecosystem",
        "Not a gig platform — frontline staff are vetted and clinically accountable",
        "Service tracking through the eShifa app, with a 24/7 helpline for coordination",
      ],
    },
    faqs: [
      {
        q: "What nursing services can be provided at home?",
        a: "Depending on clinical assessment, a home visit can cover nursing assessment, vital-sign monitoring, medication support as prescribed, wound care, post-surgical support and general nursing care.",
      },
      {
        q: "Who can benefit from Home Nursing?",
        a: "It suits elderly patients, people recently discharged from hospital, patients with limited mobility, and anyone whose care plan requires ongoing nursing support at home.",
      },
      {
        q: "How do I book a home nurse?",
        a: "Book through the eShifa app, available on the Google Play Store and Apple App Store, or call our 24/7 UAN helpline at 051-111-111-567.",
      },
      {
        q: "Can nursing care be arranged after hospital discharge?",
        a: "Yes. Post-discharge support is one of the most common reasons families request home nursing. Share the discharge instructions when booking so the visit can be planned around the care plan.",
      },
      {
        q: "How often can a nurse visit?",
        a: "Visit frequency is arranged around the patient's clinical requirements — from a single visit to a recurring schedule. Our care coordinators will discuss what is appropriate for the case.",
      },
      {
        q: "Can the family be shown how to help with care?",
        a: "Yes. Patient and family education is part of the service, so the people caring for the patient day to day understand what to do between visits.",
      },
    ],
    finalCta: {
      heading: "Need Professional Nursing Support at Home?",
      body: "Speak to our care coordinators about the right nursing plan for your family. We are available 24/7.",
    },
    related: ["home-rehabilitation", "home-laboratory", "doctor-teleconsultation"],
  },

  /* ------------------------------------------------------------------ */
  "home-laboratory": {
    slug: "home-laboratory",
    name: "Home Laboratory Services",
    shortName: "Home Laboratory",
    cardBlurb: "Convenient laboratory sample collection and diagnostic support from home.",
    seo: {
      title: "Home Laboratory Services | eShifa",
      description:
        "Book home sample collection with eShifa. A trained professional collects your sample at home and coordinates it for laboratory processing, with reports delivered through the app or SMS.",
      ogTitle: "Home Laboratory Services | eShifa",
      ogDescription: "Laboratory sample collection at your doorstep, backed by our laboratory network across Pakistan.",
    },
    hero: {
      headline: "Reliable Laboratory Services From the Comfort of Home",
      supporting:
        "Make diagnostic testing more convenient with professional home laboratory services. A trained healthcare professional can collect required samples from your home and coordinate them for laboratory testing.",
      primaryCta: { label: "Book a Home Lab Test", href: CONTACT },
      secondaryCta: { label: "View Available Tests", href: "/labs" },
      trustIndicator: "Extensive laboratory network across Pakistan",
      image: "lab.png",
      imageAlt: "eShifa healthcare professional collecting a blood sample from a patient at home in Pakistan",
    },
    about: {
      heading: "Diagnostics That Come to You",
      paragraphs: [
        "Home Laboratory Services remove the trip to a collection centre. A trained healthcare professional visits at a time that suits you, collects the required sample, and coordinates it for processing through our laboratory network across Pakistan.",
        "Samples are labelled and handled according to proper procedure from collection through to transport, so the diagnostic pathway stays intact between your home and the laboratory.",
        "For families managing an elderly relative's tests, for patients who find travel difficult, and for people with demanding schedules, home collection removes a recurring obstacle to getting tested.",
      ],
    },
    benefits: [
      "Sample collection in your own home",
      "Collection performed by trained healthcare professionals",
      "Scheduling around your availability",
      "No travel or waiting at a collection centre",
      "Professional sample labelling and handling",
      "Straightforward access to diagnostic services",
    ],
    included: {
      heading: "What's Included",
      note: "Available collections depend on the test requested and current service coverage.",
      items: [
        "Blood sample collection",
        "Other approved sample collection",
        "Sample labelling",
        "Safe sample handling",
        "Transportation coordination",
        "Laboratory processing",
        "Report delivery through the app or SMS",
      ],
    },
    steps: [
      { title: "Select or request your test", body: "Tell us which test you need, or share the request from your doctor." },
      { title: "Schedule home collection", body: "Choose a convenient time for the visit through the app or the helpline." },
      { title: "A professional collects the sample", body: "A trained healthcare professional attends and collects the sample at home." },
      { title: "The sample is processed", body: "Your sample is labelled, handled and transported to the laboratory for processing." },
      { title: "Results are delivered", body: "Reports reach you through the eShifa app or SMS so you can share them with your doctor." },
    ],
    audience: {
      heading: "Who This Service Is For",
      items: [
        "Elderly patients for whom travel is difficult",
        "Patients with routine or repeat testing requirements",
        "Families arranging tests on behalf of a relative",
        "Patients recovering at home after a procedure",
        "Working professionals with limited daytime availability",
      ],
    },
    trust: {
      heading: "Why Choose eShifa for Home Laboratory",
      points: [
        "Collection carried out by trained healthcare professionals",
        "An extensive laboratory network across Pakistan",
        "Secure handling of patient records, accessible from anywhere",
        "Reports delivered digitally through the app or SMS",
      ],
    },
    faqs: [
      {
        q: "How do I book a home sample collection?",
        a: "Book through the eShifa app or call our 24/7 UAN helpline at 051-111-111-567. Let us know the test required and a convenient time for the visit.",
      },
      {
        q: "Do I need to fast before my test?",
        a: "Fasting depends entirely on the test. Follow the instructions given by your doctor, and mention the test when booking so our team can confirm any preparation required.",
      },
      {
        q: "How are samples transported?",
        a: "Samples are labelled at the point of collection and handled according to proper procedure during transport to the laboratory, including cold-chain handling where a test requires it.",
      },
      {
        q: "When will I receive my results?",
        a: "Reporting time varies by test. Your report is delivered through the eShifa app or by SMS once laboratory processing is complete, and our helpline can confirm the expected timing for your specific test.",
      },
      {
        q: "Can elderly patients book home laboratory services?",
        a: "Yes — this is one of the most common reasons families use the service. Collection techniques are adapted to keep the experience comfortable for elderly and vulnerable patients.",
      },
      {
        q: "Do I need a doctor's request to book a test?",
        a: "Requirements depend on the test. Share any request form from your doctor when booking, and our care team will confirm what is needed.",
      },
    ],
    finalCta: {
      heading: "Need a Lab Test Without the Extra Travel?",
      body: "Schedule home sample collection at a time that suits you. Our care team will confirm your slot.",
    },
    related: ["doctor-teleconsultation", "home-nursing", "home-pharmacy"],
  },

  /* ------------------------------------------------------------------ */
  "home-pharmacy": {
    slug: "home-pharmacy",
    name: "Home Pharmacy Services",
    shortName: "Home Pharmacy",
    cardBlurb: "Convenient delivery of prescribed medicines and healthcare essentials.",
    seo: {
      title: "Home Pharmacy Services | eShifa",
      description:
        "eShifa Home Pharmacy delivers prescribed, over-the-counter and specialized medicines to your door, with careful handling including cold chain where required.",
      ogTitle: "Home Pharmacy Services | eShifa",
      ogDescription: "Prescribed and over-the-counter medicines delivered conveniently to your home.",
    },
    hero: {
      headline: "Your Medicines, Delivered Conveniently to Your Home",
      supporting:
        "Access prescribed medicines and healthcare essentials more conveniently with eShifa Home Pharmacy Services. Our service helps patients and families receive required pharmacy items without unnecessary travel.",
      primaryCta: { label: "Order Medicines", href: CONTACT },
      secondaryCta: { label: "Contact Pharmacy", href: CONTACT },
      trustIndicator: "Careful packaging, including cold chain where required",
      image: "pharmacy.png",
      imageAlt: "eShifa pharmacy representative delivering a medicine package to a patient's home in Pakistan",
    },
    about: {
      heading: "Pharmacy Support at Your Doorstep",
      paragraphs: [
        "Home Pharmacy Services help patients and families obtain the medicines they have been prescribed without the recurring trip to a pharmacy counter.",
        "Orders are handled professionally from the point of request through to delivery, including careful packaging and cold-chain handling for medicines that require it.",
        "The service is particularly useful for patients on ongoing treatment plans, where the same prescription needs refilling regularly and each collection means another journey.",
      ],
    },
    benefits: [
      "Convenient delivery to your home",
      "Easier access to prescribed medication",
      "Professional handling of pharmacy orders",
      "Practical for ongoing and repeat prescriptions",
      "Saves unnecessary travel to a pharmacy",
      "Convenient for elderly and mobility-limited patients",
    ],
    included: {
      heading: "What's Included",
      note: "Availability may vary based on prescription requirements and stock.",
      items: [
        "Prescription medicine order coordination",
        "Prescribed, over-the-counter and specialized medicines",
        "Medicine delivery to your address",
        "Healthcare essentials",
        "Repeat order support",
        "Pharmacy-related customer support",
      ],
    },
    steps: [
      { title: "Share your prescription", body: "Send your prescription or order details through the app or the helpline." },
      { title: "Your order is reviewed", body: "Our pharmacy team confirms the items and any requirements attached to them." },
      { title: "Your order is prepared", body: "Items are packed carefully, with cold-chain handling where the medicine requires it." },
      { title: "Delivery to your door", body: "Your order is delivered to your address, with support available if anything needs checking." },
    ],
    audience: {
      heading: "Who This Service Is For",
      items: [
        "Patients managing ongoing or long-term treatment",
        "Elderly patients and those with limited mobility",
        "Families coordinating medicines for a relative",
        "Patients recovering at home after a procedure",
        "Anyone whose prescription needs regular refilling",
      ],
    },
    trust: {
      heading: "Why Choose eShifa for Home Pharmacy",
      points: [
        "Pharmacy orders handled by a professional healthcare team",
        "Careful packaging, including cold chain where required",
        "Part of the Shifa International Hospitals healthcare ecosystem",
        "Coordination and support through the app and the 24/7 helpline",
      ],
    },
    faqs: [
      {
        q: "How do I order medicines?",
        a: "Place an order through the eShifa app or call our 24/7 UAN helpline at 051-111-111-567 with your prescription and delivery details.",
      },
      {
        q: "Is a prescription required?",
        a: "A valid prescription is required for prescription-only medicines. Over-the-counter items and healthcare essentials can be ordered without one.",
      },
      {
        q: "Are all medicines available?",
        a: "No — availability may vary based on prescription requirements and stock. Our pharmacy team will confirm what can be supplied when your order is reviewed.",
      },
      {
        q: "Can repeat prescriptions be delivered?",
        a: "Yes. Repeat order support is part of the service, which is useful for patients on ongoing treatment plans.",
      },
      {
        q: "How will my medicines be delivered?",
        a: "Orders are packed carefully and delivered to the address you provide. Medicines that need cold-chain handling are packed accordingly.",
      },
      {
        q: "Who do I contact if something is wrong with my order?",
        a: "Call the 24/7 UAN helpline at 051-111-111-567. Pharmacy-related customer support is part of the service.",
      },
    ],
    finalCta: {
      heading: "Need Your Medicines Delivered?",
      body: "Share your prescription with our pharmacy team and we will arrange delivery to your door.",
    },
    related: ["doctor-teleconsultation", "home-nursing", "home-laboratory"],
  },

  /* ------------------------------------------------------------------ */
  "home-rehabilitation": {
    slug: "home-rehabilitation",
    name: "Home Rehabilitation Services",
    shortName: "Home Rehabilitation",
    cardBlurb: "Professional physiotherapy and rehabilitation care delivered at home.",
    seo: {
      title: "Home Rehabilitation Services | eShifa",
      description:
        "Home rehabilitation from eShifa — physiotherapy, occupational therapy, speech and language therapy, swallowing therapy, behaviour and autism services, ADL training and pain management, delivered at home.",
      ogTitle: "Home Rehabilitation Services | eShifa",
      ogDescription: "Physiotherapy, occupational, speech and behavioural therapy delivered in your home.",
    },
    hero: {
      headline: "Professional Rehabilitation, In the Comfort of Your Home",
      supporting:
        "Receive personalized rehabilitation designed to help improve mobility, communication, swallowing, daily function and independence — without the inconvenience of frequent travel.",
      primaryCta: { label: "Book Home Rehabilitation", href: CONTACT },
      secondaryCta: { label: "Speak With Our Team", href: CONTACT },
      trustIndicator: "Physiotherapy · Occupational · Speech & language · Behavioural",
      image: "rehab.png",
      imageAlt: "eShifa physiotherapist guiding an elderly patient through rehabilitation exercises at home in Pakistan",
    },
    about: {
      heading: "Recovery, Guided at Home",
      paragraphs: [
        "Home Rehabilitation brings the full range of therapy services to the patient — physiotherapy, occupational therapy, speech and language therapy, swallowing assessment, behaviour therapy, autism support and pain management — so treatment happens in the environment where the patient actually needs to function.",
        "A therapist assesses the patient, agrees a rehabilitation plan appropriate to the case, and guides them through it — adjusting as progress is reviewed. Depending on the referral, that may mean therapeutic exercise, communication and swallowing work, behavioural strategies, or training in the activities of daily living.",
        "Practising in the home has a practical advantage: skills are trained against the real stairs, doorways, furniture and routines the patient lives with, rather than a clinic setting.",
      ],
    },
    benefits: [
      "Rehabilitation delivered in your own home",
      "Physiotherapy, occupational, speech and behavioural therapy",
      "Therapy personalized to the assessment",
      "No travel required for each session",
      "Recovery in a comfortable, familiar environment",
      "Progress monitored and the plan adjusted",
    ],
    included: {
      heading: "What's Included",
      note: "The rehabilitation plan depends on clinical assessment of the individual patient.",
      items: [
        "Assessment and rehabilitation planning",
        "Physiotherapy and guided therapeutic exercise",
        "Strength, balance and functional mobility training",
        "Occupational therapy",
        "Activities of Daily Living (ADL) training",
        "Speech and language therapy",
        "Swallowing evaluation and swallowing therapy",
        "Behaviour therapy",
        "Autism support services",
        "Pain management",
        "Progress monitoring",
        "Patient and family education",
      ],
    },
    steps: [
      { title: "Request rehabilitation support", body: "Book through the app or the helpline and share any referral or discharge notes." },
      { title: "Assessment at home", body: "A therapist assesses mobility and current function in the home environment." },
      { title: "A plan is agreed", body: "A rehabilitation plan is set out based on the assessment and the patient's goals." },
      { title: "Guided sessions", body: "The therapist guides the patient through therapeutic exercise at each visit." },
      { title: "Progress is reviewed", body: "Progress is monitored over time and the plan adjusted as the patient improves." },
    ],
    audience: {
      heading: "Who This Service Is For",
      items: [
        "Post-operative patients continuing recovery at home",
        "Elderly patients working on mobility and balance",
        "Patients recovering from an injury or stroke",
        "Children and adults needing speech and language therapy",
        "Patients with swallowing difficulties",
        "Children requiring behaviour therapy or autism support",
        "Patients managing long-term pain",
        "Anyone relearning the activities of daily living",
      ],
    },
    trust: {
      heading: "Why Choose eShifa for Home Rehabilitation",
      points: [
        "Sessions delivered by qualified, trained therapists",
        "Plans built on professional assessment, not a fixed template",
        "Part of the Shifa International Hospitals healthcare ecosystem",
        "Coordination and follow-up through the app and 24/7 helpline",
      ],
    },
    faqs: [
      {
        q: "What rehabilitation services are available at home?",
        a: "Home rehabilitation covers physiotherapy, occupational therapy, speech and language therapy, swallowing evaluation and therapy, behaviour therapy, autism services, pain management and Activities of Daily Living (ADL) training.",
      },
      {
        q: "Can physiotherapy really be provided at home?",
        a: "Yes. A therapist attends with the equipment appropriate to the plan, and works with the patient in their own environment — which is often an advantage for mobility training.",
      },
      {
        q: "How many sessions will I need?",
        a: "That depends on the assessment, the condition and the patient's goals. Your therapist will discuss an appropriate plan and review it as progress is monitored.",
      },
      {
        q: "Is home rehabilitation suitable after surgery?",
        a: "Post-operative recovery is a common reason for home rehabilitation. Share your discharge instructions or surgeon's advice when booking so the plan can be built around them.",
      },
      {
        q: "Will my progress be monitored?",
        a: "Yes. Progress monitoring is part of the service, and the rehabilitation plan is adjusted over time based on how the patient responds.",
      },
      {
        q: "Can family members be involved in the sessions?",
        a: "Yes. Patient and family education is included, so the people supporting the patient understand how to help safely between visits.",
      },
    ],
    finalCta: {
      heading: "Continue Your Recovery at Home",
      body: "Talk to our team about a rehabilitation plan built around your assessment and your goals.",
    },
    related: ["home-nursing", "doctor-teleconsultation", "home-pharmacy"],
  },

  /* ------------------------------------------------------------------ */
  "doctor-teleconsultation": {
    slug: "doctor-teleconsultation",
    name: "Doctor Teleconsultation",
    shortName: "Teleconsultation",
    cardBlurb:
      "Consult qualified doctors remotely using a secure and convenient digital consultation experience.",
    seo: {
      title: "Doctor Teleconsultation | eShifa",
      description:
        "Consult qualified physicians and specialists remotely with eShifa. Book a teleconsultation, receive digital prescriptions and arrange follow-up care without travelling.",
      ogTitle: "Doctor Teleconsultation | eShifa",
      ogDescription: "Consult a qualified doctor from home, with digital prescriptions and follow-up care.",
    },
    hero: {
      headline: "Consult a Doctor From Wherever You Are",
      supporting:
        "Connect with a qualified healthcare professional remotely for convenient medical consultation, follow-up discussions and general healthcare guidance without needing to travel to the hospital for every visit.",
      primaryCta: { label: "Book Teleconsultation", href: CONTACT },
      secondaryCta: { label: "Find a Doctor", href: "/doctors" },
      trustIndicator: "General physicians and specialists · 9am-5pm, Monday to Saturday",
      image: "teleconsultation.png",
      imageAlt: "Patient consulting an eShifa doctor by video teleconsultation from home in Pakistan",
    },
    about: {
      heading: "A Doctor's Time, Without the Journey",
      paragraphs: [
        "Doctor Teleconsultation connects patients with qualified physicians and specialists through a secure digital consultation, so a medical conversation does not require a trip to the hospital.",
        "It suits general medical discussion, follow-up after an earlier visit, review of reports, and guidance on whether a condition needs to be seen in person.",
        "Consultations are documented in your medical record, and where labs, medicines or nursing are the next step, eShifa's other services pick up from there without you having to start again elsewhere.",
      ],
    },
    benefits: [
      "Consult a doctor from home",
      "No travel for routine discussions",
      "Convenient appointment scheduling",
      "Straightforward follow-up consultations",
      "Access from a phone, tablet or laptop",
      "Useful for general medical guidance, report review, and specialist consultant teleconsultations",
    ],
    included: {
      heading: "What's Included",
      note: "The scope of any consultation is determined by the treating doctor.",
      items: [
        "Consultation with a general physician or specialist",
        "Discussion of your health concern",
        "Review of reports where relevant",
        "A digital prescription issued for your consultation",
        "Notes recorded in your medical record",
        "Guidance on appropriate next steps",
        "Follow-up consultation where required",
      ],
    },
    steps: [
      { title: "Select a doctor or specialty", body: "Choose the type of consultation you need through the app or the helpline." },
      { title: "Choose an appointment", body: "Pick from the available consultation times." },
      { title: "Connect on the platform", body: "Join the consultation from your phone, tablet or laptop at the appointed time." },
      { title: "Discuss your concern", body: "Talk through your health concern with the doctor and share any reports." },
      { title: "Receive guidance", body: "The doctor advises on appropriate next steps, including in-person care where needed." },
    ],
    audience: {
      heading: "Who This Service Is For",
      items: [
        "Patients seeking general medical guidance",
        "Patients following up after an earlier consultation",
        "Patients wanting reports reviewed by a doctor",
        "Families abroad coordinating care for a relative in Pakistan",
        "Anyone for whom travelling to a facility is inconvenient",
      ],
    },
    trust: {
      heading: "Why Choose eShifa for Teleconsultation",
      points: [
        "Consultations with qualified physicians and specialists",
        "Part of the Shifa International Hospitals healthcare ecosystem",
        "Secure management of patient records, accessible from anywhere in the world",
        "Integrated with eShifa laboratory, pharmacy and nursing services",
      ],
    },
    notice:
      "Teleconsultation may not be appropriate for all medical conditions. Patients experiencing a medical emergency should seek immediate emergency care.",
    faqs: [
      {
        q: "How do I book a teleconsultation?",
        a: "Book through the eShifa app or call our 24/7 UAN helpline at 051-111-111-567, then choose a doctor or specialty and an available appointment time.",
      },
      {
        q: "What device do I need?",
        a: "A smartphone, tablet or laptop with a working camera, microphone and a stable internet connection is sufficient.",
      },
      {
        q: "Can every medical condition be treated online?",
        a: "No. Teleconsultation may not be appropriate for all conditions, and some require physical examination or investigation. The doctor will advise if you need to be seen in person.",
      },
      {
        q: "Can I book follow-up consultations?",
        a: "Yes. Follow-up consultations can be arranged, and your notes are recorded in your medical record so the next doctor has the context.",
      },
      {
        q: "When should I visit the hospital instead?",
        a: "Seek immediate emergency care for any medical emergency rather than booking a teleconsultation. For non-emergencies, the doctor will tell you if an in-person visit is required.",
      },
      {
        q: "Will I receive a prescription?",
        a: "A digital prescription may be issued where the doctor considers it clinically appropriate for your case.",
      },
      {
        q: "Can eShifa arrange the tests or medicines the doctor recommends?",
        a: "Yes. Home laboratory collection, home pharmacy delivery and home nursing can all be arranged through eShifa after your consultation.",
      },
    ],
    finalCta: {
      heading: "Speak With a Doctor From Home",
      body: "Book a teleconsultation with a qualified physician or specialist at a time that suits you.",
    },
    related: ["home-laboratory", "home-pharmacy", "home-vaccination"],
  },

  /* ------------------------------------------------------------------ */
  "home-vaccination": {
    slug: "home-vaccination",
    name: "Home Vaccination Services",
    shortName: "Home Vaccination",
    cardBlurb: "Professional vaccination services delivered safely and conveniently at home.",
    seo: {
      title: "Home Vaccination Services | eShifa",
      description:
        "Professional home vaccination from eShifa — appointment coordination, pre-vaccination screening, appropriate vaccine handling, safe administration and post-vaccination guidance.",
      ogTitle: "Home Vaccination Services | eShifa",
      ogDescription: "Routine and travel vaccinations administered safely at home by trained clinical staff.",
    },
    hero: {
      headline: "Safe Vaccinations, Delivered to Your Home",
      supporting:
        "Receive professional vaccination services conveniently at home. Our trained healthcare professionals help make vaccination more accessible for individuals and families while following appropriate clinical and safety procedures.",
      primaryCta: { label: "Book Home Vaccination", href: CONTACT },
      secondaryCta: { label: "Check Vaccine Availability", href: CONTACT },
      trustIndicator: "Appropriate vaccine handling and safe sharps disposal",
      image: "vaccination.png",
      imageAlt: "eShifa nurse administering a vaccination to a patient at home with a vaccine carrier in Pakistan",
    },
    about: {
      heading: "Vaccination Without the Waiting Room",
      paragraphs: [
        "Home Vaccination brings routine and travel vaccinations to the patient, administered by trained healthcare professionals following appropriate clinical and safety procedures.",
        "Vaccines require careful handling to remain effective. Visits are equipped for appropriate vaccine transport and handling, sterile administration, and safe sharps disposal afterwards.",
        "For families vaccinating several members, for elderly patients, and for anyone who finds a clinic visit difficult, home administration removes a practical barrier to staying protected.",
      ],
    },
    benefits: [
      "Vaccination administered in your home",
      "Trained healthcare professionals",
      "Convenient appointment scheduling",
      "Practical for vaccinating a whole family",
      "No travel or waiting room required",
      "Professional vaccine handling procedures",
    ],
    included: {
      heading: "What's Included",
      note: "Availability depends on the vaccine requested. We cannot guarantee that every vaccine is available.",
      items: [
        "Appointment coordination",
        "Basic pre-vaccination screening",
        "Appropriate vaccine handling and transport",
        "Professional vaccine administration",
        "Safe sharps disposal",
        "Post-vaccination guidance",
      ],
    },
    steps: [
      { title: "Book your vaccination", body: "Request the vaccine you need through the app or the 24/7 helpline." },
      { title: "Availability is confirmed", body: "Our team confirms whether the vaccine can be supplied and arranges a time." },
      { title: "Pre-vaccination screening", body: "Basic screening is carried out before administration on the day of the visit." },
      { title: "Vaccine is administered", body: "A trained professional administers the vaccine and disposes of sharps safely." },
      { title: "Post-vaccination guidance", body: "You receive guidance on what to expect and what to watch for afterwards." },
    ],
    audience: {
      heading: "Who This Service Is For",
      items: [
        "Families vaccinating several members together",
        "Elderly patients and those with limited mobility",
        "Travellers needing vaccination before departure",
        "Patients continuing a routine vaccination schedule",
        "Anyone who prefers to avoid a clinic waiting room",
      ],
    },
    trust: {
      heading: "Why Choose eShifa for Home Vaccination",
      points: [
        "Administered by trained, qualified clinical staff",
        "Appropriate vaccine handling and cold-chain transport",
        "Safe sharps disposal handled by the visiting professional",
        "Part of the Shifa International Hospitals healthcare ecosystem",
      ],
    },
    faqs: [
      {
        q: "Who can receive vaccination at home?",
        a: "Home vaccination is available for individuals and families. Basic pre-vaccination screening is carried out on the day, and suitability for a particular vaccine is confirmed at that point.",
      },
      {
        q: "Which vaccines are available?",
        a: "Availability depends on the vaccine and current stock — we cannot guarantee that every vaccine is available. Contact our team to confirm before booking.",
      },
      {
        q: "How are vaccines transported?",
        a: "Vaccines are transported in appropriate carriers to maintain the required handling conditions, and are administered by the professional who brings them.",
      },
      {
        q: "Can multiple family members book together?",
        a: "Yes. Booking several family members into a single visit is one of the practical advantages of home vaccination.",
      },
      {
        q: "What should I prepare before vaccination?",
        a: "Have any vaccination records available, wear clothing that allows easy access to the upper arm, and mention relevant medical history or allergies during screening.",
      },
      {
        q: "What should I do after receiving the vaccine?",
        a: "You will be given post-vaccination guidance on what to expect and what to watch for. Contact our helpline if you have any concerns after the visit.",
      },
      {
        q: "Is sharps waste taken away afterwards?",
        a: "Yes. Safe sharps disposal is part of the visit and is handled by the attending professional.",
      },
    ],
    finalCta: {
      heading: "Book Your Vaccination at Home",
      body: "Contact our team to confirm vaccine availability and arrange a convenient appointment.",
    },
    related: ["doctor-teleconsultation", "home-nursing", "home-laboratory"],
  },
};

/** Display order used by every service grid, dropdown and footer list. */
export const serviceOrder: ServiceSlug[] = [
  "home-nursing",
  "home-laboratory",
  "home-pharmacy",
  "home-rehabilitation",
  "doctor-teleconsultation",
  "home-vaccination",
];

export const serviceList: ServiceContent[] = serviceOrder.map((slug) => services[slug]);

export const servicePath = (slug: ServiceSlug) => `/services/${slug}`;

export function isServiceSlug(value: string): value is ServiceSlug {
  return Object.prototype.hasOwnProperty.call(services, value);
}
