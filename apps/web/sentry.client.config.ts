import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // Capture 100% of errors. Performance traces are throttled to 10% to keep
    // us under the free tier's 10K transactions/mo (Skinner's traffic is far
    // below that today, but headroom is cheap).
    tracesSampleRate: 0.1,
    // Don't ship Sentry in dev — local errors are noisy.
    enabled: process.env.NODE_ENV === "production",
    // Filter low-signal errors from third-party scripts (browser extensions,
    // ad-blockers, ResizeObserver loops). Keeps the issue feed actionable.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
    ],
  });
}
