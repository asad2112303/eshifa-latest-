/**
 * Security headers are defined here rather than only in vercel.json so they
 * apply on any host (self-hosted Node, Docker, another platform), not just
 * Vercel. vercel.json keeps the CDN cache rules, which are platform-specific.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "geolocation=(), microphone=(), camera=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // 'unsafe-inline' on script-src is required by Next's hydration bootstrap.
    // Tightening this further needs nonce-based CSP via middleware.
    //
    // 'unsafe-eval' is added in development only: React's dev build uses eval()
    // for debugging features, and blocking it breaks error overlays and stack
    // reconstruction. Production never needs it and never gets it.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      // ws: in development only — Next's hot-reload socket. Production is 'self'.
      `connect-src 'self'${process.env.NODE_ENV === "development" ? " ws: wss:" : ""}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework/version to attackers.
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
