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

// CSV-escape: wrap in double-quotes and double any inner quotes.
function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

type ExportSnapshot = {
  generatedAt: string;
  periodDays: number;
  summary: {
    analysesStarted: number;
    analysesCompleted: number;
    conversions: number;
    revenue: number;
    completionRate: number;
    conversionRate: number;
  };
  analyses: Array<{
    date: string;
    skinType: string;
    ageRange: string;
    primaryObjective: string;
    country: string;
    region: string;
    city: string;
    barrierStatus: string;
    conditions: string;
  }>;
  catalog: Array<{
    name: string;
    sku: string;
    type: string | null;
    stepRoutine: string | null;
    price: number | null;
  }>;
};

/**
 * Builds a multi-section CSV (summary header + per-analysis detail + catalog snapshot)
 * and triggers a browser download. No external lib — pure string + Blob.
 */
function downloadCsv(snapshot: ExportSnapshot, days: number) {
  const lines: string[] = [];
  lines.push(`# Skinner Dashboard Export`);
  lines.push(`# Generated at,${snapshot.generatedAt}`);
  lines.push(`# Period (days),${days}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(csvRow(["Metric", "Value"]));
  lines.push(csvRow(["Analyses started", snapshot.summary.analysesStarted]));
  lines.push(csvRow(["Analyses completed", snapshot.summary.analysesCompleted]));
  lines.push(csvRow(["Conversions (purchases)", snapshot.summary.conversions]));
  lines.push(csvRow(["Revenue (BRL)", snapshot.summary.revenue.toFixed(2)]));
  lines.push(csvRow(["Completion rate", (snapshot.summary.completionRate * 100).toFixed(2) + "%"]));
  lines.push(csvRow(["Conversion rate", (snapshot.summary.conversionRate * 100).toFixed(2) + "%"]));
  lines.push("");
  lines.push("## Analyses (per row)");
  lines.push(
    csvRow([
      "date",
      "skinType",
      "ageRange",
      "primaryObjective",
      "country",
      "region",
      "city",
      "barrierStatus",
      "conditions",
    ])
  );
  for (const a of snapshot.analyses) {
    lines.push(
      csvRow([
        a.date,
        a.skinType,
        a.ageRange,
        a.primaryObjective,
        a.country,
        a.region,
        a.city,
        a.barrierStatus,
        a.conditions,
      ])
    );
  }
  lines.push("");
  lines.push("## Catalog snapshot");
  lines.push(csvRow(["name", "sku", "type", "stepRoutine", "price"]));
  for (const p of snapshot.catalog) {
    lines.push(csvRow([p.name, p.sku, p.type ?? "", p.stepRoutine ?? "", p.price ?? ""]));
  }

  const csv = "﻿" + lines.join("\n"); // BOM so Excel reads UTF-8 correctly
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `skinner-dashboard-${stamp}-${days}d.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Brazil tile map ─────────────────────────────────────────────────────────────
//
// Tile map of Brazil — each state rendered as a fixed-grid SVG cell. Coordinates
// are an approximation, not cartographically precise: this is a visualization
// pattern (popularized by NYT and Financial Times) that prioritizes legibility
// over geographic accuracy. Color intensity scales with the state's count.
//
// No external lib — pure SVG. Adding/removing states requires editing the BR_GRID.

const BR_GRID: Record<string, { col: number; row: number; label: string }> = {
  // North
  RR: { col: 2, row: 0, label: "RR" },
  AP: { col: 4, row: 0, label: "AP" },
  AM: { col: 1, row: 1, label: "AM" },
  PA: { col: 3, row: 1, label: "PA" },
  MA: { col: 4, row: 1, label: "MA" },
  AC: { col: 0, row: 2, label: "AC" },
  RO: { col: 1, row: 2, label: "RO" },
  TO: { col: 3, row: 2, label: "TO" },
  PI: { col: 4, row: 2, label: "PI" },
  CE: { col: 5, row: 1, label: "CE" },
  RN: { col: 6, row: 1, label: "RN" },
  PB: { col: 6, row: 2, label: "PB" },
  PE: { col: 5, row: 2, label: "PE" },
  AL: { col: 6, row: 3, label: "AL" },
  SE: { col: 5, row: 3, label: "SE" },
  BA: { col: 4, row: 3, label: "BA" },
  // Center-West
  MT: { col: 2, row: 3, label: "MT" },
  GO: { col: 3, row: 3, label: "GO" },
  DF: { col: 3, row: 4, label: "DF" },
  MS: { col: 2, row: 4, label: "MS" },
  // Southeast
  MG: { col: 3, row: 5, label: "MG" },
  ES: { col: 4, row: 5, label: "ES" },
  RJ: { col: 4, row: 6, label: "RJ" },
  SP: { col: 3, row: 6, label: "SP" },
  // South
  PR: { col: 3, row: 7, label: "PR" },
  SC: { col: 3, row: 8, label: "SC" },
  RS: { col: 2, row: 8, label: "RS" },
};

function BrazilTileMap({ data }: { data: Array<{ uf: string; count: number }> }) {
  const counts = new Map(data.map((d) => [d.uf, d.count]));
  const max = Math.max(...data.map((d) => d.count), 1);
  const cell = 40;
  const gap = 4;
  const cols = 7;
  const rows = 9;
  const width = cols * (cell + gap);
  const height = rows * (cell + gap);

  function intensityClass(count: number): string {
    if (count === 0) return "fill-sable/15";
    const ratio = count / max;
    if (ratio < 0.25) return "fill-sable/40";
    if (ratio < 0.5) return "fill-sable";
    if (ratio < 0.75) return "fill-terre/70";
    return "fill-carbone";
  }
  function textColor(count: number): string {
    return count > 0 && count / max >= 0.5 ? "fill-blanc-casse" : "fill-carbone";
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Object.entries(BR_GRID).map(([uf, pos]) => {
          const x = pos.col * (cell + gap);
          const y = pos.row * (cell + gap);
          const count = counts.get(uf) ?? 0;
          return (
            <g key={uf}>
              <title>{`${uf}: ${count} ${count === 1 ? "análise" : "análises"}`}</title>
              <rect
                x={x}
                y={y}
                width={cell}
                height={cell}
                className={intensityClass(count)}
              />
              <text
                x={x + cell / 2}
                y={y + cell / 2 - 2}
                textAnchor="middle"
                className={`${textColor(count)} text-[9px] font-light uppercase tracking-wider`}
              >
                {pos.label}
              </text>
              <text
                x={x + cell / 2}
                y={y + cell / 2 + 10}
                textAnchor="middle"
                className={`${textColor(count)} text-[10px] font-medium`}
              >
                {count > 0 ? count : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-3 mt-4 text-[10px] text-pierre font-light uppercase tracking-wider">
        <span>Menos</span>
        <span className="w-4 h-3 inline-block bg-sable/40" />
        <span className="w-4 h-3 inline-block bg-sable" />
        <span className="w-4 h-3 inline-block bg-terre/70" />
        <span className="w-4 h-3 inline-block bg-carbone" />
        <span>Mais</span>
      </div>
    </div>
  );
}

// ─── Persona card ────────────────────────────────────────────────────────────────

const SEX_LABEL: Record<string, string> = {
  female: "Feminino",
  male: "Masculino",
  any: "Indefinido",
  other: "Outro",
};

function PersonaCard({
  persona,
  rank,
}: {
  persona: {
    sex: string;
    ageRange: string;
    topConcern: string;
    skinType: string;
    patients: number;
    converted: number;
    conversionRate: number;
    avgTicket: number;
    revenue: number;
    topProductName: string | null;
  };
  rank: number;
}) {
  const concernLabel =
    (conditionLabels[persona.topConcern] ?? persona.topConcern).charAt(0).toUpperCase() +
    (conditionLabels[persona.topConcern] ?? persona.topConcern).slice(1);
  const skinLabel = tr(skinTypeLabels, persona.skinType) || "—";
  return (
    <div className="p-5 bg-white border border-sable/20">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
          Persona #{rank}
        </p>
        <span className="text-xs text-pierre font-light">
          {fmtInt(persona.patients)} pacientes
        </span>
      </div>
      <h3 className="font-serif text-base text-carbone mb-1">
        {SEX_LABEL[persona.sex] ?? persona.sex} {persona.ageRange}
      </h3>
      <p className="text-xs text-pierre font-light mb-4">
        Pele <span className="text-carbone">{skinLabel}</span> ·{" "}
        Concern principal <span className="text-carbone">{concernLabel}</span>
      </p>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">Conversão</p>
          <p className="text-sm text-carbone font-light mt-1">
            {fmtPct(persona.conversionRate, 0)}{" "}
            <span className="text-pierre">({fmtInt(persona.converted)})</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">Ticket médio</p>
          <p className="text-sm text-carbone font-light mt-1">
            {persona.avgTicket > 0 ? fmtCurrency(persona.avgTicket) : "—"}
          </p>
        </div>
      </div>
      {persona.topProductName && (
        <p className="text-[11px] text-pierre font-light mt-3 border-t border-sable/15 pt-2 truncate">
          Top produto: <span className="text-carbone">{persona.topProductName}</span>
        </p>
      )}
    </div>
  );
}

// ─── Benchmark callout ───────────────────────────────────────────────────────────

function BenchmarkComparison({
  myValue,
  platformValue,
  label,
  format,
}: {
  myValue: number;
  platformValue: number;
  label: string;
  format: "pct" | "currency";
}) {
  const formatFn = format === "pct" ? (v: number) => fmtPct(v, 1) : fmtCurrency;
  const delta = platformValue > 0 ? (myValue - platformValue) / platformValue : 0;
  const isAbove = myValue > platformValue;
  const color = Math.abs(delta) < 0.05 ? "text-pierre" : isAbove ? "text-green-700" : "text-terre";
  return (
    <div className="p-4 bg-white border border-sable/20">
      <p className="text-[10px] text-pierre uppercase tracking-wider font-light">{label}</p>
      <div className="flex items-baseline justify-between mt-2">
        <div>
          <p className="text-lg font-serif text-carbone">{formatFn(myValue)}</p>
          <p className="text-[10px] text-pierre font-light">Você</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-pierre font-light">{formatFn(platformValue)}</p>
          <p className="text-[10px] text-pierre font-light">Plataforma</p>
        </div>
      </div>
      <p className={`text-xs font-light mt-2 ${color}`}>
        {Math.abs(delta) < 0.05
          ? "Em linha com a média"
          : isAbove
          ? `+${(delta * 100).toFixed(0)}% acima da média`
          : `${(delta * 100).toFixed(0)}% abaixo da média`}
      </p>
    </div>
  );
}

// ─── Conversion lift card ────────────────────────────────────────────────────────

function LiftCard({
  title,
  rows,
  labelMap,
}: {
  title: string;
  rows: Array<{ key: string; patients: number; converted: number; rate: number; lift: number }>;
  labelMap?: Record<string, string>;
}) {
  return (
    <div className="p-5 bg-white border border-sable/20">
      <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-pierre font-light">
          Sem segmentos com amostra suficiente (mínimo 3 pacientes).
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const label = labelMap
              ? (labelMap[r.key] ?? r.key).charAt(0).toUpperCase() + (labelMap[r.key] ?? r.key).slice(1)
              : r.key;
            const isPositive = r.lift >= 1;
            const liftColor = r.lift >= 1.3
              ? "text-green-700"
              : r.lift >= 1
              ? "text-carbone"
              : r.lift >= 0.7
              ? "text-pierre"
              : "text-terre";
            const liftPrefix = isPositive ? "+" : "";
            const liftDelta = ((r.lift - 1) * 100).toFixed(0);
            return (
              <div key={r.key} className="border-b border-sable/10 pb-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-carbone font-light truncate">{label}</span>
                  <span className={`text-xs font-light whitespace-nowrap ${liftColor}`}>
                    {r.lift.toFixed(2)}x
                    <span className="ml-1">({liftPrefix}{liftDelta}%)</span>
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[10px] text-pierre font-light mt-1">
                  <span>
                    {fmtInt(r.converted)} / {fmtInt(r.patients)} converteram
                  </span>
                  <span>{fmtPct(r.rate, 1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Seasonality heatmap ─────────────────────────────────────────────────────────

function SeasonalityHeatmap({
  months,
  series,
}: {
  months: string[];
  series: Array<{ condition: string; values: number[]; peak: number; peakMonth: string | null }>;
}) {
  const monthLabel = (m: string) => `${m.slice(5)}/${m.slice(2, 4)}`;
  return (
    <div className="min-w-[640px]">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-[10px] text-pierre uppercase tracking-wider font-light pb-2">
              Condição
            </th>
            {months.map((m) => (
              <th
                key={m}
                className="text-center text-[10px] text-pierre uppercase tracking-wider font-light pb-2 px-1"
              >
                {monthLabel(m)}
              </th>
            ))}
            <th className="text-right text-[10px] text-pierre uppercase tracking-wider font-light pb-2 pl-2">
              Pico
            </th>
          </tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.condition} className="border-t border-sable/10">
              <td className="text-sm text-carbone font-light py-2 pr-2">
                {(conditionLabels[s.condition] ?? s.condition).charAt(0).toUpperCase() +
                  (conditionLabels[s.condition] ?? s.condition).slice(1)}
              </td>
              {s.values.map((v, i) => {
                const intensity = s.peak > 0 ? v / s.peak : 0;
                const bg =
                  intensity === 0
                    ? "bg-sable/10"
                    : intensity < 0.34
                    ? "bg-sable/40"
                    : intensity < 0.67
                    ? "bg-terre/60"
                    : "bg-carbone";
                const textColor = intensity > 0.5 ? "text-blanc-casse" : "text-carbone";
                return (
                  <td key={i} className="px-0.5 py-1">
                    <div className={`${bg} ${textColor} text-center text-[10px] font-light py-1.5`}>
                      {v > 0 ? v : ""}
                    </div>
                  </td>
                );
              })}
              <td className="text-right text-xs text-pierre font-light pl-2">
                {s.peakMonth ? monthLabel(s.peakMonth) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-pierre font-light mt-3 italic">
        Cada célula mostra o número de pacientes com essa condição naquele mês. Cor mais escura = mais casos.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const [days, setDays] = useState<number>(30);
  const [channelId, setChannelId] = useState<string | undefined>(undefined);

  const channelsQuery = trpc.analysisChannel.list.useQuery();

  const overview = trpc.dashboard.overview.useQuery({ days, channelId });
  const trend = trpc.dashboard.monthlyTrend.useQuery({ months: 6, channelId });
  const byRegion = trpc.dashboard.byRegion.useQuery({ days, channelId });
  const byCity = trpc.dashboard.byCity.useQuery({ days, channelId });
  const bySkinType = trpc.dashboard.bySkinType.useQuery({ days, channelId });
  const byAge = trpc.dashboard.byAgeRange.useQuery({ days, channelId });
  const byObjective = trpc.dashboard.byObjective.useQuery({ days, channelId });
  const byBarrier = trpc.dashboard.byBarrierStatus.useQuery({ days, channelId });
  const topConditions = trpc.dashboard.topConditions.useQuery({ days, limit: 8, channelId });
  const discrepancy = trpc.dashboard.skinTypeDiscrepancy.useQuery({ days, channelId });
  const topProducts = trpc.dashboard.topProducts.useQuery({ days, limit: 8, channelId });
  const gaps = trpc.dashboard.catalogGaps.useQuery({ days, channelId });
  const engagement = trpc.dashboard.engagementMetrics.useQuery({ days, channelId });
  const conversionLift = trpc.dashboard.conversionLiftByProfile.useQuery({ days, channelId });
  const seasonality = trpc.dashboard.seasonalityByCondition.useQuery({ months: 12, topConditions: 5, channelId });
  const personas = trpc.dashboard.personas.useQuery({ days, channelId });
  const geoMap = trpc.dashboard.geoBrazilMap.useQuery({ days, channelId });
  // Platform benchmark stays cross-tenant — channel filter does not apply.
  const benchmark = trpc.dashboard.platformBenchmark.useQuery({ days });
  const me = trpc.user.me.useQuery();

  const utils = trpc.useUtils();
  const [exporting, setExporting] = useState(false);
  async function handleExport() {
    setExporting(true);
    try {
      const snapshot = await utils.dashboard.exportSnapshot.fetch({ days });
      downloadCsv(snapshot, days);
    } finally {
      setExporting(false);
    }
  }

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
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={channelId ?? ""}
            onChange={(e) => setChannelId(e.target.value || undefined)}
            className="px-3 py-1.5 border border-sable/40 bg-white text-xs text-carbone font-light tracking-wide"
          >
            <option value="">Todos os canais</option>
            {channelsQuery.data?.channels.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
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
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-1.5 border border-sable text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors disabled:opacity-50 disabled:cursor-wait"
          >
            {exporting ? "Exportando..." : "Exportar CSV"}
          </button>
        </div>
      </div>

      {/* Temp-password banner: shown until the user rotates their password.
          Disappears as soon as user.changePassword stamps passwordChangedAt. */}
      {me.data && me.data.passwordChangedAt === null && (
        <div className="mt-6 px-5 py-4 bg-ivoire border border-sable flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-carbone font-light">
              Voce ainda esta usando uma senha temporaria.
            </p>
            <p className="text-xs text-pierre font-light mt-1">
              Por seguranca, recomendamos altera-la agora em Minha Conta.
            </p>
          </div>
          <a
            href="/dashboard/conta"
            className="px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide whitespace-nowrap"
          >
            Alterar senha
          </a>
        </div>
      )}

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
          {/* Brazil tile map */}
          {geoMap.data && geoMap.data.length > 0 && (
            <div className="p-5 bg-white border border-sable/20 mb-4">
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4 text-center">
                Mapa do Brasil — análises por estado
              </p>
              <BrazilTileMap data={geoMap.data} />
            </div>
          )}
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

          {/* PERSONAS */}
          {personas.data && personas.data.length > 0 && (
            <>
              <SectionTitle subtitle="Perfis dominantes do seu público — use para campanhas, estoque e comunicação">
                Personas dominantes
              </SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personas.data.map((p, i) => (
                  <PersonaCard key={p.key} persona={p} rank={i + 1} />
                ))}
              </div>
            </>
          )}

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

          {/* CONVERSION LIFT POR PERFIL */}
          {conversionLift.data && conversionLift.data.baseline.totalPatients > 0 && (
            <>
              <SectionTitle subtitle="Quais perfis convertem mais que a média — útil para segmentar campanhas">
                Conversão por perfil
              </SectionTitle>
              <div className="p-5 bg-white border border-sable/20 mb-4">
                <p className="text-xs text-pierre font-light">
                  Linha de base do tenant:{" "}
                  <span className="text-carbone">
                    {fmtPct(conversionLift.data.baseline.rate, 1)}
                  </span>{" "}
                  ({fmtInt(conversionLift.data.baseline.converted)} de{" "}
                  {fmtInt(conversionLift.data.baseline.totalPatients)} pacientes converteram).
                  Lift = quanto cada segmento converte vs essa média (1.50x = 50% acima).
                </p>
                <LowSampleNotice sample={conversionLift.data.baseline.totalPatients} threshold={50} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LiftCard
                  title="Por tipo de pele"
                  rows={conversionLift.data.bySkinType.slice(0, 5)}
                  labelMap={skinTypeLabels}
                />
                <LiftCard
                  title="Por faixa etária"
                  rows={conversionLift.data.byAgeRange.slice(0, 5)}
                />
                <LiftCard
                  title="Por objetivo"
                  rows={conversionLift.data.byObjective.slice(0, 5)}
                  labelMap={objectiveLabels}
                />
                <LiftCard
                  title="Por região"
                  rows={conversionLift.data.byRegion.slice(0, 5)}
                />
              </div>
            </>
          )}

          {/* SAZONALIDADE */}
          {seasonality.data && seasonality.data.series.length > 0 && (
            <>
              <SectionTitle subtitle="Como cada condição varia ao longo do ano — antecipe campanhas e estoque">
                Sazonalidade das condições
              </SectionTitle>
              <div className="p-5 bg-white border border-sable/20 overflow-x-auto">
                <SeasonalityHeatmap months={seasonality.data.months} series={seasonality.data.series} />
              </div>
            </>
          )}

          {/* BENCHMARK PLATAFORMA */}
          {benchmark.data && (
            <>
              <SectionTitle subtitle="Compare seus indicadores com a média de outros clientes Skinner (anônimo, agregado)">
                Benchmark da plataforma
              </SectionTitle>
              {!benchmark.data.optedIn ? (
                <div className="p-5 bg-ivoire border border-sable/30">
                  <p className="text-sm text-terre font-light leading-relaxed">
                    Você ainda não está participando do benchmark. Ative em{" "}
                    <a href="/dashboard/analise" className="underline text-carbone">
                      Configuração da análise → Benchmark da plataforma
                    </a>{" "}
                    para comparar seus números com a média anônima dos demais clientes.
                  </p>
                </div>
              ) : !benchmark.data.eligible ? (
                <div className="p-5 bg-ivoire border border-sable/30">
                  <p className="text-sm text-terre font-light leading-relaxed">
                    Você está participando do benchmark, mas ainda não temos clientes
                    suficientes opt-in para gerar números agregados confiáveis (
                    {benchmark.data.contributingTenants ?? 0} de {benchmark.data.minTenants ?? 3} mínimos).
                    Conforme mais clientes ativarem, os indicadores aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : data ? (
                <>
                  <p className="text-xs text-pierre font-light mb-3">
                    Baseado em <span className="text-carbone">{benchmark.data.contributingTenants}</span>{" "}
                    clientes opt-in (média agregada — nenhum cliente individual exposto).
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BenchmarkComparison
                      label="Taxa de conclusão"
                      myValue={data.completionRate}
                      platformValue={benchmark.data.avgCompletionRate}
                      format="pct"
                    />
                    <BenchmarkComparison
                      label="Taxa de conversão"
                      myValue={data.conversionRate}
                      platformValue={benchmark.data.avgConversionRate}
                      format="pct"
                    />
                    <BenchmarkComparison
                      label="Ticket médio"
                      myValue={data.avgTicket}
                      platformValue={benchmark.data.avgTicket}
                      format="currency"
                    />
                  </div>
                </>
              ) : null}
            </>
          )}

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
