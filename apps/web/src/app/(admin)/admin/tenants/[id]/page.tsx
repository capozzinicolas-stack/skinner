"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";

const planLabels: Record<string, string> = {
  growth: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  active: { label: "Ativo", classes: "bg-carbone/10 text-carbone" },
  paused: { label: "Pausado", classes: "bg-sable/30 text-pierre" },
  deleted: { label: "Deletado", classes: "bg-sable/20 text-pierre" },
};

const roleLabels: Record<string, string> = {
  b2b_admin: "Admin",
  b2b_analyst: "Analista",
  b2b_viewer: "Visualizador",
  skinner_admin: "Skinner Admin",
};

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBRL(v: number | null | undefined) {
  if (v == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
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

function safeParseLockedFields(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json) as string[];
  } catch {
    return [];
  }
}

// All toggle fields that admin can override
const TOGGLE_FIELDS: Array<{ field: string; label: string; critical?: boolean }> = [
  { field: "questionPregnantEnabled", label: "Pergunta: gravidez ou amamentacao", critical: true },
  { field: "resultsShowAlertSigns", label: "Secao: sinais de alerta", critical: true },
  { field: "photoOnlyMode", label: "Modo somente foto", critical: true },
  { field: "questionAllergiesEnabled", label: "Pergunta: alergias" },
  { field: "questionSunscreenEnabled", label: "Pergunta: protetor solar" },
  { field: "resultsShowBarrier", label: "Secao: barreira cutanea" },
  { field: "resultsShowConditions", label: "Secao: condicoes identificadas" },
  { field: "resultsShowConditionsDesc", label: "Secao: descricao das condicoes" },
  { field: "resultsShowSeverityBars", label: "Secao: barras de severidade" },
  { field: "resultsShowActionPlan", label: "Secao: plano de acao" },
  { field: "resultsShowTimeline", label: "Secao: linha do tempo" },
  { field: "resultsShowProducts", label: "Secao: produtos recomendados" },
  { field: "resultsShowServices", label: "Secao: servicos recomendados" },
  { field: "resultsShowMatchScore", label: "Secao: score de compatibilidade" },
  { field: "resultsShowPdfButton", label: "Secao: botao de PDF" },
  { field: "resultsShowPrices", label: "Secao: precos" },
];

export default function TenantDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const utils = trpc.useUtils();
  const detail = trpc.admin.tenantDetail.useQuery({ id });
  const analysisConfigQuery = trpc.admin.getAnalysisConfig.useQuery({ tenantId: id });

  const changePlan = trpc.admin.changeTenantPlan.useMutation({
    onSuccess: () => {
      utils.admin.tenantDetail.invalidate({ id });
      utils.tenant.list.invalidate();
      setShowPlanModal(false);
    },
  });
  const changeStatus = trpc.admin.changeTenantStatus.useMutation({
    onSuccess: () => {
      utils.admin.tenantDetail.invalidate({ id });
      utils.tenant.list.invalidate();
    },
  });
  const resetUsage = trpc.admin.resetTenantUsage.useMutation({
    onSuccess: () => {
      utils.admin.tenantDetail.invalidate({ id });
    },
  });

  const updateAnalysisConfig = trpc.admin.updateAnalysisConfig.useMutation({
    onSuccess: () => {
      utils.admin.getAnalysisConfig.invalidate({ tenantId: id });
      utils.admin.tenantDetail.invalidate({ id });
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
    },
  });

  const lockField = trpc.admin.lockField.useMutation({
    onSuccess: () => {
      utils.admin.getAnalysisConfig.invalidate({ tenantId: id });
    },
  });

  const unlockField = trpc.admin.unlockField.useMutation({
    onSuccess: () => {
      utils.admin.getAnalysisConfig.invalidate({ tenantId: id });
    },
  });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState<"growth" | "pro" | "enterprise">("growth");
  const [configSaved, setConfigSaved] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const d = detail.data;
  const cfg = analysisConfigQuery.data;

  // Derive typed config values once loaded
  const cfgRecord = cfg as Record<string, unknown> | null | undefined;
  const lockedFields = safeParseLockedFields(cfgRecord?.adminLockedFields as string | null | undefined);

  // Sync notes from DB on load
  const notesFromDb = (cfgRecord?.adminNotes as string) ?? "";

  function getFieldValue(field: string): boolean {
    if (!cfgRecord) return true;
    const val = cfgRecord[field];
    // photoOnlyMode defaults to false; all others default to true
    if (val === undefined) return field === "photoOnlyMode" ? false : true;
    return Boolean(val);
  }

  function handleToggleField(field: string, value: boolean) {
    updateAnalysisConfig.mutate({
      tenantId: id,
      [field]: value,
    });
  }

  function handleToggleLock(field: string) {
    if (lockedFields.includes(field)) {
      unlockField.mutate({ tenantId: id, field });
    } else {
      lockField.mutate({ tenantId: id, field });
    }
  }

  function handleSaveNotes() {
    updateAnalysisConfig.mutate({
      tenantId: id,
      adminNotes: adminNotes || null,
    });
  }

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="border-b border-sable/20 pb-6 mb-8">
        <Link
          href="/admin/tenants"
          className="text-[10px] text-pierre uppercase tracking-wider font-light hover:text-carbone"
        >
          Tenants
        </Link>
        <span className="text-[10px] text-pierre mx-2">/</span>
        <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
          {d?.tenant.name ?? "Carregando..."}
        </span>
      </div>

      {detail.isLoading && (
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {detail.error && (
        <p className="text-sm text-pierre font-light">
          Erro ao carregar tenant: {detail.error.message}
        </p>
      )}

      {d && (
        <div className="space-y-8">
          {/* Top row: info + billing + actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info card */}
            <div className="lg:col-span-2 bg-white border border-sable/20 p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="font-serif text-2xl text-carbone">{d.tenant.name}</h1>
                  <p className="text-sm text-pierre font-light mt-1">{d.tenant.slug}</p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider font-light px-3 py-1 ${
                    statusConfig[d.tenant.status]?.classes ?? ""
                  }`}
                >
                  {statusConfig[d.tenant.status]?.label ?? d.tenant.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    Plano
                  </p>
                  <p className="text-sm text-carbone font-light mt-1">
                    {planLabels[d.tenant.plan] ?? d.tenant.plan}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    Criado em
                  </p>
                  <p className="text-sm text-carbone font-light mt-1">
                    {formatDate(d.tenant.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    Usuarios
                  </p>
                  <p className="text-sm text-carbone font-light mt-1">
                    {d.tenant._count.users}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    Produtos
                  </p>
                  <p className="text-sm text-carbone font-light mt-1">
                    {d.tenant._count.products}
                  </p>
                </div>
              </div>

              {/* Usage bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    Analises este periodo
                  </p>
                  <p className="text-xs text-pierre font-light">
                    {d.tenant.analysisUsed} / {d.tenant.analysisLimit}
                  </p>
                </div>
                <div className="h-1.5 bg-sable/20">
                  <div
                    className="h-1.5 bg-carbone transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        d.tenant.analysisLimit > 0
                          ? (d.tenant.analysisUsed / d.tenant.analysisLimit) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-pierre font-light mt-1">
                  {d.tenant.analysisLimit - d.tenant.analysisUsed} creditos restantes
                </p>
              </div>
            </div>

            {/* Billing + actions */}
            <div className="space-y-4">
              {/* Current bill */}
              <div className="bg-white border border-sable/20 p-6">
                <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
                  Fatura estimada
                </p>
                <p className="font-serif text-2xl text-carbone">
                  {formatBRL(d.currentBill?.total)}
                </p>
                {d.currentBill && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs text-pierre font-light">
                      <span>Mensalidade</span>
                      <span>{formatBRL(d.currentBill.baseFee)}</span>
                    </div>
                    {d.currentBill.excessCost > 0 && (
                      <div className="flex justify-between text-xs text-pierre font-light">
                        <span>Excedente</span>
                        <span>{formatBRL(d.currentBill.excessCost)}</span>
                      </div>
                    )}
                    {d.currentBill.commissionCost > 0 && (
                      <div className="flex justify-between text-xs text-pierre font-light">
                        <span>Comissao</span>
                        <span>{formatBRL(d.currentBill.commissionCost)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white border border-sable/20 p-6 space-y-3">
                <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
                  Acoes
                </p>

                <button
                  onClick={() => {
                    setNewPlan(d.tenant.plan as "growth" | "pro" | "enterprise");
                    setShowPlanModal(true);
                  }}
                  className="w-full px-4 py-2 border border-sable/30 text-sm text-carbone font-light hover:bg-ivoire/40 text-left"
                >
                  Alterar plano
                </button>

                {d.tenant.status === "active" && (
                  <button
                    onClick={() => {
                      if (confirm(`Pausar o tenant "${d.tenant.name}"?`)) {
                        changeStatus.mutate({ tenantId: id, status: "paused" });
                      }
                    }}
                    disabled={changeStatus.isPending}
                    className="w-full px-4 py-2 border border-sable/30 text-sm text-pierre font-light hover:bg-ivoire/40 text-left disabled:opacity-50"
                  >
                    Pausar acesso
                  </button>
                )}

                {d.tenant.status === "paused" && (
                  <button
                    onClick={() => {
                      if (confirm(`Reativar o tenant "${d.tenant.name}"?`)) {
                        changeStatus.mutate({ tenantId: id, status: "active" });
                      }
                    }}
                    disabled={changeStatus.isPending}
                    className="w-full px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
                  >
                    Ativar acesso
                  </button>
                )}

                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Resetar o contador de analises de "${d.tenant.name}" para zero?`
                      )
                    ) {
                      resetUsage.mutate({ tenantId: id });
                    }
                  }}
                  disabled={resetUsage.isPending}
                  className="w-full px-4 py-2 border border-sable/30 text-sm text-pierre font-light hover:bg-ivoire/40 text-left disabled:opacity-50"
                >
                  Resetar contador de uso
                </button>
              </div>
            </div>
          </div>

          {/* Change plan modal */}
          {showPlanModal && (
            <div className="fixed inset-0 bg-carbone/40 flex items-center justify-center z-50">
              <div className="bg-blanc-casse border border-sable/20 p-8 w-full max-w-sm">
                <h2 className="font-serif text-lg text-carbone mb-6">
                  Alterar plano
                </h2>
                <div className="space-y-3 mb-6">
                  {(["growth", "pro", "enterprise"] as const).map((p) => (
                    <label
                      key={p}
                      className={`flex items-center gap-3 p-3 border cursor-pointer ${
                        newPlan === p
                          ? "border-carbone bg-white"
                          : "border-sable/30 hover:bg-ivoire/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={p}
                        checked={newPlan === p}
                        onChange={() => setNewPlan(p)}
                        className="accent-carbone"
                      />
                      <span className="text-sm text-carbone font-light">
                        {planLabels[p]}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      changePlan.mutate({ tenantId: id, plan: newPlan });
                    }}
                    disabled={changePlan.isPending}
                    className="flex-1 px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
                  >
                    {changePlan.isPending ? "Salvando..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => setShowPlanModal(false)}
                    className="flex-1 px-4 py-2 border border-sable/30 text-sm text-pierre font-light"
                  >
                    Cancelar
                  </button>
                </div>
                {changePlan.error && (
                  <p className="text-xs text-pierre font-light mt-3">
                    {changePlan.error.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Admin: Configuracao de Analise ──────────────────────────────── */}
          <div>
            <h2 className="font-serif text-base text-carbone mb-1">
              Configuracao de Analise
            </h2>
            <p className="text-xs text-pierre font-light mb-4">
              Visualize e controle as configuracoes de analise deste tenant. Campos bloqueados nao podem ser alterados pelo tenant.
            </p>

            {analysisConfigQuery.isLoading && (
              <p className="text-sm text-pierre font-light">Carregando configuracao...</p>
            )}

            {cfg !== undefined && (
              <div className="bg-white border border-sable/20 overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-[1fr_100px_120px] border-b border-sable/20 bg-ivoire">
                  <div className="px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                    Campo
                  </div>
                  <div className="px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light text-center">
                    Estado
                  </div>
                  <div className="px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light text-center">
                    Bloqueio
                  </div>
                </div>

                <div className="divide-y divide-sable/10">
                  {TOGGLE_FIELDS.map(({ field, label, critical }) => {
                    const value = getFieldValue(field);
                    const isLocked = lockedFields.includes(field);
                    // For photoOnlyMode: "active" = danger; for the rest: "disabled" = danger
                    const isDangerous =
                      critical &&
                      (field === "photoOnlyMode" ? value === true : value === false);

                    return (
                      <div
                        key={field}
                        className={`grid grid-cols-[1fr_100px_120px] items-center ${
                          isDangerous ? "bg-ivoire/60" : ""
                        }`}
                      >
                        <div className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-carbone font-light">
                              {label}
                            </span>
                            {critical && (
                              <span className="text-[9px] text-pierre uppercase tracking-wider font-light px-1.5 py-0.5 border border-sable/30">
                                critico
                              </span>
                            )}
                          </div>
                          {isDangerous && (
                            <p className="text-[10px] text-terre font-light mt-0.5">
                              Configuracao critica desativada
                            </p>
                          )}
                        </div>

                        {/* Toggle current value */}
                        <div className="px-4 py-4 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleField(field, !value)}
                            disabled={updateAnalysisConfig.isPending}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer border transition-colors focus:outline-none disabled:opacity-40 ${
                              value
                                ? "bg-carbone border-carbone"
                                : "bg-sable/40 border-sable/40"
                            }`}
                            role="switch"
                            aria-checked={value}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform bg-blanc-casse transition-transform ${
                                value ? "translate-x-4" : "translate-x-0.5"
                              }`}
                              style={{ marginTop: "2px" }}
                            />
                          </button>
                        </div>

                        {/* Lock/unlock toggle */}
                        <div className="px-4 py-4 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleToggleLock(field)}
                            disabled={lockField.isPending || unlockField.isPending}
                            className={`text-[10px] uppercase tracking-wider font-light px-3 py-1 border transition-colors disabled:opacity-40 ${
                              isLocked
                                ? "border-carbone text-carbone bg-carbone/5 hover:bg-carbone/10"
                                : "border-sable/30 text-pierre hover:border-carbone hover:text-carbone"
                            }`}
                          >
                            {isLocked ? "Bloqueado" : "Livre"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Admin notes */}
                <div className="border-t border-sable/20 p-6">
                  <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
                    Notas internas
                  </p>
                  <textarea
                    value={adminNotes || notesFromDb}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Observacoes internas sobre as configuracoes deste tenant..."
                    rows={3}
                    className="w-full px-3 py-2 border border-sable/40 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-carbone resize-none"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updateAnalysisConfig.isPending}
                      className="px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
                    >
                      {updateAnalysisConfig.isPending ? "Salvando..." : "Salvar notas"}
                    </button>
                    {configSaved && (
                      <span className="text-xs text-pierre font-light">Salvo.</span>
                    )}
                    {updateAnalysisConfig.error && (
                      <span className="text-xs text-red-600 font-light">
                        {updateAnalysisConfig.error.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Users */}
          <div>
            <h2 className="font-serif text-base text-carbone mb-4">Usuarios</h2>
            <div className="bg-white border border-sable/20 overflow-hidden">
              {d.users.length === 0 ? (
                <p className="p-6 text-sm text-pierre font-light">
                  Nenhum usuario cadastrado neste tenant.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sable/20 bg-ivoire">
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Nome
                      </th>
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        E-mail
                      </th>
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Perfil
                      </th>
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Criado em
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sable/10">
                    {d.users.map((u) => (
                      <tr key={u.id} className="hover:bg-ivoire/40">
                        <td className="px-6 py-4 text-sm text-carbone font-light">
                          {u.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-pierre font-light">
                          {u.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                            {roleLabels[u.role] ?? u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-pierre font-light">
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent analyses */}
          <div>
            <h2 className="font-serif text-base text-carbone mb-4">
              Ultimas analises
            </h2>
            <div className="bg-white border border-sable/20 overflow-hidden">
              {d.recentAnalyses.length === 0 ? (
                <p className="p-6 text-sm text-pierre font-light">
                  Nenhuma analise realizada ainda.
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sable/20 bg-ivoire">
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Data
                      </th>
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Cliente
                      </th>
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Tipo de pele
                      </th>
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Condicoes
                      </th>
                      <th className="text-left px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Status
                      </th>
                      <th className="text-right px-6 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                        Latencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sable/10">
                    {d.recentAnalyses.map((a) => (
                      <tr key={a.id} className="hover:bg-ivoire/40">
                        <td className="px-6 py-4 text-xs text-pierre font-light whitespace-nowrap">
                          {formatDateTime(a.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-xs text-pierre font-light">
                          {a.clientName ?? a.clientEmail ?? "Anonimo"}
                        </td>
                        <td className="px-6 py-4 text-xs text-pierre font-light">
                          {a.skinType ?? "—"}
                        </td>
                        <td className="px-6 py-4 text-xs text-pierre font-light max-w-[200px] truncate">
                          {safeParseConditions(a.conditions)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] uppercase tracking-wider font-light text-pierre">
                            {a.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-pierre font-light text-right">
                          {a.latencyMs != null ? `${a.latencyMs}ms` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
