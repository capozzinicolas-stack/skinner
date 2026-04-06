import Link from "next/link";
import { PLANS } from "@/lib/billing/plans";

export default function PlanosPage() {
  const planEntries = Object.entries(PLANS);

  return (
    <section className="py-20 px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">Precos</p>
          <h1 className="font-serif text-4xl text-carbone italic">Planos</h1>
          <p className="text-pierre font-light mt-4 max-w-md mx-auto">
            Escolha o plano ideal para o seu negocio. Todos incluem analise por IA,
            relatorios PDF e suporte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planEntries.map(([id, plan]) => (
            <div key={id} className={`p-8 bg-white border ${id === "growth" ? "border-carbone" : "border-sable/20"}`}>
              {id === "growth" && (
                <p className="text-[10px] text-carbone uppercase tracking-wider mb-2">Mais popular</p>
              )}
              <h2 className="font-serif text-2xl text-carbone">{plan.name}</h2>
              <div className="mt-4">
                {plan.monthlyPrice ? (
                  <>
                    <span className="text-3xl font-serif text-carbone">
                      R$ {plan.monthlyPrice.toLocaleString("pt-BR")}
                    </span>
                    <span className="text-sm text-pierre font-light">/mes</span>
                    {plan.setupFee && (
                      <p className="text-xs text-pierre font-light mt-1">
                        Setup: R$ {plan.setupFee.toLocaleString("pt-BR")} (unico)
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-2xl font-serif text-carbone">Sob consulta</p>
                )}
              </div>
              <div className="w-full h-px bg-sable/20 my-6" />
              <ul className="space-y-3">
                {plan.features.map((f, i) => (
                  <li key={i} className="text-sm text-pierre font-light">{f}</li>
                ))}
              </ul>
              <div className="mt-8">
                {plan.monthlyPrice ? (
                  <Link
                    href="/contato"
                    className={`block text-center py-3 text-sm font-light tracking-wide transition-colors ${
                      id === "growth"
                        ? "bg-carbone text-blanc-casse hover:bg-terre"
                        : "border border-sable text-terre hover:bg-ivoire"
                    }`}
                  >
                    Comecar agora
                  </Link>
                ) : (
                  <Link
                    href="/contato"
                    className="block text-center py-3 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire transition-colors"
                  >
                    Falar com vendas
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / extra info */}
        <div className="mt-16 max-w-2xl mx-auto space-y-6">
          <div className="p-6 bg-white border border-sable/20">
            <h3 className="text-sm text-carbone mb-2">Comissao por venda</h3>
            <p className="text-xs text-pierre font-light leading-relaxed">
              A comissao e cobrada apenas sobre vendas confirmadas geradas pela recomendacao Skinner.
              Starter: 3%, Growth: 2%, Enterprise: 1%. Rastreamento automatico via pixel.
            </p>
          </div>
          <div className="p-6 bg-white border border-sable/20">
            <h3 className="text-sm text-carbone mb-2">Sem contrato de permanencia</h3>
            <p className="text-xs text-pierre font-light leading-relaxed">
              Cancele a qualquer momento. Seus dados sao exportaveis e o acesso
              ao historico de analises e mantido por 30 dias apos o cancelamento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
