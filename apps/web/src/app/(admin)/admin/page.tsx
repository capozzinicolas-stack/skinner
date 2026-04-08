"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="p-6 bg-white border border-sable/20">
      <p className="text-[10px] text-pierre uppercase tracking-wider font-light">{label}</p>
      <p className="text-3xl font-serif text-carbone mt-2">{value}</p>
      {sub && <p className="text-xs text-pierre font-light mt-1">{sub}</p>}
    </div>
  );
}

function formatMRR(value: number | null | undefined) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeParseConditions(json: string | null | undefined): string {
  if (!json) return "—";
  try {
    const arr = JSON.parse(json) as Array<{ name: string }>;
    return arr.map((c) => c.name).join(", ") || "—";
  } catch {
    return "—";
  }
}

export default function AdminDashboard() {
  const overview = trpc.admin.dashboardOverview.useQuery();
  const criticalConfigs = trpc.admin.criticalConfigs.useQuery();

  const data = overview.data;
  const criticalData = criticalConfigs.data ?? [];

  return (
    <div className="p-8">
      <div className="border-b border-sable/20 pb-6 mb-8">
        <h1 className="font-serif text-2xl text-carbone">Dashboard</h1>
        <p className="text-sm text-pierre font-light mt-1">
          Visao geral da plataforma Skinner.
        </p>
      </div>

      {overview.isLoading && (
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <StatCard
              label="MRR"
              value={formatMRR(data.totalMRR)}
              sub="planos ativos"
            />
            <StatCard
              label="Analises este mes"
              value={data.analysesThisMonth}
            />
            <StatCard
              label="Tenants ativos"
              value={data.activeTenants}
              sub={`de ${data.totalTenants} total`}
            />
            <StatCard
              label="Usuarios B2B"
              value={data.totalUsers}
            />
            <StatCard
              label="Risco de uso"
              value={data.tenantsAtRisk.length}
              sub="tenants acima de 80%"
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent analyses */}
            <div className="lg:col-span-2">
              <h2 className="font-serif text-base text-carbone mb-4">
                Ultimas analises
              </h2>
              <div className="bg-white border border-sable/20 overflow-hidden">
                {data.recentAnalyses.length === 0 ? (
                  <p className="p-6 text-sm text-pierre font-light">
                    Nenhuma analise realizada ainda.
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-sable/20 bg-ivoire">
                        <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          Data
                        </th>
                        <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          Tenant
                        </th>
                        <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          Tipo de pele
                        </th>
                        <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          Condicoes
                        </th>
                        <th className="text-right px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          Latencia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sable/10">
                      {data.recentAnalyses.map((a) => (
                        <tr key={a.id} className="hover:bg-ivoire/40">
                          <td className="px-4 py-3 text-xs text-pierre font-light whitespace-nowrap">
                            {formatDate(a.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-xs text-carbone font-light">
                            {a.tenant?.name ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-pierre font-light">
                            {a.skinType ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-pierre font-light max-w-[180px] truncate">
                            {safeParseConditions(a.conditions)}
                          </td>
                          <td className="px-4 py-3 text-xs text-pierre font-light text-right">
                            {a.latencyMs != null ? `${a.latencyMs}ms` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right sidebar: at-risk + critical configs */}
            <div className="space-y-8">
              {/* Tenants at risk */}
              <div>
                <h2 className="font-serif text-base text-carbone mb-4">
                  Tenants em risco
                </h2>
                <div className="space-y-2">
                  {data.tenantsAtRisk.length === 0 ? (
                    <div className="bg-white border border-sable/20 p-4">
                      <p className="text-sm text-pierre font-light">
                        Nenhum tenant acima de 80% do limite.
                      </p>
                    </div>
                  ) : (
                    data.tenantsAtRisk.map((t) => {
                      const pct =
                        t.analysisLimit > 0
                          ? Math.round((t.analysisUsed / t.analysisLimit) * 100)
                          : 0;
                      return (
                        <Link
                          key={t.id}
                          href={`/admin/tenants/${t.id}`}
                          className="block bg-white border border-sable/20 p-4 hover:bg-ivoire/40 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-carbone font-light">
                              {t.name}
                            </span>
                            <span className="text-xs text-pierre font-light">
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1 bg-sable/20">
                            <div
                              className={`h-1 ${pct >= 95 ? "bg-carbone" : "bg-pierre"}`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-pierre font-light mt-2 uppercase tracking-wider">
                            {t.analysisUsed} / {t.analysisLimit} analises — {t.plan}
                          </p>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Configuracoes criticas */}
              <div>
                <h2 className="font-serif text-base text-carbone mb-1">
                  Configuracoes criticas
                </h2>
                <p className="text-xs text-pierre font-light mb-4">
                  Tenants com configuracoes de seguranca desativadas.
                </p>
                <div className="space-y-2">
                  {criticalConfigs.isLoading && (
                    <div className="bg-white border border-sable/20 p-4">
                      <p className="text-sm text-pierre font-light">Carregando...</p>
                    </div>
                  )}
                  {!criticalConfigs.isLoading && criticalData.length === 0 && (
                    <div className="bg-white border border-sable/20 p-4">
                      <p className="text-sm text-pierre font-light">
                        Nenhum tenant com configuracoes criticas desativadas.
                      </p>
                    </div>
                  )}
                  {criticalData.map((item) => (
                    <Link
                      key={item.tenantId}
                      href={`/admin/tenants/${item.tenantId}`}
                      className="block bg-white border border-sable/20 p-4 hover:bg-ivoire/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm text-carbone font-light">
                          {item.tenantName}
                        </span>
                        <span className="text-[9px] text-pierre uppercase tracking-wider font-light px-1.5 py-0.5 border border-sable/30 whitespace-nowrap flex-shrink-0">
                          {item.tenantPlan}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {item.issues.map((issue) => (
                          <p key={issue} className="text-[10px] text-terre font-light flex items-center gap-1.5">
                            <span className="inline-block w-1 h-1 bg-terre flex-shrink-0" />
                            {issue}
                          </p>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
