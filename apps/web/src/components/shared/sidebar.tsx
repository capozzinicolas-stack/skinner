"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

/**
 * Responsive sidebar. Desktop (md+): always visible, sticky left. Mobile
 * (<md): hidden by default, slides in from the left as a drawer overlay
 * when `isOpen=true`. State lives in the parent chrome — this component
 * is dumb about how it's opened/closed.
 *
 * UX patterns (standard mobile):
 *   - Backdrop covers the rest of the screen, click → onClose
 *   - Close X button in the top-right of the drawer
 *   - Clicking a nav link auto-closes the drawer (better than leaving it
 *     open obscuring the navigated page)
 *   - Body scroll locked while drawer is open so the page underneath
 *     doesn't drift
 */
export function Sidebar({
  items,
  title,
  subtitle,
  logoutLabel,
  isOpen = false,
  onClose,
}: {
  items: NavItem[];
  title: string;
  subtitle?: string;
  // Optional translation override. Admin sidebar (always pt-BR) keeps
  // the default; dashboard sidebar passes a localized string.
  logoutLabel?: string;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  // Lock body scroll when mobile drawer is open. Restore on close/unmount.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  function handleNavClick() {
    // Close drawer on link click for mobile — desktop unaffected because
    // the close button is hidden and the drawer state is always "open"
    // (controlled by md: classes, not isOpen).
    onClose?.();
  }

  return (
    <>
      {/* Mobile-only backdrop. Desktop hides it via md:hidden so the
          sidebar's md:relative positioning above isn't covered. */}
      {isOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={onClose}
          className="fixed inset-0 bg-carbone/40 z-40 md:hidden"
        />
      )}

      <aside
        className={`
          w-64 bg-white border-r border-sable/20 flex flex-col h-screen
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-200
          md:sticky md:top-0 md:translate-x-0 md:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Close button — mobile only. Sticks at top-right of the drawer. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="md:hidden absolute top-3 right-3 w-9 h-9 flex items-center justify-center text-pierre hover:text-carbone text-xl"
        >
          ×
        </button>

        <div className="p-6 border-b border-sable/20">
          <img src="/brand/logo-primary.png" alt="Skinner" className="h-24 md:h-36 object-contain mb-1" />
          {subtitle && (
            <p className="text-[10px] text-pierre tracking-skinners uppercase font-light mt-2">
              {subtitle}
            </p>
          )}
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                // min-h-[44px] = Apple HIG touch target. Bigger on mobile
                // so fingers hit consistently.
                className={`flex items-center gap-3 px-3 py-3 md:py-2.5 min-h-[44px] md:min-h-0 text-sm font-light transition-colors ${
                  isActive
                    ? "bg-ivoire text-carbone"
                    : "text-pierre hover:bg-blanc-casse hover:text-carbone"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sable/20">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 px-3 py-3 md:py-2.5 min-h-[44px] md:min-h-0 text-sm font-light text-pierre hover:text-carbone w-full transition-colors"
          >
            <span className="text-base">&#x2190;</span>
            {logoutLabel ?? "Sair"}
          </button>
        </div>
      </aside>
    </>
  );
}
