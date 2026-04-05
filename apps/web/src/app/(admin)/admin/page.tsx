"use client";

import { trpc } from "@/lib/trpc/client";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-6 bg-white rounded-xl border shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-brand-600 mt-1">{value}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const stats = trpc.tenant.stats.useQuery();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-500 mt-1">Visão geral da plataforma Skinner.</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <StatCard
          label="Tenants ativos"
          value={stats.data?.activeTenants ?? "—"}
        />
        <StatCard
          label="Total tenants"
          value={stats.data?.totalTenants ?? "—"}
        />
        <StatCard
          label="Análises realizadas"
          value={stats.data?.totalAnalyses ?? "—"}
        />
        <StatCard
          label="Usuários B2B"
          value={stats.data?.totalUsers ?? "—"}
        />
      </div>
    </div>
  );
}
