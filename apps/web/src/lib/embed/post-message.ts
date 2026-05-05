/**
 * postMessage helper for the embed widget. Each milestone of the analysis
 * flow inside an iframe emits a typed message to the parent window so the
 * tenant's host site can listen for events (analytics, conversion pixels,
 * custom UX). All messages share `source: "skinner"` so the host can filter.
 *
 * IMPORTANT: never include PII in the data payload. Sites embedding the
 * widget MUST NOT see the patient's photo, contact details, or questionnaire
 * answers — only milestone identifiers (analysisId after success). Same
 * privacy posture as Calendly / Typeform embeds.
 */

export type EmbedEventType =
  | "skinner:ready"
  | "skinner:started"
  | "skinner:contact_captured"
  | "skinner:photo_captured"
  | "skinner:analysis_completed"
  | "skinner:cart_added"
  | "skinner:checkout_clicked"
  | "skinner:height_changed";

export type EmbedEventPayload = {
  source: "skinner";
  type: EmbedEventType;
  data?: Record<string, string | number | boolean | null>;
};

/**
 * Emit an event to the parent window (the site embedding the iframe). No-op
 * when running on the server or when not inside an iframe — safe to call from
 * any client component.
 */
export function postToParent(
  type: EmbedEventType,
  data?: EmbedEventPayload["data"]
): void {
  if (typeof window === "undefined") return;
  if (window.parent === window) return; // not in an iframe
  try {
    window.parent.postMessage(
      { source: "skinner", type, data: data ?? {} },
      "*"
    );
  } catch {
    // Some sandboxed iframes block postMessage — degrade silently.
  }
}

/**
 * Returns true when the current document is rendered inside an iframe.
 * Used by the embed page to decide whether to attach the height observer
 * and emit ready event.
 */
export function isInsideIframe(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.parent !== window;
  } catch {
    // Cross-origin parent throws on `window.parent` access in some browsers
    // — that itself is proof we are inside an iframe.
    return true;
  }
}
