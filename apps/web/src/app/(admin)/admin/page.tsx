"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { useI18n } from "@/lib/i18n/client";

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
  const { t } = useI18n();
  const overview = trpc.admin.dashboardOverview.useQuery();
  const criticalConfigs = trpc.admin.criticalConfigs.useQuery();

  const data = overview.data;
  const criticalData = criticalConfigs.data ?? [];

  return (
    <div className="p-4 md:p-8">
      <div className="border-b border-sable/20 pb-6 mb-8">
        <h1 className="font-serif text-xl md:text-2xl text-carbone">{t.dashboardPages.admin_dash_title}</h1>
        <p className="text-sm text-pierre font-light mt-1">
          {t.dashboardPages.admin_dash_subtitle}
        </p>
      </div>

      {overview.isLoading && (
        <p className="text-sm text-pierre font-light">{t.dashboardPages.common_loading}</p>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
            <StatCard
              label={t.dashboardPages.admin_dash_mrr}
              value={formatMRR(data.totalMRR)}
              sub={t.dashboardPages.admin_dash_mrr_sub}
            />
            <StatCard
              label={t.dashboardPages.admin_dash_analyses_month_label}
              value={data.analysesThisMonth}
            />
            <StatCard
              label={t.dashboardPages.admin_dash_active_tenants}
              value={data.activeTenants}
              sub={t.dashboardPages.admin_dash_tenants_active_sub.replace("{total}", String(data.totalTenants))}
            />
            <StatCard
              label={t.dashboardPages.admin_dash_users_label}
              value={data.totalUsers}
            />
            <StatCard
              label={t.dashboardPages.admin_dash_risk_label}
              value={data.tenantsAtRisk.length}
              sub={t.dashboardPages.admin_dash_risk_sub}
            />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent analyses */}
            <div className="lg:col-span-2">
              <h2 className="font-serif text-base text-carbone mb-4">
                {t.dashboardPages.admin_dash_recent_analyses}
              </h2>
              <div className="bg-white border border-sable/20 overflow-hidden">
                {data.recentAnalyses.length === 0 ? (
                  <p className="p-6 text-sm text-pierre font-light">
                    {t.dashboardPages.admin_dash_empty_analyses}
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-sable/20 bg-ivoire">
                        <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          {t.dashboardPages.common_date}
                        </th>
                        <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          {t.dashboardPages.admin_leads_th_tenant}
                        </th>
                        <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          {t.dashboardPages.reports_th_skin_type}
                        </th>
                        <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          {t.dashboardPages.reports_th_conditions}
                        </th>
                        <th className="text-right px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                          {t.dashboardPages.reports_th_latency}
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
                  {t.dashboardPages.admin_dash_at_risk}
                </h2>
                <div className="space-y-2">
                  {data.tenantsAtRisk.length === 0 ? (
                    <div className="bg-white border border-sable/20 p-4">
                      <p className="text-sm text-pierre font-light">
                        {t.dashboardPages.admin_dash_at_risk_empty}
                      </p>
                    </div>
                  ) : (
                    data.tenantsAtRisk.map((tnt) => {
                      const pct =
                        tnt.analysisLimit > 0
                          ? Math.round((tnt.analysisUsed / tnt.analysisLimit) * 100)
                          : 0;
                      return (
                        <Link
                          key={tnt.id}
                          href={`/admin/tenants/${tnt.id}`}
                          className="block bg-white border border-sable/20 p-4 hover:bg-ivoire/40 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-carbone font-light">
                              {tnt.name}
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
                            {tnt.analysisUsed} / {tnt.analysisLimit} {tnt.analysisUsed === 1 ? t.dashboardPages.home_analyses_one : t.dashboardPages.home_analyses_many} — {tnt.plan}
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
                  {t.dashboardPages.admin_dash_critical_title}
                </h2>
                <p className="text-xs text-pierre font-light mb-4">
                  {t.dashboardPages.admin_dash_critical_sub}
                </p>
                <div className="space-y-2">
                  {criticalConfigs.isLoading && (
                    <div className="bg-white border border-sable/20 p-4">
                      <p className="text-sm text-pierre font-light">{t.dashboardPages.common_loading}</p>
                    </div>
                  )}
                  {!criticalConfigs.isLoading && criticalData.length === 0 && (
                    <div className="bg-white border border-sable/20 p-4">
                      <p className="text-sm text-pierre font-light">
                        {t.dashboardPages.admin_dash_critical_empty}
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
