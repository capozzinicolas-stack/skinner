"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { useI18n } from "@/lib/i18n/client";

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminNav = [
    { label: t.dashboardPages.admin_nav_dashboard, href: "/admin", icon: "⌂" },
    { label: t.dashboardPages.admin_nav_tenants, href: "/admin/tenants", icon: "☰" },
    { label: t.dashboardPages.admin_nav_plans, href: "/admin/planos", icon: "∴" },
    { label: t.dashboardPages.admin_nav_users, href: "/admin/usuarios", icon: "◻" },
    { label: t.dashboardPages.admin_nav_leads, href: "/admin/leads", icon: "◈" },
    { label: t.dashboardPages.admin_nav_analytics, href: "/admin/analytics", icon: "▦" },
    { label: t.dashboardPages.admin_nav_dermatology, href: "/admin/dermatologia", icon: "⚕" },
    { label: t.dashboardPages.admin_nav_form, href: "/admin/formulario", icon: "✏" },
    { label: t.dashboardPages.admin_nav_prompt_ai, href: "/admin/prompt", icon: "✎" },
  ];

  return (
    <div className="flex min-h-screen bg-blanc-casse">
      <Sidebar
        items={adminNav}
        title="Skinner"
        subtitle={t.dashboardPages.admin_portal_subtitle}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-sable/20 px-4 h-14">
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
        {children}
      </main>
    </div>
  );
}
