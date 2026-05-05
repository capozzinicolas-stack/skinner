"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

type Plan = {
  id: string;
  name: string;
  monthlyPriceBRL: number;
  setupFeeBRL: number | null;
  analysisLimit: number;
  commissionRate: number;
  excessCostPerAnalysis: number;
  maxUsers: number;
  maxChannels: number;
  allowIdentityLimit?: boolean;
  features: string;
  ctaText: string;
  visible: boolean;
  deprecated: boolean;
  customAllowed: boolean;
  displayOrder: number;
};

type FormState = {
  id: string;
  name: string;
  monthlyPriceBRL: string;
  setupFeeBRL: string;
  analysisLimit: string;
  commissionPct: string; // user-friendly % (commissionRate * 100)
  excessCostPerAnalysis: string;
  maxUsers: string;
  maxChannels: string;
  allowIdentityLimit: boolean;
  features: string; // newline-separated
  ctaText: string;
  visible: boolean;
  deprecated: boolean;
  customAllowed: boolean;
  displayOrder: string;
  applyToExistingTenants: boolean;
};

function planToForm(p: Plan): FormState {
  let features: string[] = [];
  try {
    const parsed = JSON.parse(p.features);
    if (Array.isArray(parsed)) features = parsed;
  } catch {
    /* noop */
  }
  return {
    id: p.id,
    name: p.name,
    monthlyPriceBRL: String(p.monthlyPriceBRL),
    setupFeeBRL: p.setupFeeBRL == null ? "" : String(p.setupFeeBRL),
    analysisLimit: String(p.analysisLimit),
    commissionPct: String(p.commissionRate * 100),
    excessCostPerAnalysis: String(p.excessCostPerAnalysis),
    maxUsers: String(p.maxUsers),
    maxChannels: String((p as { maxChannels?: number }).maxChannels ?? 1),
    allowIdentityLimit: !!(p as { allowIdentityLimit?: boolean }).allowIdentityLimit,
    features: features.join("\n"),
    ctaText: p.ctaText,
    visible: p.visible,
    deprecated: p.deprecated,
    customAllowed: p.customAllowed,
    displayOrder: String(p.displayOrder),
    applyToExistingTenants: false,
  };
}

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  monthlyPriceBRL: "",
  setupFeeBRL: "",
  analysisLimit: "200",
  commissionPct: "3",
  excessCostPerAnalysis: "0",
  maxUsers: "2",
  maxChannels: "1",
  allowIdentityLimit: false,
  features: "",
  ctaText: "Inscrever-se",
  visible: true,
  deprecated: false,
  customAllowed: false,
  displayOrder: "10",
  applyToExistingTenants: false,
};

export function PlanFormModal({
  plan,
  isCreate,
  onClose,
  onSaved,
}: {
  plan: Plan | null;
  isCreate: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(plan ? planToForm(plan) : EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [showImpactWarning, setShowImpactWarning] = useState(false);

  // Live tenant count for the impact warning, only in edit mode
  const tenantsCount = trpc.plans.tenantsCount.useQuery(
    { id: plan?.id ?? "" },
    { enabled: !!plan }
  );

  useEffect(() => {
    if (plan) setForm(planToForm(plan));
  }, [plan]);

  const createMutation = trpc.plans.create.useMutation({
    onSuccess: () => onSaved(),
    onError: (err) => setError(err.message),
  });
  const updateMutation = trpc.plans.update.useMutation({
    onSuccess: () => onSaved(),
    onError: (err) => setError(err.message),
  });

  function buildPayload() {
    const featuresArr = form.features
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const setup = form.setupFeeBRL.trim() === "" ? null : Number(form.setupFeeBRL);
    return {
      name: form.name,
      monthlyPriceBRL: Number(form.monthlyPriceBRL || 0),
      setupFeeBRL: setup,
      analysisLimit: Number(form.analysisLimit),
      commissionRate: Number(form.commissionPct) / 100,
      excessCostPerAnalysis: Number(form.excessCostPerAnalysis),
      maxUsers: Number(form.maxUsers),
      maxChannels: Number(form.maxChannels),
      allowIdentityLimit: form.allowIdentityLimit,
      features: featuresArr,
      ctaText: form.ctaText,
      visible: form.visible,
      deprecated: form.deprecated,
      customAllowed: form.customAllowed,
      displayOrder: Number(form.displayOrder),
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isCreate) {
      if (!/^[a-z0-9-]+$/.test(form.id)) {
        setError("ID deve usar apenas letras minusculas, numeros e hifens.");
        return;
      }
      createMutation.mutate({ id: form.id, ...buildPayload() });
      return;
    }

    if (!plan) return;

    // Detect changes that affect existing tenants
    const limitsChanged =
      Number(form.analysisLimit) !== plan.analysisLimit ||
      Number(form.commissionPct) / 100 !== plan.commissionRate ||
      Number(form.maxUsers) !== plan.maxUsers ||
      Number(form.excessCostPerAnalysis) !== plan.excessCostPerAnalysis;

    if (
      limitsChanged &&
      form.applyToExistingTenants &&
      !showImpactWarning
    ) {
      setShowImpactWarning(true);
      return;
    }

    updateMutation.mutate({
      id: plan.id,
      ...buildPayload(),
      applyToExistingTenants: form.applyToExistingTenants,
    });
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div
      className="fixed inset-0 z-50 bg-carbone/60 flex items-start justify-center overflow-y-auto py-12 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-sable max-w-2xl w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-sable/30">
          <div>
            <h2 className="font-serif text-xl text-carbone">
              {isCreate ? "Novo plano" : `Editar plano: ${plan?.name}`}
            </h2>
            {!isCreate && (
              <p className="text-xs text-pierre font-light mt-1">
                ID: <code className="bg-ivoire px-1.5">{plan?.id}</code> · imutavel
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-pierre hover:text-carbone text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isCreate && (
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                ID (slug)
              </label>
              <input
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="ex: starter, premium, black-friday"
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-mono focus:outline-none focus:border-pierre"
              />
              <p className="text-[10px] text-pierre/70 font-light mt-1">
                Apenas letras minusculas, numeros e hifens. Imutavel apos criar.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Nome publico
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Texto do botao
              </label>
              <input
                value={form.ctaText}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-carbone font-light">
            <input
              type="checkbox"
              checked={form.customAllowed}
              onChange={(e) => setForm({ ...form, customAllowed: e.target.checked })}
              className="w-4 h-4"
            />
            Plano customizado (Sob consulta) — sem Stripe Price, signup nao publico
          </label>

          <label className="flex items-center gap-3 text-sm text-carbone font-light">
            <input
              type="checkbox"
              checked={form.allowIdentityLimit}
              onChange={(e) => setForm({ ...form, allowIdentityLimit: e.target.checked })}
              className="w-4 h-4"
            />
            Permite limites por identidade do paciente (anti-abuso por canal)
          </label>

          {!form.customAllowed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                  Mensalidade (R$)
                </label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={form.monthlyPriceBRL}
                  onChange={(e) => setForm({ ...form, monthlyPriceBRL: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
                />
              </div>
              <div>
                <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                  Setup fee (R$, vazio = sem setup)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.setupFeeBRL}
                  onChange={(e) => setForm({ ...form, setupFeeBRL: e.target.value })}
                  className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Limite analises/mes
              </label>
              <input
                type="number"
                min={1}
                value={form.analysisLimit}
                onChange={(e) => setForm({ ...form, analysisLimit: e.target.value })}
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Comissao (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={form.commissionPct}
                onChange={(e) => setForm({ ...form, commissionPct: e.target.value })}
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Max usuarios
              </label>
              <input
                type="number"
                min={1}
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: e.target.value })}
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Max canais
              </label>
              <input
                type="number"
                min={1}
                value={form.maxChannels}
                onChange={(e) => setForm({ ...form, maxChannels: e.target.value })}
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
              <p className="text-[10px] text-pierre/70 font-light mt-1">
                Numero maximo de canais (links/QRs/embeds) que o tenant pode criar.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Custo por analise excedente (R$)
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.excessCostPerAnalysis}
              onChange={(e) => setForm({ ...form, excessCostPerAnalysis: e.target.value })}
              required
              className="w-full max-w-xs px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
            />
            <p className="text-[10px] text-pierre/70 font-light mt-1">
              Atualmente nao cobrado automaticamente — usado para projecao de fatura.
            </p>
          </div>

          <div>
            <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
              Features (uma por linha)
            </label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              rows={6}
              required
              className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              placeholder="200 analises/mes&#10;Link direto + QR code&#10;..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
                Ordem de display
              </label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                required
                className="w-full px-3 py-2 border border-sable/30 bg-blanc-casse text-sm text-carbone font-light focus:outline-none focus:border-pierre"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-carbone font-light pt-5">
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                className="w-4 h-4"
              />
              Visivel em /planos
            </label>
            <label className="flex items-center gap-2 text-sm text-carbone font-light pt-5">
              <input
                type="checkbox"
                checked={form.deprecated}
                onChange={(e) => setForm({ ...form, deprecated: e.target.checked })}
                className="w-4 h-4"
              />
              Descontinuado
            </label>
          </div>

          {!isCreate && (
            <div className="border-t border-sable/30 pt-4">
              <label className="flex items-start gap-3 text-sm text-carbone font-light">
                <input
                  type="checkbox"
                  checked={form.applyToExistingTenants}
                  onChange={(e) =>
                    setForm({ ...form, applyToExistingTenants: e.target.checked })
                  }
                  className="mt-1 w-4 h-4"
                />
                <span>
                  Aplicar mudancas de limites aos {tenantsCount.data?.count ?? "..."} tenant(s) que ja
                  estao neste plano.
                  <br />
                  <span className="text-xs text-pierre">
                    Por padrao: NAO aplicar (grandfathering — clientes existentes mantem os
                    limites originais do momento da contratacao).
                  </span>
                </span>
              </label>
            </div>
          )}

          {showImpactWarning && (
            <div className="p-4 bg-ivoire border border-sable">
              <p className="text-sm text-carbone font-light">
                Esta acao vai atualizar os limites de{" "}
                <strong>{tenantsCount.data?.count ?? "?"} tenant(s)</strong> que estao
                neste plano. Eles vao receber os novos limites IMEDIATAMENTE.
              </p>
              <p className="text-xs text-pierre font-light mt-2">
                Se vai REDUZIR limites, considere notificar os tenants antes.
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowImpactWarning(false)}
                  className="px-4 py-2 border border-sable text-pierre text-xs font-light"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-terre text-blanc-casse text-xs font-light"
                >
                  Confirmar e aplicar
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-terre font-light">{error}</p>
          )}

          {!showImpactWarning && (
            <div className="flex items-center gap-3 pt-4 border-t border-sable/30">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide disabled:opacity-50"
              >
                {isPending ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-sable text-pierre text-sm font-light"
              >
                Cancelar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
