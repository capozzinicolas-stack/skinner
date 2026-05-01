/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@skinner/ui", "@skinner/db"],
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
