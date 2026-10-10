// Patient-facing message for a failed analysis.run call.
//
// Business errors raised by our own server (quota reached, channel paused,
// identity limit, missing contact, rate limit) carry a Portuguese message and
// a tRPC code — show them as-is. Anything else (infrastructure 504/413 pages
// that surface as "Unable to transform response from server", network
// failures, unexpected 500s) has technical, often English, text: replace it
// with the localized generic message.
const BUSINESS_CODES = new Set(["FORBIDDEN", "BAD_REQUEST", "TOO_MANY_REQUESTS", "NOT_FOUND"]);

export function friendlyAnalysisError(
  err: { message?: string; data?: { code?: string } | null },
  genericMessage: string
): string {
  const code = err.data?.code;
  if (code && BUSINESS_CODES.has(code) && err.message) return err.message;
  return genericMessage;
}
