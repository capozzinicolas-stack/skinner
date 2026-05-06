"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Shared tab bar that appears at the top of every page that conceptually
// belongs to the "Organização" section. Pages stay at their original URLs
// (so external links — Stripe checkout success_url, OAuth callbacks,
// usage-alert email upgrade links — keep working unchanged).
//
// The sidebar collapsed these 5 entries (Marca, Canais, Integrações,
// Usuários, Faturamento) plus the new "Geral" page into one top-level
// "Organização" entry. This tab bar is what makes that grouping
// navigable inside the section.

const TABS: Array<{ label: string; href: string }> = [
  { label: "Geral", href: "/dashboard/organizacao" },
  { label: "Marca", href: "/dashboard/marca" },
  { label: "Canais", href: "/dashboard/canais" },
  { label: "Integrações", href: "/dashboard/integracao" },
  { label: "Usuários", href: "/dashboard/usuarios" },
  { label: "Faturamento", href: "/dashboard/faturamento" },
];

export function OrganizationTabs() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-sable/30 bg-blanc-casse">
      <div className="px-8 flex flex-wrap gap-1">
        {TABS.map((tab) => {
          // Exact match for /dashboard/organizacao (else "Geral" would also
          // light up on every other tab since pathname starts with that
          // prefix once we move into nested routes — defensive for the
          // future). Other tabs use exact match too because each href is
          // a unique top-level path today.
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3 text-[12px] tracking-wide transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-carbone text-carbone font-normal"
                  : "border-transparent text-pierre hover:text-carbone font-light"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
