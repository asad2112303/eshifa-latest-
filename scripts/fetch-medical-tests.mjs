#!/usr/bin/env node
/**
 * Pull the "Tests & Procedures" tab of Shifa International Hospitals' A–Z
 * Patient Guide, keep the tests, and write them to
 * src/data/medical-tests.json.
 *
 *   node scripts/fetch-medical-tests.mjs
 *
 * Why a snapshot rather than a live fetch at request time: the page should
 * render even when the hospital backend is slow or down, and the content only
 * changes when Shifa's editors publish, which is rare.
 *
 * Only tests are published. The source mixes diagnostics with treatments
 * (surgery, transplants, therapies, implants) under one tab; eShifa's guide
 * is about tests, so treatments are dropped here by title. The script prints
 * every dropped title so a refresh can be checked by eye, since a new entry
 * with an unusual name could land on the wrong side.
 *
 * Source: https://www.shifa.com.pk/patient-guide?tab=Tests+%26+Procedures
 * The page itself is client-rendered; its data comes from the Strapi endpoint
 * below. Each entry is Strapi "blocks" rich text (headings and paragraphs whose
 * children are text runs and links), written mostly in Urdu with an English
 * block on a few entries. Shifa's front end splits every block into an Urdu
 * and an English copy by testing each run for Arabic-script characters, and
 * shows the two side by side. The same split is applied here, once, so the
 * site ships ready-to-render columns instead of redoing it per request.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SOURCE_PAGE = "https://www.shifa.com.pk/patient-guide?tab=Tests+%26+Procedures";
const ENDPOINT = "https://be.shifa.com.pk/api/disease-test/filter";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/data/medical-tests.json");

const URDU = /[؀-ۿ]/;

/**
 * Classification by title, checked in this order.
 *
 * Treatments are rejected first, whatever else the title says, so a future
 * "stress test ablation" cannot slip in on the word "test".
 */
const TREATMENT =
  /surgery|transplant|therapy|rehab|replacement|implant|ablation|injection|removal|reconstruction|transfusion|donation|anesthesia|plasty|ectomy/i;

/**
 * Invasive diagnostics: biopsies, scopes, taps, catheter angiograms. They are
 * tests by purpose and procedures by experience. Flip this to false to leave
 * them out as well. Non-invasive look-alikes (CT angiogram, virtual
 * colonoscopy) are matched by the test pattern instead.
 */
const KEEP_DIAGNOSTIC_PROCEDURES = true;
const DIAGNOSTIC_PROCEDURE =
  /biops|bone marrow examination|endoscop|enteroscopy|bronchoscopy|puncture|amniocentesis|discogram|^(angiogram|coronary angiogram)\b/i;

/** Lab tests, imaging, screening, exams and physiological measurements. */
const TEST =
  /\btests?\b|testing|assay|\bscan\b|scintigraphy|screening|\bexam\b|examination|ultrasound|sonography|mammogram|tomosynthesis|tomography|\bmri\b|magnetic resonance|x-ray|cytology|smear|monitor|measurement|reading|profile|urinalysis|\bindex\b|spirometry|densitometry|absorptiometry|echocardiogram|electrocardiogram|electromyography|\becg\b|\bemg\b|\bcbc\b|blood count|temperature|assessment|enema|\bfactor\b|\bpet\b|\bspect\b|\bct\b|\bcat\b|\bdexa\b|holter|colonoscopy|angiogram/i;

/** "test", "diagnostic-procedure" or "treatment". */
function classify(title) {
  if (TREATMENT.test(title)) return "treatment";
  if (DIAGNOSTIC_PROCEDURE.test(title)) return "diagnostic-procedure";
  if (TEST.test(title)) return "test";
  return "treatment";
}

const isPublished = (title) => {
  const kind = classify(title);
  return kind === "test" || (kind === "diagnostic-procedure" && KEEP_DIAGNOSTIC_PROCEDURES);
};

const slugify = (title) =>
  title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Flatten a Strapi inline node to one run: plain text, or a link with text. */
function toRun(node) {
  if (node.type === "link") {
    const text = (node.children ?? []).map((c) => c.text ?? "").join("").trim();
    return text ? { text, href: node.url } : null;
  }
  const text = node.text ?? "";
  return text.trim() ? { text } : null;
}

/**
 * Split one block into its Urdu and English halves. Text runs go by their own
 * script; a link (always a bare URL here) goes with whichever language the
 * block is written in, since on Shifa's page the "read more" link renders in
 * the Urdu column.
 */
function splitBlock(block) {
  if (block.type !== "heading" && block.type !== "paragraph") {
    throw new Error(`Unexpected block type "${block.type}" — update the normaliser before publishing.`);
  }
  const urdu = [];
  const english = [];
  const blockIsUrdu = (block.children ?? []).some((c) => c.type !== "link" && URDU.test(c.text ?? ""));
  for (const child of block.children ?? []) {
    const run = toRun(child);
    if (!run) continue;
    const isUrdu = run.href ? blockIsUrdu : URDU.test(run.text);
    (isUrdu ? urdu : english).push(run);
  }
  const wrap = (runs) => (runs.length ? { type: block.type, runs } : null);
  return { urdu: wrap(urdu), english: wrap(english) };
}

function normalise(entry) {
  const urdu = [];
  const english = [];
  for (const block of entry.content ?? []) {
    const halves = splitBlock(block);
    if (halves.urdu) urdu.push(halves.urdu);
    if (halves.english) english.push(halves.english);
  }
  return { id: entry.id, slug: slugify(entry.title), title: entry.title.trim(), urdu, english };
}

const response = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
if (!response.ok) throw new Error(`${ENDPOINT} responded ${response.status}`);
const payload = await response.json();
const raw = Array.isArray(payload) ? payload : payload.data;
if (!Array.isArray(raw) || raw.length === 0) throw new Error("Backend returned no entries; refusing to overwrite the snapshot.");

const all = raw.map(normalise).sort((a, b) => a.title.localeCompare(b.title, "en", { sensitivity: "base" }));
const items = all.filter((item) => isPublished(item.title));
const dropped = all.filter((item) => !isPublished(item.title));

// Slugs double as in-page anchors, so two entries must never share one.
const seen = new Map();
for (const item of items) {
  const count = seen.get(item.slug) ?? 0;
  seen.set(item.slug, count + 1);
  if (count > 0) item.slug = `${item.slug}-${item.id}`;
}

const snapshot = {
  source: SOURCE_PAGE,
  endpoint: ENDPOINT,
  fetchedAt: new Date().toISOString(),
  items,
};

await writeFile(OUT, JSON.stringify(snapshot, null, 2) + "\n", "utf8");

const withoutContent = items.filter((i) => i.urdu.length === 0 && i.english.length === 0).map((i) => i.title);
console.log(`Source has ${all.length} entries; wrote ${items.length} tests to ${path.relative(process.cwd(), OUT)}`);
if (withoutContent.length) console.log(`Entries with no content (shown as title only): ${withoutContent.join(", ")}`);
const invasive = items.filter((i) => classify(i.title) === "diagnostic-procedure");
console.log(`\nKept as invasive diagnostics (${invasive.length}):`);
for (const item of invasive) console.log(`  ${item.title}`);
console.log(`\nDropped as treatments (${dropped.length}):`);
for (const item of dropped) console.log(`  ${item.title}`);
