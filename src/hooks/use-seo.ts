import { useEffect } from "react";

const SITE_ORIGIN = "https://eshifa.org";

export interface SeoConfig {
  title: string;
  description: string;
  /** Route path, e.g. "/services/home-nursing". Used for canonical and og:url. */
  path: string;
  ogTitle?: string;
  ogDescription?: string;
}

/** Finds a meta/link tag by selector, creating it if the document lacks one. */
function upsert(selector: string, create: () => HTMLElement): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  const el = upsert(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute(attr, key);
    return m;
  });
  el.setAttribute("content", value);
}

/**
 * Applies per-route document metadata.
 *
 * This is a client-rendered SPA, so index.html ships one static set of tags for
 * the home page and each route overwrites them on mount. Crawlers that execute
 * JavaScript will read the updated values; for guaranteed crawl coverage without
 * JS execution the site would need prerendering or SSR.
 */
export function useSeo({ title, description, path, ogTitle, ogDescription }: SeoConfig) {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path}`;

    document.title = title;
    setMeta("name", "description", description);

    setMeta("property", "og:title", ogTitle ?? title);
    setMeta("property", "og:description", ogDescription ?? description);
    setMeta("property", "og:url", url);

    setMeta("name", "twitter:title", ogTitle ?? title);
    setMeta("name", "twitter:description", ogDescription ?? description);

    const canonical = upsert('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    });
    canonical.setAttribute("href", url);
  }, [title, description, path, ogTitle, ogDescription]);
}
