"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Opens the entry named in the URL hash.
 *
 * The index view links each title to its letter view with the entry's slug as
 * the hash. The browser scrolls to the row on its own; this opens it too, so
 * the reader lands on the explanation rather than on a closed row they then
 * have to find and tap. Re-runs on every navigation, since the list is
 * re-rendered in place rather than remounted.
 */
export function OpenEntryFromHash() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const open = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (!slug) return;
      const target = document.getElementById(slug);
      if (target instanceof HTMLDetailsElement) target.open = true;
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [pathname, searchParams]);

  return null;
}
