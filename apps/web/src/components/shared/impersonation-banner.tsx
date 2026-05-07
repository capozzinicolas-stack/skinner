"use client";

import { useSession, signOut } from "next-auth/react";

/**
 * Persistent banner shown at the top of the dashboard while a skinner_admin
 * is impersonating a tenant user. Renders nothing on a normal session.
 *
 * The exit flow signs the user out (clears the cookie scoped to
 * app.skinner.lat) and bounces them to admin.skinner.lat/admin where their
 * original admin session is still intact (different subdomain → different
 * cookie). For local dev (no subdomain), falls back to /admin on the same
 * origin.
 *
 * Critical UX: the banner MUST always be visible. Without it, admins
 * forget they're impersonating and accidentally make changes / send emails
 * from the wrong identity. We use a high-contrast color on top of any page
 * content + sticky positioning.
 */
export function ImpersonationBanner() {
  const { data: session } = useSession();
  const user = session?.user as
    | {
        impersonatedBy?: string;
        impersonatedByEmail?: string;
        name?: string;
        email?: string;
      }
    | undefined;

  if (!user?.impersonatedBy) return null;

  function handleExit() {
    // In prod we want to bounce to admin.skinner.lat. In dev we don't have
    // subdomains, so just go to /admin on the current origin.
    const isProd =
      typeof window !== "undefined" &&
      window.location.hostname.endsWith("skinner.lat");
    const callbackUrl = isProd ? "https://admin.skinner.lat/admin" : "/admin";
    signOut({ callbackUrl });
  }

  return (
    <div className="sticky top-0 z-[100] bg-terre text-blanc-casse border-b border-carbone/20 px-4 py-2 flex items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono uppercase tracking-wider text-[10px] bg-carbone/20 px-2 py-0.5">
          Suporte
        </span>
        <span className="font-light truncate">
          Voce esta acessando como{" "}
          <strong className="font-normal">{user.name ?? user.email}</strong>
          {user.impersonatedByEmail && (
            <>
              {" "}
              <span className="opacity-70">
                (admin: {user.impersonatedByEmail})
              </span>
            </>
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={handleExit}
        className="flex-shrink-0 px-3 py-1 border border-blanc-casse/40 hover:bg-blanc-casse/10 transition-colors uppercase tracking-wider text-[10px]"
      >
        Sair da impersonacao
      </button>
    </div>
  );
}
