"use client";

import { Sidebar } from "@/components/shared/sidebar";
import { useI18n } from "@/lib/i18n/client";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
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
      />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
