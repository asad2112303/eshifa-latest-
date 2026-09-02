"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Search, X } from "lucide-react";
import {
  PROVINCES,
  centreCountByProvince,
  labCentres,
  type LabCentre,
} from "@/data/lab-centres";

/**
 * Searchable directory of eShifa Labs collection centres.
 *
 * 76 centres across 51 cities, so the filters carry real weight: a plain list
 * would be unusable and a chip per city would be 51 chips. Grouping by province
 * keeps the choices to six, and free-text search covers the rest.
 *
 * Filtering is client-side because the whole dataset is a few kilobytes and
 * ships with the page — a round trip per keystroke would be slower and would
 * break the page for anyone offline.
 */

const PAGE_SIZE = 12;

/** Normalise for accent- and case-insensitive matching. */
const norm = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export default function LabCentreFinder() {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState<string>("All");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const counts = useMemo(centreCountByProvince, []);

  // Precompute one searchable string per centre so typing does not re-normalise
  // every field of every row on each keystroke.
  const indexed = useMemo(
    () =>
      labCentres.map((centre) => ({
        centre,
        haystack: norm(
          [centre.city, centre.area, centre.address, centre.province, centre.email].join(" "),
        ),
      })),
    [],
  );

  const results = useMemo(() => {
    const needle = norm(query);
    return indexed
      .filter(({ centre, haystack }) => {
        if (province !== "All" && centre.province !== province) return false;
        if (!needle) return true;
        // Every word must appear, so "islamabad e18" narrows rather than widens.
        return needle.split(" ").every((word) => haystack.includes(word));
      })
      .map(({ centre }) => centre);
  }, [indexed, query, province]);

  const shown = results.slice(0, visible);
  const hasFilters = query.trim() !== "" || province !== "All";

  const reset = () => {
    setQuery("");
    setProvince("All");
    setVisible(PAGE_SIZE);
  };

  const chipClass = (active: boolean) =>
    [
      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
      active
        ? "border-[#0289E8] bg-[#0289E8] text-white"
        : "border-[#E1E5EC] bg-white text-[#444444] hover:border-[#0289E8] hover:text-[#0289E8]",
    ].join(" ");

  return (
    <section className="bg-[#F5F7FA] py-20" id="lab-centres">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0289E8]">
            Collection Centres
          </p>
          <h2 className="mt-3 text-3xl font-light text-[#1B004E] sm:text-4xl">
            Find a Lab Center Near You
          </h2>
          <p className="mt-4 text-lg text-[#777777]">
            {labCentres.length} eShifa Labs collection centres across Pakistan. Walk in for sample
            collection, or book a home visit instead.
          </p>
        </header>

        {/* Search */}
        <div className="mx-auto mt-10 max-w-xl">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#999999]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(PAGE_SIZE);
              }}
              placeholder="Search by city, sector or address"
              aria-label="Search lab collection centres"
              className="h-14 w-full rounded-full border border-[#E1E5EC] bg-white pl-12 pr-12 text-[#1B004E] shadow-sm outline-none transition-colors placeholder:text-[#9AA1AC] focus:border-[#0289E8]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] transition-colors hover:text-[#1B004E]"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Province filter */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button type="button" onClick={() => setProvince("All")} className={chipClass(province === "All")}>
            All <span className="opacity-70">({labCentres.length})</span>
          </button>
          {PROVINCES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setProvince(name);
                setVisible(PAGE_SIZE);
              }}
              className={chipClass(province === name)}
            >
              {name} <span className="opacity-70">({counts[name] ?? 0})</span>
            </button>
          ))}
        </div>

        {/* Result count */}
        <p className="mt-8 text-center text-sm text-[#777777]" role="status" aria-live="polite">
          {results.length === 0
            ? "No centres match your search."
            : `Showing ${shown.length} of ${results.length} centre${results.length === 1 ? "" : "s"}`}
          {hasFilters && (
            <button
              type="button"
              onClick={reset}
              className="ml-2 font-semibold text-[#0289E8] hover:underline"
            >
              Clear filters
            </button>
          )}
        </p>

        {results.length === 0 ? (
          <div className="mx-auto mt-8 max-w-md rounded-3xl border border-[#E1E5EC] bg-white p-10 text-center">
            <MapPin className="mx-auto h-10 w-10 text-[#CBD2DC]" aria-hidden="true" />
            <p className="mt-4 text-[#444444]">
              We could not find a centre matching that. Try a city name, or call{" "}
              <a href="tel:051111111567" className="font-semibold text-[#0289E8] hover:underline">
                051-111-111-567
              </a>{" "}
              and we will find your nearest one.
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {shown.map((centre) => (
                  <motion.li
                    key={centre.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <CentreCard centre={centre} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>

            {visible < results.length && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="rounded-full border border-[#0289E8] px-8 py-3 font-semibold text-[#0289E8] transition-colors hover:bg-[#0289E8]/5"
                >
                  Show {Math.min(PAGE_SIZE, results.length - visible)} more
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function CentreCard({ centre }: { centre: LabCentre }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-[#E6E9EF] bg-white p-6 shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0289E8]/10 text-[#0289E8]">
          <MapPin className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight text-[#1B004E]">
            {centre.city}
            {centre.area && <span className="text-[#0289E8]"> · {centre.area}</span>}
          </h3>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-[#9AA1AC]">{centre.province}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-[#555555]">{centre.address}</p>

      {/* mt-auto pins the phone row to the bottom edge, so cards whose
          addresses differ in length still line up across the row. */}
      {centre.phones.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-4">
          <Phone className="h-4 w-4 shrink-0 text-[#777777]" aria-hidden="true" />
          {centre.phones.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
              className="text-sm font-medium text-[#1B004E] transition-colors hover:text-[#0289E8]"
            >
              {phone}
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
