import { Sidebar } from "@/components/shared/sidebar";

const dashboardNav = [
  { label: "Dashboard", href: "/dashboard", icon: "⌂" },
  { label: "Catalogo", href: "/dashboard/catalogo", icon: "☰" },
  { label: "Relatorios", href: "/dashboard/relatorios", icon: "☷" },
  { label: "Kits", href: "/dashboard/kits", icon: "◈" },
  { label: "Analise", href: "/dashboard/analise", icon: "◎" },
  { label: "Marca", href: "/dashboard/marca", icon: "★" },
  { label: "Canais", href: "/dashboard/canais", icon: "☎" },
  { label: "Usuarios", href: "/dashboard/usuarios", icon: "☺" },
  { label: "Faturamento", href: "/dashboard/faturamento", icon: "∴" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-blanc-casse">
      <Sidebar items={dashboardNav} title="Skinner" subtitle="Portal B2B" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
