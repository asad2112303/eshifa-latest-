import { Fragment } from "react";
import Link from "next/link";
import { Noto_Nastaliq_Urdu } from "next/font/google";
import { ChevronDown, ChevronRight } from "lucide-react";
import { letterOf, type GuideSection, type RichBlock, type MedicalTest } from "@/data/medical-tests";
import { OpenEntryFromHash } from "@/components/site/patient-guide-hash";

/**
 * The A–Z entries themselves, server-rendered so every test is in the HTML
 * for search engines and for readers without JavaScript.
 *
 * Each entry is a native <details> accordion. The shared `name` makes them
 * exclusive in browsers that support it, matching Shifa's one-open-at-a-time
 * behaviour, and degrades to independent toggles elsewhere.
 *
 * With no filter, the full A–Z is an index of titles instead: every body
 * inline would be well over a megabyte of HTML (Next also embeds the rendered
 * tree a second time for hydration), for a reader who wants one entry. Each
 * title links to its letter view with the entry opened. A letter never holds
 * more than a few dozen entries, so those views carry the bodies.
 *
 * Nastaliq is the script Urdu readers in Pakistan expect; the system Arabic
 * fallback renders Urdu in Naskh, which reads as foreign. The font is loaded
 * here, not in the root layout, so only this page pays for it.
 */
const urduFont = Noto_Nastaliq_Urdu({ subsets: ["arabic"], weight: "400", display: "swap" });

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Title with the search term marked, so a reader can see why an entry matched. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "ig"));
  const needle = query.toLowerCase();
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === needle ? (
          <mark key={index} className="rounded bg-yellow-200 px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Runs({ runs }: { runs: RichBlock["runs"] }) {
  return (
    <>
      {runs.map((run, index) =>
        run.href ? (
          <a
            key={index}
            href={run.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all font-sans text-[#0289E8] hover:underline"
          >
            {run.text}
          </a>
        ) : (
          <Fragment key={index}>{run.text}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * One language column. Urdu is right-aligned in Nastaliq with the tall line
 * height that script needs; the mixed Urdu-and-URL lines are kept in the
 * document's left-to-right flow, as the source authored them, so the
 * "read more" link sits where it does on Shifa's page.
 */
function RichText({ blocks, lang }: { blocks: RichBlock[]; lang: "ur" | "en" }) {
  const urdu = lang === "ur";
  return (
    <div lang={lang} className={urdu ? `${urduFont.className} text-right` : "text-left"}>
      {blocks.map((block, index) =>
        block.type === "heading" ? (
          <p
            key={index}
            className={`mb-2 text-[#0289E8] md:mb-4 ${urdu ? "text-xl leading-[40px] md:text-2xl md:leading-[52px]" : "text-xl font-semibold leading-snug"}`}
          >
            <Runs runs={block.runs} />
          </p>
        ) : (
          <p
            key={index}
            className={`text-[#444444] ${urdu ? "text-base leading-[34px] md:text-lg md:leading-[44px]" : "leading-relaxed md:mt-2"}`}
          >
            <Runs runs={block.runs} />
          </p>
        ),
      )}
    </div>
  );
}

export type EntryMode = "inline" | "index";

const rowClass =
  "flex items-center justify-between gap-4 py-4 text-lg font-medium text-[#444444] transition-colors hover:text-[#1B004E]";

function GuideEntry({ item, query, mode }: { item: MedicalTest; query: string; mode: EntryMode }) {
  const hasUrdu = item.urdu.length > 0;
  const hasEnglish = item.english.length > 0;
  const title = <Highlight text={item.title} query={query} />;

  if (mode === "index" && (hasUrdu || hasEnglish)) {
    return (
      <div id={item.slug} className="border-b border-[#E6E9EF]">
        <Link
          href={`/patient-guide?letter=${letterOf(item.title)}#${item.slug}`}
          className={rowClass}
        >
          <span>{title}</span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#0289E8]" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // A handful of entries are titles only at the source; a row that cannot open
  // should not look like one that can.
  if (!hasUrdu && !hasEnglish) {
    return (
      <div id={item.slug} className="border-b border-[#E6E9EF] py-4">
        <p className="text-lg font-medium text-[#444444]">{title}</p>
      </div>
    );
  }

  return (
    <details id={item.slug} name="patient-guide-entry" className="group scroll-mt-28 border-b border-[#E6E9EF]">
      <summary className={`${rowClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
        <span>{title}</span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-[#0289E8] transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="flex flex-col gap-4 pb-6 md:flex-row md:gap-6">
        {hasUrdu && (
          <div className={`${hasEnglish ? "md:w-1/2" : "w-full"} md:px-4`}>
            <RichText blocks={item.urdu} lang="ur" />
          </div>
        )}
        {hasUrdu && hasEnglish && <div className="hidden w-px bg-[#E6E9EF] md:block" aria-hidden="true" />}
        {hasEnglish && (
          <div className={`${hasUrdu ? "md:w-1/2" : "w-full"} md:px-4`}>
            <RichText blocks={item.english} lang="en" />
          </div>
        )}
      </div>
    </details>
  );
}

export function PatientGuideList({
  sections,
  query,
  mode,
}: {
  sections: GuideSection[];
  query: string;
  mode: EntryMode;
}) {
  if (sections.length === 0) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-[#E1E5EC] bg-white p-10 text-center">
        <p className="text-[#444444]">
          No tests match <span className="font-semibold text-[#1B004E]">“{query}”</span>. Try a
          shorter word, or pick a letter above.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <OpenEntryFromHash />
      {sections.map(({ letter, items }) => (
        <section key={letter} id={`letter-${letter}`} aria-labelledby={`letter-${letter}-heading`} className="mb-10">
          <h2
            id={`letter-${letter}-heading`}
            className="mb-6 inline-block rounded-lg bg-[#0289E8]/10 px-[18px] py-[10px] text-2xl font-bold leading-none text-[#0289E8]"
          >
            {letter}
          </h2>
          {items.length > 0 ? (
            <div className="flex flex-col">
              {items.map((item) => (
                <GuideEntry key={item.id} item={item} query={query} mode={mode} />
              ))}
            </div>
          ) : (
            <p className="border-b border-[#E6E9EF] pb-5 text-center text-lg italic text-[#777777]">
              No record found
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
