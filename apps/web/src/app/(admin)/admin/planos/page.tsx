"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PlanFormModal } from "./plan-form-modal";

type PlanRow = {
  id: string;
  name: string;
  monthlyPriceBRL: number;
  setupFeeBRL: number | null;
  analysisLimit: number;
  commissionRate: number;
  excessCostPerAnalysis: number;
  maxUsers: number;
  features: string;
  ctaText: string;
  visible: boolean;
  deprecated: boolean;
  customAllowed: boolean;
  displayOrder: number;
  stripePriceId: string | null;
  stripeSetupPriceId: string | null;
};

export default function AdminPlanosPage() {
  const utils = trpc.useUtils();
  const plans = trpc.plans.list.useQuery();
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [creating, setCreating] = useState(false);

  const archive = trpc.plans.archive.useMutation({
    onSuccess: () => utils.plans.list.invalidate(),
  });
  const unarchive = trpc.plans.unarchive.useMutation({
    onSuccess: () => utils.plans.list.invalidate(),
  });

  return (
    <div className="p-8">
      <div className="border-b border-sable/20 pb-6 mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl text-carbone">Planos</h1>
          <p className="text-sm text-pierre font-light mt-1">
            Gerencia precos, limites e features dos planos visiveis em /planos.
            Mudancas de preco criam novos Stripe Prices automaticamente —
            clientes existentes mantem o preco original.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-4 py-2 bg-carbone text-blanc-casse text-sm font-light tracking-wide"
        >
          Novo Plano
        </button>
      </div>

      {plans.isLoading && (
        <p className="text-sm text-pierre font-light">Carregando...</p>
      )}

      {plans.data && (
        <div className="bg-white border border-sable/20 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sable/20 bg-ivoire">
                <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Ordem
                </th>
                <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Plano
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Mensalidade
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Setup
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Limites
                </th>
                <th className="text-left px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sable/10">
              {plans.data.map((p) => (
                <tr key={p.id} className="hover:bg-ivoire/40">
                  <td className="px-4 py-3 text-sm text-pierre font-light">
                    {p.displayOrder}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-carbone font-light">{p.name}</div>
                    <div className="text-[10px] text-pierre/60 font-mono">{p.id}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-carbone font-light text-right">
                    {p.customAllowed ? (
                      <span className="text-pierre/60">Sob consulta</span>
                    ) : (
                      `R$ ${p.monthlyPriceBRL.toLocaleString("pt-BR")}/mes`
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-pierre font-light text-right">
                    {!p.setupFeeBRL || p.setupFeeBRL <= 0
                      ? "—"
                      : `R$ ${p.setupFeeBRL.toLocaleString("pt-BR")}`}
                  </td>
                  <td className="px-4 py-3 text-xs text-pierre font-light text-right whitespace-nowrap">
                    {p.analysisLimit.toLocaleString("pt-BR")} análises
                    <br />
                    {p.maxUsers} users · {(p.commissionRate * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-light px-2 py-0.5 inline-block w-fit ${
                          p.visible
                            ? "bg-carbone/10 text-carbone"
                            : "bg-sable/30 text-pierre"
                        }`}
                      >
                        {p.visible ? "Visivel" : "Oculto"}
                      </span>
                      {p.deprecated && (
                        <span className="text-[10px] uppercase tracking-wider font-light px-2 py-0.5 inline-block w-fit bg-terre/20 text-terre">
                          Descontinuado
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button
                      onClick={() => setEditing(p as PlanRow)}
                      className="text-xs text-carbone font-light hover:underline"
                    >
                      Editar
                    </button>
                    {p.deprecated ? (
                      <button
                        onClick={() => unarchive.mutate({ id: p.id })}
                        className="text-xs text-pierre font-light hover:underline"
                      >
                        Reativar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm(`Arquivar "${p.name}"? Tenants existentes nao sao afetados.`)) {
                            archive.mutate({ id: p.id });
                          }
                        }}
                        className="text-xs text-pierre font-light hover:underline"
                      >
                        Arquivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && (
        <PlanFormModal
          plan={editing}
          isCreate={creating}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            utils.plans.list.invalidate();
            setEditing(null);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
