"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { LETTERS } from "@/data/medical-tests";

/**
 * Search box and A–Z letter buttons for the patient guide.
 *
 * Both controls write to the URL rather than to local state, so the server
 * renders the filtered list and a filtered view can be shared or bookmarked.
 * The two are exclusive, as on Shifa's page: choosing a letter clears the
 * search, and typing clears the letter.
 *
 * Typing is debounced before the URL changes; the server render is quick, but
 * one navigation per keystroke would still queue up on a slow connection.
 */

const BASE_PATH = "/patient-guide";
const DEBOUNCE_MS = 250;

const hrefForQuery = (query: string) => {
  const trimmed = query.trim();
  return trimmed ? `${BASE_PATH}?q=${encodeURIComponent(trimmed)}` : BASE_PATH;
};

export function PatientGuideToolbar({ letter, query }: { letter: string | null; query: string }) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A letter click drops the search from the URL; the box must follow it.
  useEffect(() => {
    setText(query);
  }, [query]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const navigateTo = (href: string) => {
    startTransition(() => router.replace(href, { scroll: false }));
  };

  const onChange = (next: string) => {
    setText(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => navigateTo(hrefForQuery(next)), DEBOUNCE_MS);
  };

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    setText("");
    navigateTo(BASE_PATH);
  };

  return (
    <div className="rounded-3xl border border-[#E6E9EF] bg-[#F5F7FA] p-5 sm:p-8">
      <form
        action={BASE_PATH}
        method="get"
        role="search"
        className="mx-auto max-w-xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (timer.current) clearTimeout(timer.current);
          navigateTo(hrefForQuery(text));
        }}
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#999999]"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            value={text}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search tests"
            aria-label="Search tests by name"
            autoComplete="off"
            className="h-14 w-full rounded-full border border-[#E1E5EC] bg-white pl-12 pr-12 text-[#1B004E] shadow-sm outline-none transition-colors placeholder:text-[#9AA1AC] focus:border-[#0289E8]"
          />
          {isPending ? (
            <Loader2
              className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-[#0289E8]"
              aria-label="Updating results"
            />
          ) : (
            text && (
              <button
                type="button"
                onClick={clear}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] transition-colors hover:text-[#1B004E]"
              >
                <X className="h-5 w-5" />
              </button>
            )
          )}
        </div>
      </form>

      <p className="mt-7 text-center text-base font-medium text-[#444444]">
        Find tests by first letter
      </p>
      <nav aria-label="Filter by first letter" className="mt-4">
        <ul className="flex flex-wrap justify-center gap-2.5 sm:gap-3.5">
          {LETTERS.map((item) => {
            const active = letter === item;
            return (
              <li key={item}>
                <Link
                  href={active ? BASE_PATH : `${BASE_PATH}?letter=${item}`}
                  scroll={false}
                  aria-pressed={active}
                  title={active ? "Show all letters" : `Show entries starting with ${item}`}
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-lg text-base font-medium transition-colors sm:h-14 sm:w-14 sm:text-xl",
                    active
                      ? "bg-[#0289E8] text-white shadow-md"
                      : "bg-white text-[#1B004E] shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:bg-[#0289E8] hover:text-white",
                  ].join(" ")}
                >
                  {item}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
