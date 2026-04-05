"use client";

import { trpc } from "@/lib/trpc/client";

export default function BillingPage() {
  const utils = trpc.useUtils();
  const billing = trpc.billing.status.useQuery();
  const plans = trpc.billing.plans.useQuery();
  const changePlan = trpc.billing.changePlan.useMutation({
    onSuccess: () => {
      utils.billing.status.invalidate();
      utils.dashboard.stats.invalidate();
    },
  });
  const usageHistory = trpc.billing.usageHistory.useQuery();

  if (billing.isLoading) return <div className="p-8 text-pierre font-light">Carregando...</div>;
  if (!billing.data) return null;

  const b = billing.data;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-serif text-2xl text-carbone">Faturamento</h1>
      <p className="text-pierre text-sm font-light mt-1">
        Gerencie seu plano, creditos e cobrancas.
      </p>

      {/* Current plan + usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-6 bg-white border border-sable/20">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">Plano atual</p>
          <p className="text-2xl font-serif text-carbone mt-2">{b.planName}</p>
          {b.currentBill.baseFee > 0 && (
            <p className="text-sm text-pierre font-light mt-1">
              R$ {b.currentBill.baseFee.toLocaleString("pt-BR")}/mes
            </p>
          )}
        </div>
        <div className="p-6 bg-white border border-sable/20">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">Creditos</p>
          <p className="text-2xl font-serif text-carbone mt-2">
            {b.analysisUsed} / {b.analysisLimit}
          </p>
          <div className="w-full h-1 bg-sable/20 mt-3">
            <div
              className="h-full bg-carbone transition-all"
              style={{ width: `${Math.min((b.analysisUsed / b.analysisLimit) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-pierre font-light mt-1">
            {b.creditsRemaining} restantes
          </p>
        </div>
        <div className="p-6 bg-white border border-sable/20">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">Fatura estimada</p>
          <p className="text-2xl font-serif text-carbone mt-2">
            R$ {b.currentBill.total.toFixed(2)}
          </p>
          <div className="text-xs text-pierre font-light mt-2 space-y-0.5">
            <p>Base: R$ {b.currentBill.baseFee.toFixed(2)}</p>
            {b.currentBill.excessCost > 0 && (
              <p>Excedente ({b.currentBill.excessAnalyses} analises): R$ {b.currentBill.excessCost.toFixed(2)}</p>
            )}
            {b.currentBill.commissionCost > 0 && (
              <p>Comissao ({(b.commissionRate * 100).toFixed(0)}%): R$ {b.currentBill.commissionCost.toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Plans comparison */}
      <div className="mt-12">
        <h2 className="font-serif text-lg text-carbone mb-4">Planos disponiveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.data?.map((plan) => {
            const isCurrent = plan.id === b.plan;
            return (
              <div
                key={plan.id}
                className={`p-6 bg-white border ${isCurrent ? "border-carbone" : "border-sable/20"}`}
              >
                <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  {isCurrent ? "Plano atual" : "\u00A0"}
                </p>
                <h3 className="font-serif text-xl text-carbone mt-1">{plan.name}</h3>
                <p className="text-lg text-carbone mt-2">
                  {plan.monthlyPrice ? `R$ ${plan.monthlyPrice.toLocaleString("pt-BR")}` : "Sob consulta"}
                  {plan.monthlyPrice && <span className="text-xs text-pierre font-light">/mes</span>}
                </p>
                {plan.setupFee && (
                  <p className="text-xs text-pierre font-light">
                    Setup: R$ {plan.setupFee.toLocaleString("pt-BR")}
                  </p>
                )}
                <ul className="mt-4 space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-pierre font-light">{f}</li>
                  ))}
                </ul>
                {!isCurrent && plan.monthlyPrice && (
                  <button
                    onClick={() => {
                      if (confirm(`Mudar para o plano ${plan.name}?`)) {
                        changePlan.mutate({ planId: plan.id as any });
                      }
                    }}
                    disabled={changePlan.isPending}
                    className="w-full mt-6 py-2.5 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre disabled:opacity-50 transition-colors"
                  >
                    {changePlan.isPending ? "Alterando..." : "Mudar plano"}
                  </button>
                )}
                {isCurrent && (
                  <div className="w-full mt-6 py-2.5 text-center text-xs text-pierre font-light border border-sable/30">
                    Plano ativo
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage history */}
      {usageHistory.data && usageHistory.data.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-lg text-carbone mb-4">Historico de uso</h2>
          <div className="bg-white border border-sable/20 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sable/20 bg-ivoire/50">
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Data</th>
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Tipo</th>
                  <th className="text-left px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Qtd</th>
                  <th className="text-right px-5 py-3 text-[10px] text-pierre uppercase tracking-wider font-light">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sable/10">
                {usageHistory.data.slice(0, 20).map((event) => (
                  <tr key={event.id} className="hover:bg-ivoire/30">
                    <td className="px-5 py-3 text-sm text-carbone font-light">
                      {new Date(event.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-sm text-carbone font-light">
                      {event.type === "analysis" ? "Analise" : event.type === "commission" ? "Comissao" : event.type}
                    </td>
                    <td className="px-5 py-3 text-sm text-pierre font-light">{event.quantity}</td>
                    <td className="px-5 py-3 text-sm text-carbone font-light text-right">
                      {event.total ? `R$ ${event.total.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
