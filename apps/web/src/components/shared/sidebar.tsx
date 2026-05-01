"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

export function Sidebar({
  items,
  title,
  subtitle,
}: {
  items: NavItem[];
  title: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-sable/20 flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-sable/20">
        <img src="/brand/logo-primary.png" alt="Skinner" className="h-36 object-contain mb-1" />
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
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-light transition-colors ${
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
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-light text-pierre hover:text-carbone w-full transition-colors"
        >
          <span className="text-base">&#x2190;</span>
          Sair
        </button>
      </div>
    </aside>
  );
}
