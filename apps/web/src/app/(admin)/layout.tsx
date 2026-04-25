import { Sidebar } from "@/components/shared/sidebar";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: "⌂" },
  { label: "Tenants", href: "/admin/tenants", icon: "☰" },
  { label: "Usuarios", href: "/admin/usuarios", icon: "◻" },
  { label: "Leads", href: "/admin/leads", icon: "◈" },
  { label: "Analytics", href: "/admin/analytics", icon: "▦" },
  { label: "Dermatologia", href: "/admin/dermatologia", icon: "⚕" },
  { label: "Formulario", href: "/admin/formulario", icon: "✏" },
  { label: "Prompt IA", href: "/admin/prompt", icon: "✎" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-blanc-casse">
      <Sidebar items={adminNav} title="Skinner" subtitle="Admin" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
