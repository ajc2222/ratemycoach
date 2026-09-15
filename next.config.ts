import type { NextConfig } from "next";

/**
 * Security headers. CSP is intentionally strict: this site loads no third-party
 * scripts, embeds nothing, and renders no user-supplied HTML.
 *
 * `'unsafe-inline'` is required in `script-src` because Next.js injects inline
 * bootstrap/flight scripts; a nonce-based policy needs per-request middleware
 * rendering that the static pages here deliberately avoid. Everything else is
 * locked to `'self'`, so the practical XSS surface is the app's own code — and
 * no user-supplied text is ever rendered on a public page.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  // TypeScript 5.9 provides the compiler API. Avoid the experimental CLI
  // subprocess path, which can lose captured stdout in restricted runtimes.
  experimental: { useTypeScriptCli: false },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Never let a crawler or a cache hold on to operator data.
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
