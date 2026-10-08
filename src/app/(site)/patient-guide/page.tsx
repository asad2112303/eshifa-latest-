import type { Metadata } from "next";
import { PatientGuideToolbar } from "@/components/site/patient-guide-toolbar";
import { PatientGuideList } from "@/components/site/patient-guide-list";
import {
  TESTS_SOURCE_URL,
  guideSections,
  parseLetter,
  parseQuery,
  medicalTests,
} from "@/data/medical-tests";

/**
 * Above this many matches the list shows titles that link to the entry instead
 * of inline bodies. Every letter is under it, so letter views always expand in
 * place; only the unfiltered A–Z and very broad searches become an index.
 */
const MAX_INLINE_ENTRIES = 60;

const description =
  "A to Z guide to medical tests explained in Urdu: blood tests, scans, screenings and biopsies, from A1C to X-ray.";

export const metadata: Metadata = {
  title: "Medical Tests A–Z | Patient Guide",
  description,
  // Letter and search views are filtered versions of this one page.
  alternates: { canonical: "/patient-guide" },
  openGraph: { title: "Medical Tests A–Z | Patient Guide", description, url: "/patient-guide" },
};

/**
 * Reading the query string makes this page render per request, which is what
 * the letter and search filters need; the data itself is bundled, so a render
 * is a filter over an in-memory array.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const letter = parseLetter(params.letter);
  // Choosing a letter clears the search, as on the source page.
  const query = letter ? "" : parseQuery(params.q);
  const sections = guideSections({ letter, query });
  const total = sections.reduce((sum, section) => sum + section.items.length, 0);
  const mode = total <= MAX_INLINE_ENTRIES ? "inline" : "index";

  return (
    <>
      <section className="bg-gradient-to-b from-[#EAF4FF] via-[#F5F5F5] to-white pb-14 pt-36">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0289E8]">
            A–Z Patient Guide
          </p>
          <h1 className="mt-3 text-4xl font-light leading-tight text-[#1B004E] sm:text-5xl">
            Medical Tests
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#444444]">
            A reliable, plain-language guide to the medical tests your doctor may recommend, explained
            in Urdu. From blood tests and scans to screenings and biopsies, know what each one involves
            so you can make informed decisions about your care.
          </p>
          <p className="mt-4 text-sm text-[#777777]">
            {medicalTests.length} tests · Urdu explanations
          </p>
        </div>
      </section>

      <section className="bg-white pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-8">
          <PatientGuideToolbar letter={letter} query={query} />
          <PatientGuideList sections={sections} query={query} mode={mode} />

          <p className="mt-14 text-center text-sm text-[#777777]">
            Content from the{" "}
            <a
              href={TESTS_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#0289E8] hover:underline"
            >
              Shifa International Hospitals Patient Guide
            </a>
            . It is general information and does not replace advice from your treating clinician. For
            anything urgent, call 051-111-111-567.
          </p>
        </div>
      </section>
    </>
  );
}
