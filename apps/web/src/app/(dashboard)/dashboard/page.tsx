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

export default function TenantDashboard() {
  const stats = trpc.dashboard.stats.useQuery();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-500 mt-1">Visão geral do seu negócio.</p>

      {stats.isLoading && <p className="text-gray-500 mt-8">Carregando...</p>}

      {stats.data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <StatCard
              label="Análises realizadas"
              value={stats.data.analysisCount}
            />
            <StatCard label="Conversões" value={stats.data.conversionCount} />
            <StatCard
              label="Produtos ativos"
              value={stats.data.productCount}
            />
            <StatCard
              label="Créditos restantes"
              value={stats.data.creditsRemaining}
            />
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Plano atual:{" "}
            <span className="font-medium text-brand-600 uppercase">
              {stats.data.plan}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
