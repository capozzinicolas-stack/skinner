/**
 * Embed layout — minimal wrapper for the iframe-embeddable analysis widget.
 *
 * The root app/layout.tsx already provides <html><body>, fonts, and global
 * Providers (SessionProvider + tRPC). This layout simply renders children
 * with no extra chrome — no header, no marketing nav, no dashboard sidebar.
 *
 * Headers (CSP frame-ancestors *, Permissions-Policy camera) are configured
 * in next.config.js so any external site can iframe this route.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Search-engine-discovered embed pages would dilute the brand; keep them out
// of indexes so the canonical /analise/[slug] flow remains the primary surface.
export const metadata = {
  robots: { index: false, follow: false },
};
