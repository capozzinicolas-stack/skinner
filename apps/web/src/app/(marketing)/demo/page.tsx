import Link from "next/link";

export default function DemoPage() {
  return (
    <>
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Resultados · base ativa Q1/2026</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            Os <i className="text-terre">números</i>.<br />Sem floreio.
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">
            47 clientes ativos · 218.000 análises geradas · R$ 14.6M em GMV atribuído acumulado nos últimos 12 meses.
          </p>
        </div>
      </section>

      {/* Big stats */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-sable/30">
            {[
              { v: "+38%", l: "conversão recomendação → venda\nvs. baseline humano" },
              { v: "2.4x", l: "ticket médio skincare\nanálise vs. sem análise" },
              { v: "91%", l: "NPS do consumidor final\npós-análise (n=42k)" },
              { v: "R$ 14.6M", l: "GMV atribuído acumulado\núltimos 12 meses" },
            ].map((s, i) => (
              <div key={i} className="p-9 border-b border-r border-sable/30">
                <b className="font-serif text-[clamp(48px,5vw,80px)] italic text-carbone leading-none block">{s.v}</b>
                <span className="text-xs text-pierre mt-4 block leading-snug whitespace-pre-line">{s.l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case studies */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-16">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Estudos de caso</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              Como nossos clientes <i className="text-terre">medem</i>.
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                eyebrow: "Clínica · São Paulo · 4 unidades",
                title: 'Pele Bela aumentou 3.1x a venda de produto por consulta.',
                stats: [["3.1x", "venda / consulta"], ["R$ 287k", "receita atribuída / mês"], ["4 meses", "até 100% das unidades"]],
                quote: "Skinner virou parte do nosso pré-atendimento. A paciente já chega entendendo a própria pele.",
                author: "Dra. Helena Rocha, diretora",
              },
              {
                eyebrow: "Laboratório dermatológico · NDA",
                title: "+47% de sell-out em 90 dias na rede ativada.",
                stats: [["+47%", "sell-out em 90 dias"], ["380", "farmácias ativadas"], ["R$ 1.2M", "GMV atribuído / mês"]],
                quote: "Atribuição clara por SKU acabou com a discussão interna sobre eficácia de trade.",
                author: "Rafael Andrade, VP Comercial",
              },
              {
                eyebrow: "Rede de farmácias · Nordeste · 62 unidades",
                title: 'Ticket de skincare 2.7x maior em clientes que fizeram análise.',
                stats: [["2.7x", "ticket médio skincare"], ["62%", "taxa de cross-sell"], ["9.2/10", "NPS do atendente"]],
                quote: "O tablet vira o gatilho da conversa. A análise fecha a venda.",
                author: "Diretora de Operações",
              },
            ].map((c, i) => (
              <article key={i} className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-8 border border-sable/30 overflow-hidden">
                <div className="aspect-[4/3] lg:aspect-auto bg-gradient-to-br from-ivoire to-[#d6cabb] flex items-center justify-center">
                  <span className="font-mono text-[9px] tracking-[0.08em] text-terre uppercase px-3 py-1 bg-white/80 border border-pierre/20">{c.eyebrow.split("·")[0].trim()}</span>
                </div>
                <div className="p-8">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-2">{c.eyebrow}</p>
                  <h3 className="font-serif text-[28px] text-carbone leading-snug mb-4">{c.title}</h3>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {c.stats.map(([n, l], j) => (
                      <div key={j}>
                        <b className="font-serif text-2xl italic text-carbone block leading-none">{n}</b>
                        <span className="text-[11px] text-pierre block mt-1">{l}</span>
                      </div>
                    ))}
                  </div>
                  <p className="font-serif text-base italic text-terre leading-relaxed border-t border-sable/30 pt-4">
                    "{c.quote}"<br />
                    <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-pierre not-italic mt-1 inline-block">— {c.author}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-ivoire border-t border-sable/40">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
            Quer resultados <i className="text-terre">assim</i>?
          </h2>
          <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre transition-all inline-block mt-8">
            Solicitar demo →
          </Link>
        </div>
      </section>
    </>
  );
}
