/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@skinner/ui", "@skinner/db"],
  // Headers tuned per route group:
  //   - /embed/*      → must be embeddable in any third-party site (CSP
  //                     frame-ancestors *) and must allow camera/mic
  //                     delegation so navigator.mediaDevices works inside
  //                     the iframe across browsers (Safari is strictest).
  //   - /embed-helper.js → CORS open + long cache so host sites can
  //                        confidently <script src> it without rebuild.
  // All other routes inherit Next.js defaults (X-Frame-Options DENY).
  async headers() {
    return [
      {
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Permissions-Policy", value: "camera=*, microphone=*" },
        ],
      },
      {
        source: "/embed-helper.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=86400" },
        ],
      },
    ];
  },
};

const { withSentryConfig } = require("@sentry/nextjs");

// Sentry build plugin uploads source maps so prod stack traces are readable.
// Activates only when SENTRY_AUTH_TOKEN is present (set in Vercel env vars).
// Without it, the wrapper is a no-op so dev / fork builds keep working.
module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
