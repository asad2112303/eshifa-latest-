/**
 * Serialises structured data for an inline <script type="application/ld+json">.
 *
 * JSON.stringify alone is not safe inside a script element: a string value
 * containing "</script>" ends the element early and whatever follows is parsed
 * as HTML. Escaping the HTML-significant characters as JSON unicode escapes
 * keeps the output valid JSON and inert as markup. The values here are static
 * today; this guards the day one of them is not.
 */
const ESCAPES: ReadonlyArray<readonly [string, string]> = [
  ["<", "\\u003c"],
  [">", "\\u003e"],
  ["&", "\\u0026"],
  [" ", "\\u2028"],
  [" ", "\\u2029"],
];

export function safeJsonLd(data: unknown): string {
  let json = JSON.stringify(data);
  for (const [raw, escaped] of ESCAPES) json = json.replaceAll(raw, escaped);
  return json;
}
