import { Sidebar } from "@/components/shared/sidebar";

const dashboardNav = [
  { label: "Dashboard", href: "/dashboard", icon: "\u2302" },
  { label: "Catalogo", href: "/dashboard/catalogo", icon: "\u2630" },
  { label: "Relatorios", href: "/dashboard/relatorios", icon: "\u2637" },
  { label: "Marca", href: "/dashboard/marca", icon: "\u2605" },
  { label: "Canais", href: "/dashboard/canais", icon: "\u260E" },
  { label: "Usuarios", href: "/dashboard/usuarios", icon: "\u263A" },
  { label: "Faturamento", href: "/dashboard/faturamento", icon: "\u2234" },
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
