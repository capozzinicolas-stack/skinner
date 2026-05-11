"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shared/sidebar";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: "⌂" },
  { label: "Tenants", href: "/admin/tenants", icon: "☰" },
  { label: "Planos", href: "/admin/planos", icon: "∴" },
  { label: "Usuarios", href: "/admin/usuarios", icon: "◻" },
  { label: "Leads", href: "/admin/leads", icon: "◈" },
  { label: "Analytics", href: "/admin/analytics", icon: "▦" },
  { label: "Dermatologia", href: "/admin/dermatologia", icon: "⚕" },
  { label: "Formulario", href: "/admin/formulario", icon: "✏" },
  { label: "Prompt IA", href: "/admin/prompt", icon: "✎" },
];

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-blanc-casse">
      <Sidebar
        items={adminNav}
        title="Skinner"
        subtitle="Admin"
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
