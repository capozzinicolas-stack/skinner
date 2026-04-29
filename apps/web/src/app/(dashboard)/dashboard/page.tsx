"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  conditionLabels,
  skinTypeLabels,
  objectiveLabels,
  barrierStatusLabels,
  tr,
} from "@/lib/sae/labels";

// ─── Helpers ──────────────────────────────────────────────────────────────────────

function fmtCurrency(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtPct(v: number, digits = 1): string {
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtInt(v: number): string {
  return new Intl.NumberFormat("pt-BR").format(v);
}

const PERIOD_OPTIONS = [
  { value: 7, label: "7 dias" },
  { value: 30, label: "30 dias" },
  { value: 90, label: "90 dias" },
  { value: 365, label: "12 meses" },
] as const;

// ─── Reusable UI ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={`p-5 border ${accent ? "bg-ivoire border-sable" : "bg-white border-sable/20"}`}>
      <p className="text-[10px] text-pierre uppercase tracking-wider font-light">{label}</p>
      <p className="text-2xl font-serif text-carbone mt-2">{value}</p>
      {hint && <p className="text-xs text-pierre font-light mt-1">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="mt-10 mb-4">
      <h2 className="font-serif text-lg text-carbone">{children}</h2>
      {subtitle && <p className="text-xs text-pierre font-light mt-1">{subtitle}</p>}
    </div>
  );
}

function HorizontalBar({ label, value, max, count, suffix }: { label: string; value: number; max: number; count?: number; suffix?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm text-carbone font-light">{label}</span>
        <span className="text-xs text-pierre font-light">
          {count != null ? `${fmtInt(count)} análises ` : ""}
          {suffix ?? fmtPct(value, 1)}
        </span>
      </div>
      <div className="h-1.5 bg-sable/20">
        <div className="h-full bg-carbone" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-5 bg-ivoire border border-sable/30 text-xs text-pierre font-light">
      {children}
    </div>
  );
}

function LowSampleNotice({ sample, threshold = 30 }: { sample: number; threshold?: number }) {
  if (sample >= threshold) return null;
  return (
    <p className="text-[10px] text-terre font-light mt-2 italic">
      Amostra pequena ({sample} análise{sample === 1 ? "" : "s"}) — colete mais dados para insights confiáveis.
    </p>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const [days, setDays] = useState<number>(30);

  const overview = trpc.dashboard.overview.useQuery({ days });
  const trend = trpc.dashboard.monthlyTrend.useQuery({ months: 6 });
  const byRegion = trpc.dashboard.byRegion.useQuery({ days });
  const byCity = trpc.dashboard.byCity.useQuery({ days });
  const bySkinType = trpc.dashboard.bySkinType.useQuery({ days });
  const byAge = trpc.dashboard.byAgeRange.useQuery({ days });
  const byObjective = trpc.dashboard.byObjective.useQuery({ days });
  const byBarrier = trpc.dashboard.byBarrierStatus.useQuery({ days });
  const topConditions = trpc.dashboard.topConditions.useQuery({ days, limit: 8 });
  const discrepancy = trpc.dashboard.skinTypeDiscrepancy.useQuery({ days });
  const topProducts = trpc.dashboard.topProducts.useQuery({ days, limit: 8 });
  const gaps = trpc.dashboard.catalogGaps.useQuery({ days });
  const engagement = trpc.dashboard.engagementMetrics.useQuery({ days });

  const data = overview.data;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header + period filter */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl text-carbone">Dashboard</h1>
          <p className="text-pierre text-sm font-light mt-1">
            Visão estratégica do seu negócio.
          </p>
        </div>
        <div className="flex gap-1 border border-sable/40">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 text-xs font-light tracking-wide ${
                days === opt.value
                  ? "bg-carbone text-blanc-casse"
                  : "bg-white text-pierre hover:bg-ivoire"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {overview.isLoading && <p className="text-pierre mt-8 font-light">Carregando...</p>}

      {data && (
        <>
          {/* ROI BLOQUE */}
          <SectionTitle subtitle="Resultados financeiros e operacionais">Visão geral</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Análises completas"
              value={fmtInt(data.analysesCompleted)}
              hint={`${fmtPct(data.completionRate)} de ${fmtInt(data.analysesStarted)} iniciadas`}
            />
            <KpiCard
              label="Conversões em vendas"
              value={fmtInt(data.conversions)}
              hint={fmtPct(data.conversionRate) + " do total completas"}
            />
            <KpiCard
              label="Receita atribuída"
              value={fmtCurrency(data.revenue)}
              hint={"Ticket médio " + fmtCurrency(data.avgTicket)}
              accent
            />
            <KpiCard
              label="Downloads de PDF"
              value={fmtInt(data.pdfDownloads)}
              hint={
                data.analysesCompleted > 0
                  ? fmtPct(data.pdfDownloads / data.analysesCompleted) + " de engajamento"
                  : ""
              }
            />
          </div>

          {/* PLAN USAGE */}
          <SectionTitle subtitle="Consumo do plano vs limite">Plano e capacidade</SectionTitle>
          <div className="p-5 bg-white border border-sable/20">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-sm text-carbone uppercase tracking-wider font-light">
                Plano {data.planUsage.plan}
              </span>
              <span className="text-xs text-pierre font-light">
                {fmtInt(data.planUsage.used)} / {fmtInt(data.planUsage.limit)} análises
              </span>
            </div>
            <div className="h-2 bg-sable/20">
              <div
                className={`h-full ${
                  data.planUsage.pct > 0.9
                    ? "bg-red-700"
                    : data.planUsage.pct > 0.7
                    ? "bg-terre"
                    : "bg-carbone"
                }`}
                style={{ width: `${Math.min(data.planUsage.pct * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-pierre font-light mt-2">
              {fmtPct(data.planUsage.pct, 0)} consumido.{" "}
              {data.planUsage.pct > 0.9
                ? "Limite próximo — considere fazer upgrade."
                : data.planUsage.pct > 0.7
                ? "Atenção: você está acima de 70% do limite."
                : "Uso saudável."}
            </p>
          </div>

          {/* MONTHLY TREND */}
          {trend.data && trend.data.length > 0 && (
            <>
              <SectionTitle subtitle="Volume e receita nos últimos 6 meses">Tendência</SectionTitle>
              <div className="p-5 bg-white border border-sable/20">
                <div className="grid grid-cols-6 gap-3">
                  {trend.data.map((m) => {
                    const max = Math.max(...trend.data!.map((x) => x.analyses), 1);
                    const height = (m.analyses / max) * 100;
                    return (
                      <div key={m.month} className="text-center">
                        <div className="h-32 flex items-end justify-center mb-2">
                          <div
                            className="w-full bg-carbone transition-all"
                            style={{ height: `${height}%`, minHeight: m.analyses > 0 ? "4px" : "0" }}
                          />
                        </div>
                        <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                          {m.month.slice(5)}/{m.month.slice(2, 4)}
                        </p>
                        <p className="text-xs text-carbone font-light mt-1">{fmtInt(m.analyses)}</p>
                        {m.revenue > 0 && (
                          <p className="text-[10px] text-pierre font-light">
                            {fmtCurrency(m.revenue)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* GEO */}
          <SectionTitle subtitle="De onde vêm seus pacientes (capturado automaticamente)">
            Distribuição geográfica
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
                Por estado / região
              </p>
              {byRegion.data && byRegion.data.length > 0 ? (
                <div className="space-y-3">
                  {byRegion.data.slice(0, 8).map((r) => {
                    const max = byRegion.data![0].count;
                    return (
                      <HorizontalBar
                        key={r.region}
                        label={r.region}
                        value={r.count}
                        max={max}
                        count={r.count}
                        suffix={fmtPct(r.pct)}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyHint>Sem dados geográficos no período. Análises feitas em redes locais ou sem detecção de IP aparecem como "Desconhecido".</EmptyHint>
              )}
            </div>
            <div className="p-5 bg-white border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
                Top 10 cidades
              </p>
              {byCity.data && byCity.data.length > 0 ? (
                <div className="space-y-2">
                  {byCity.data.map((c, i) => (
                    <div key={`${c.city}-${i}`} className="flex items-baseline justify-between border-b border-sable/10 pb-1">
                      <span className="text-sm text-carbone font-light">
                        {c.city}
                        {c.region && <span className="text-xs text-pierre"> / {c.region}</span>}
                      </span>
                      <span className="text-xs text-pierre font-light">{fmtInt(c.count)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyHint>Sem dados de cidade.</EmptyHint>
              )}
            </div>
          </div>

          {/* PATIENT PROFILE */}
          <SectionTitle subtitle="Quem são seus pacientes e o que precisam">
            Perfil de paciente
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Skin type */}
            <div className="p-5 bg-white border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
                Tipo de pele detectado
              </p>
              {bySkinType.data && bySkinType.data.length > 0 ? (
                <div className="space-y-3">
                  {bySkinType.data.map((s) => (
                    <HorizontalBar
                      key={s.skinType}
                      label={tr(skinTypeLabels, s.skinType).charAt(0).toUpperCase() + tr(skinTypeLabels, s.skinType).slice(1)}
                      value={s.count}
                      max={bySkinType.data![0].count}
                      count={s.count}
                      suffix={fmtPct(s.pct)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyHint>Sem análises completas no período.</EmptyHint>
              )}
            </div>
            {/* Age range */}
            <div className="p-5 bg-white border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
                Faixa etária
              </p>
              {byAge.data && byAge.data.length > 0 ? (
                <div className="space-y-3">
                  {byAge.data.map((a) => {
                    const max = Math.max(...byAge.data!.map((x) => x.count));
                    return (
                      <HorizontalBar
                        key={a.ageRange}
                        label={a.ageRange}
                        value={a.count}
                        max={max}
                        count={a.count}
                        suffix={fmtPct(a.pct)}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyHint>Sem dados de faixa etária.</EmptyHint>
              )}
            </div>
            {/* Objective */}
            <div className="p-5 bg-white border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
                Objetivo principal
              </p>
              {byObjective.data && byObjective.data.length > 0 ? (
                <div className="space-y-3">
                  {byObjective.data.slice(0, 6).map((o) => {
                    const max = Math.max(...byObjective.data!.map((x) => x.count));
                    return (
                      <HorizontalBar
                        key={o.objective}
                        label={tr(objectiveLabels, o.objective).charAt(0).toUpperCase() + tr(objectiveLabels, o.objective).slice(1)}
                        value={o.count}
                        max={max}
                        count={o.count}
                        suffix={fmtInt(o.count)}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyHint>Sem objetivos registrados.</EmptyHint>
              )}
            </div>
          </div>

          {/* CONDITIONS + BARRIER */}
          <SectionTitle subtitle="O que a IA está detectando na pele dos seus pacientes">
            Condições mais frequentes
          </SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-5 bg-white border border-sable/20">
              {topConditions.data && topConditions.data.length > 0 ? (
                <div className="space-y-3">
                  {topConditions.data.map((c) => {
                    const max = topConditions.data![0].count;
                    const sevLabel = c.avgSeverity < 1.5 ? "Leve" : c.avgSeverity < 2.5 ? "Moderada" : "Severa";
                    return (
                      <HorizontalBar
                        key={c.condition}
                        label={`${tr(conditionLabels, c.condition).charAt(0).toUpperCase() + tr(conditionLabels, c.condition).slice(1)} — gravidade média ${sevLabel}`}
                        value={c.count}
                        max={max}
                        count={c.count}
                        suffix={fmtInt(c.count)}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyHint>Sem condições detectadas no período.</EmptyHint>
              )}
            </div>
            {/* Barrier status */}
            <div className="p-5 bg-white border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
                Estado da barreira
              </p>
              {byBarrier.data && byBarrier.data.length > 0 ? (
                <div className="space-y-3">
                  {byBarrier.data.map((b) => (
                    <HorizontalBar
                      key={b.status}
                      label={barrierStatusLabels[b.status]?.short ?? b.status}
                      value={b.count}
                      max={Math.max(...byBarrier.data!.map((x) => x.count))}
                      count={b.count}
                      suffix={fmtPct(b.pct)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyHint>Sem dados.</EmptyHint>
              )}
            </div>
          </div>

          {/* DISCREPANCY INDEX */}
          {discrepancy.data && discrepancy.data.total > 0 && (
            <>
              <SectionTitle subtitle="Quantos pacientes têm um tipo de pele diferente do que percebem">
                Discrepância de auto-percepção
              </SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  label="Taxa de discrepância"
                  value={fmtPct(discrepancy.data.mismatchPct, 0)}
                  hint={`${fmtInt(discrepancy.data.mismatch)} de ${fmtInt(discrepancy.data.total)} análises`}
                  accent
                />
                <div className="md:col-span-2 p-5 bg-white border border-sable/20">
                  <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
                    Por que isso importa
                  </p>
                  <p className="text-sm text-pierre font-light leading-relaxed">
                    Em <span className="text-carbone">{fmtPct(discrepancy.data.mismatchPct, 0)}</span> dos
                    casos, a análise da IA identificou um tipo de pele diferente do que o paciente acreditava ter.
                    Use esse dado em campanhas: "nossa análise revela em média informações que você não percebe sobre sua própria pele".
                  </p>
                  <LowSampleNotice sample={discrepancy.data.total} />
                </div>
              </div>
            </>
          )}

          {/* CATALOG */}
          <SectionTitle subtitle="O que está sendo recomendado e onde estão as oportunidades">
            Performance do catálogo
          </SectionTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 bg-white border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
                Top 8 produtos recomendados
              </p>
              {topProducts.data && topProducts.data.length > 0 ? (
                <div className="space-y-2">
                  {topProducts.data.map((p, i) => (
                    <div
                      key={p.productId}
                      className="flex items-baseline justify-between border-b border-sable/10 pb-1"
                    >
                      <span className="text-sm text-carbone font-light truncate pr-2">
                        <span className="text-pierre text-xs">#{i + 1}</span> {p.product?.name ?? "—"}
                      </span>
                      <span className="text-xs text-pierre font-light whitespace-nowrap">
                        {fmtInt(p.recommendationCount)} rec.
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyHint>Sem recomendações no período.</EmptyHint>
              )}
            </div>
            <div className="p-5 bg-white border border-sable/20">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
                Lacunas no catálogo
              </p>
              {gaps.data && gaps.data.length > 0 ? (
                <>
                  <p className="text-xs text-pierre font-light mb-3">
                    Condições detectadas em pacientes para as quais você ainda não tem produto:
                  </p>
                  <div className="space-y-2">
                    {gaps.data.map((g) => (
                      <div
                        key={g.condition}
                        className="flex items-baseline justify-between border-b border-sable/10 pb-1"
                      >
                        <span className="text-sm text-carbone font-light">
                          {tr(conditionLabels, g.condition).charAt(0).toUpperCase() + tr(conditionLabels, g.condition).slice(1)}
                        </span>
                        <span className="text-xs text-terre font-light whitespace-nowrap">
                          {fmtInt(g.count)} pacientes ({fmtPct(g.pctOfPatients, 0)})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-pierre font-light">
                  Seu catálogo cobre todas as condições detectadas. Excelente.
                </p>
              )}
            </div>
          </div>

          {/* ENGAGEMENT */}
          {engagement.data && (
            <>
              <SectionTitle subtitle="Como os pacientes interagem com o resultado">
                Engajamento
              </SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  label="Taxa de download de PDF"
                  value={fmtPct(engagement.data.downloadRate, 0)}
                  hint={`${fmtInt(engagement.data.pdfDownloads)} downloads`}
                />
                <KpiCard
                  label="Taxa de envio por email"
                  value={fmtPct(engagement.data.emailRate, 0)}
                  hint={`${fmtInt(engagement.data.emailsSent)} emails`}
                />
                <KpiCard
                  label="Análises completas"
                  value={fmtInt(engagement.data.completed)}
                  hint="No período selecionado"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
