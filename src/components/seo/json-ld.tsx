import { safeJsonLd } from "@/lib/safe-json-ld";

/**
 * The one place structured data is written into the page.
 *
 * A JSON-LD block is inert: browsers never execute type="application/ld+json",
 * so the only way it could do harm is by closing the script element early with
 * "</script>" inside a string. safeJsonLd() escapes every HTML-significant
 * character as a JSON unicode escape, so the output cannot contain "<", ">" or
 * "&" at all. Keeping the sink here means it is audited once, not per page.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    // nosemgrep: typescript.react.security.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />
  );
}
