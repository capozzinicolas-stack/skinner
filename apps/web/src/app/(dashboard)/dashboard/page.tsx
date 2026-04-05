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

export default function TenantDashboard() {
  const stats = trpc.dashboard.stats.useQuery();

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl text-carbone">Dashboard</h1>
      <p className="text-pierre text-sm font-light mt-1">
        Visao geral do seu negocio.
      </p>

      {stats.isLoading && <p className="text-pierre mt-8 font-light">Carregando...</p>}

      {stats.data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <StatCard label="Analises realizadas" value={stats.data.analysisCount} />
            <StatCard label="Conversoes" value={stats.data.conversionCount} />
            <StatCard label="Produtos ativos" value={stats.data.productCount} />
            <StatCard label="Creditos restantes" value={stats.data.creditsRemaining} />
          </div>
          <p className="mt-4 text-xs text-pierre font-light">
            Plano atual:{" "}
            <span className="text-carbone uppercase tracking-wider">
              {stats.data.plan}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
