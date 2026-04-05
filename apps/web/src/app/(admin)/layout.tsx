import { Sidebar } from "@/components/shared/sidebar";

const adminNav = [
  { label: "Dashboard", href: "/admin", icon: "\u2302" },
  { label: "Tenants", href: "/admin/tenants", icon: "\u2630" },
  { label: "Dermatologia", href: "/admin/dermatologia", icon: "\u2695" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar items={adminNav} title="Skinner" subtitle="Admin" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
