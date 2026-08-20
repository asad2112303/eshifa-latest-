/**
 * Single source of truth for site-wide constants.
 *
 * The origin is environment-configurable so preview/staging deployments emit
 * their own canonical URLs instead of pointing at production. Set
 * NEXT_PUBLIC_SITE_URL in the deployment environment; the production domain is
 * used as the fallback so a missing variable degrades safely rather than
 * producing relative or `undefined` canonicals.
 */

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  // On production, prefer Vercel's stable project domain over the per-deployment
  // one. VERCEL_URL is unique to each build (eshifa-latest-g67t0m….vercel.app),
  // so using it here would emit a canonical URL that dies on the next deploy —
  // and search engines would index an address that no longer resolves.
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
    const production = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    if (production) return `https://${production}`;
  }

  // Preview deployments should point at themselves, so staging never claims to
  // be production. Here the per-deployment URL is exactly right.
  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "https://eshifa.org";
}

export const siteConfig = {
  name: "eShifa",
  legalName: "SIHT (Private) Limited",
  url: resolveSiteUrl(),
  slogan: "Quality Healthcare at Your Doorstep",
  description:
    "Pakistan's first JCI-accredited home healthcare: laboratory, nursing, rehabilitation, pharmacy, teleconsultation and vaccination at home. 24/7 nationwide.",
  contact: {
    uanDisplay: "051-111-111-567",
    uanTel: "tel:051111111567",
    uanE164: "+92-51-111-111-567",
    email: "info@eshifa.org",
    address: {
      street: "Plot No. 17-18, 2nd Floor, EOBI Building, I-8 Markaz",
      locality: "Islamabad",
      region: "Islamabad Capital Territory",
      postalCode: "44000",
      country: "PK",
    },
  },
  social: {
    facebook: "https://facebook.com/eshifa.official",
  },
  apps: {
    apple: "https://apps.apple.com/pk/app/eshifa/id1525359185",
    play: "https://play.google.com/store/search?q=eShifa&c=apps",
  },
} as const;

/** Absolute URL for a site-relative path, used for canonicals and structured data. */
export const absoluteUrl = (path: string) => `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
