/**
 * A–Z guide to medical tests, in Urdu with English where the source provides
 * it.
 *
 * The entries are a snapshot of the "Tests & Procedures" tab of Shifa
 * International Hospitals' Patient Guide, taken with
 * scripts/fetch-medical-tests.mjs, which keeps the tests (lab work,
 * imaging, screening, exams, biopsies and scopes) and drops the treatments
 * that share the tab. Run `npm run fetch:tests` to refresh the JSON; do not
 * hand-edit it, the next refresh would overwrite the change.
 *
 * Each entry's rich text is already split into Urdu and English columns, the
 * way Shifa's own page displays it, so rendering is a straight map over blocks.
 */

import snapshot from "./medical-tests.json";

export interface TextRun {
  text: string;
  /** Present on "read more" links, which point at shifanews.com articles. */
  href?: string;
}

export interface RichBlock {
  type: "heading" | "paragraph";
  runs: TextRun[];
}

export interface MedicalTest {
  /** Shifa's own record id; stable across refreshes. */
  id: number;
  /** Kebab-case title, unique, usable as an in-page anchor. */
  slug: string;
  title: string;
  urdu: RichBlock[];
  english: RichBlock[];
}

export const medicalTests: MedicalTest[] = snapshot.items as MedicalTest[];

/** Where the content comes from, for the attribution line on the page. */
export const TESTS_SOURCE_URL = snapshot.source;

export const LETTERS: readonly string[] = Array.from({ length: 26 }, (_, i) =>
  String.fromCharCode(65 + i),
);

/** Longest search accepted from the URL; anything longer is noise, not a title. */
const MAX_QUERY_LENGTH = 80;

const firstParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/** A single A–Z letter from the `letter` query parameter, or null for anything else. */
export function parseLetter(value: string | string[] | undefined): string | null {
  const letter = (firstParam(value) ?? "").trim().toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : null;
}

/** Free-text search from the `q` query parameter, trimmed and bounded. */
export function parseQuery(value: string | string[] | undefined): string {
  return (firstParam(value) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export const letterOf = (title: string) => title.trim().charAt(0).toUpperCase();

export interface GuideSection {
  letter: string;
  items: MedicalTest[];
}

/**
 * The letter groups to show for a given filter, in the same shape as Shifa's
 * page: one chosen letter shows only that group even when it is empty; a
 * search shows only the letters that have a match; no filter shows all 26,
 * so a reader can see at a glance which letters have nothing yet.
 *
 * Search is a case-insensitive match anywhere in the title, which is what the
 * source's own title filter does.
 */
export function guideSections({ letter, query }: { letter: string | null; query: string }): GuideSection[] {
  if (letter) {
    return [{ letter, items: medicalTests.filter((item) => letterOf(item.title) === letter) }];
  }

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? medicalTests.filter((item) => item.title.toLowerCase().includes(needle))
    : medicalTests;

  const grouped = new Map<string, MedicalTest[]>();
  for (const item of matches) {
    const key = letterOf(item.title);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  const letters = needle ? [...grouped.keys()].sort() : LETTERS;
  return letters.map((key) => ({ letter: key, items: grouped.get(key) ?? [] }));
}
