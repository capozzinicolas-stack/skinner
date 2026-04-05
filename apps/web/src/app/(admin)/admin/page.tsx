"use client";

import { trpc } from "@/lib/trpc/client";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-6 bg-white border border-sable/20">
      <p className="text-xs text-pierre uppercase tracking-wider font-light">{label}</p>
      <p className="text-3xl font-serif text-carbone mt-2">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const stats = trpc.tenant.stats.useQuery();

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl text-carbone">Dashboard</h1>
      <p className="text-pierre text-sm font-light mt-1">
        Visao geral da plataforma Skinner.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <StatCard label="Tenants ativos" value={stats.data?.activeTenants ?? "—"} />
        <StatCard label="Total tenants" value={stats.data?.totalTenants ?? "—"} />
        <StatCard label="Analises realizadas" value={stats.data?.totalAnalyses ?? "—"} />
        <StatCard label="Usuarios B2B" value={stats.data?.totalUsers ?? "—"} />
      </div>
    </div>
  );
}
