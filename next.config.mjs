/**
 * Security headers live here, and only here, so they apply on any host
 * (Vercel, self-hosted Node, Docker). vercel.json keeps the CDN cache rules,
 * which are platform-specific. Keeping a single source matters for the CSP in
 * particular: two differing policies are intersected by the browser, so a
 * stale copy would silently block whatever the newer one allows.
 */
const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy.
 *
 * script-src keeps 'unsafe-inline' on purpose. Next.js hydrates the page with
 * inline bootstrap scripts whose contents differ per page and per build, so
 * they cannot be hash-listed, and the alternative, a per-request nonce, forces
 * every page to render on demand and lose static generation and CDN caching.
 * The site renders no user-supplied content and reflects no query parameters
 * into markup, so the residual exposure is small; see docs/SECURITY.md.
 *
 * 'unsafe-eval' and the websocket sources are development-only: React's dev
 * build uses eval() for its error overlay and Next hot-reloads over ws:.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy equivalent of frame-ancestors for browsers that predate CSP 2.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Isolates the browsing context: a page this site opens cannot reach back
  // through window.opener, and nothing can embed or read our resources cross-origin.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value: [
      "accelerometer=()",
      "autoplay=()",
      "bluetooth=()",
      "browsing-topics=()",
      "camera=()",
      "display-capture=()",
      "geolocation=()",
      "gyroscope=()",
      "interest-cohort=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "serial=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),
  },
];

/** API responses carry personal data in flight and must never be cached by anything. */
const apiHeaders = [{ key: "Cache-Control", value: "no-store" }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework/version to attackers.
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // No remote patterns: the optimiser only ever serves files from /public,
    // so it cannot be pointed at an internal or third-party address.
    remotePatterns: [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: apiHeaders },
    ];
  },
};

export default nextConfig;
