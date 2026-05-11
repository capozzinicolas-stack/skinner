"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { useI18n } from "@/lib/i18n/client";
import { ImpersonationBanner } from "@/components/shared/impersonation-banner";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Sidebar consolidates 5 org-level pages (Marca, Canais, Integracoes,
  // Usuarios, Faturamento) under one "Organização" entry. Each of those
  // pages renders <OrganizationTabs /> at the top so users can move between
  // them. URLs unchanged (Stripe success_url, OAuth callbacks, email links
  // all point to the original paths). See components/shared/organization-tabs.tsx.
  //
  // Onboarding entry temporarily removed (2026-05-06) — page content is
  // outdated. URL /dashboard/onboarding stays accessible (page file untouched)
  // so we can re-enable the sidebar item by adding the line back when the
  // content is refreshed.
  const dashboardNav = [
    { label: t.dashboard.nav_dashboard, href: "/dashboard", icon: "⌂" },
    { label: t.dashboard.nav_catalog, href: "/dashboard/catalogo", icon: "☰" },
    { label: t.dashboard.nav_reports, href: "/dashboard/relatorios", icon: "☷" },
    { label: t.dashboard.nav_leads, href: "/dashboard/leads", icon: "✉" },
    { label: t.dashboard.nav_kits, href: "/dashboard/kits", icon: "◈" },
    { label: t.dashboard.nav_analysis, href: "/dashboard/analise", icon: "◎" },
    { label: t.dashboard.nav_organization, href: "/dashboard/organizacao", icon: "⌬" },
    { label: t.dashboard.nav_account, href: "/dashboard/conta", icon: "✦" },
  ];
  return (
    <div className="flex min-h-screen bg-blanc-casse">
      <Sidebar
        items={dashboardNav}
        title="Skinner"
        subtitle={t.dashboard.portal_subtitle}
        logoutLabel={t.dashboard.nav_logout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Both banner + mobile top bar share a single sticky wrapper.
            Without this, the banner's internal sticky (z-100) overlaps the
            top-bar's sticky (z-30) on mobile during impersonation, hiding
            the hamburger. Wrapping stacks them naturally instead. The
            banner returns null for normal sessions, so the wrapper just
            contains the mobile header for everyone else. */}
        <div className="sticky top-0 z-40">
          <ImpersonationBanner />
          <header className="md:hidden flex items-center justify-between bg-white border-b border-sable/20 px-4 h-14">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
              className="w-11 h-11 flex items-center justify-center text-carbone -ml-2"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <img src="/brand/logo-primary.png" alt="Skinner" className="h-8 object-contain" />
            <span className="w-11" aria-hidden />
          </header>
        </div>
        {children}
      </main>
    </div>
  );
}
