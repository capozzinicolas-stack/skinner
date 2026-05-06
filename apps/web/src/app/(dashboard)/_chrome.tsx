"use client";

import { Sidebar } from "@/components/shared/sidebar";
import { useI18n } from "@/lib/i18n/client";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const dashboardNav = [
    { label: t.dashboard.nav_onboarding, href: "/dashboard/onboarding", icon: "❋" },
    { label: t.dashboard.nav_dashboard, href: "/dashboard", icon: "⌂" },
    { label: t.dashboard.nav_catalog, href: "/dashboard/catalogo", icon: "☰" },
    { label: t.dashboard.nav_reports, href: "/dashboard/relatorios", icon: "☷" },
    { label: t.dashboard.nav_leads, href: "/dashboard/leads", icon: "✉" },
    { label: t.dashboard.nav_kits, href: "/dashboard/kits", icon: "◈" },
    { label: t.dashboard.nav_analysis, href: "/dashboard/analise", icon: "◎" },
    { label: t.dashboard.nav_brand, href: "/dashboard/marca", icon: "★" },
    { label: t.dashboard.nav_channels, href: "/dashboard/canais", icon: "☎" },
    { label: t.dashboard.nav_integrations, href: "/dashboard/integracao", icon: "◧" },
    { label: t.dashboard.nav_users, href: "/dashboard/usuarios", icon: "☺" },
    { label: t.dashboard.nav_billing, href: "/dashboard/faturamento", icon: "∴" },
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
