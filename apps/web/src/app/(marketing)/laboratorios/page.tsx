import Link from "next/link";

export default function LaboratoriosPage() {
  return (
    <>
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Segmento · Laboratorios</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            Sua marca como recomendacao <i className="text-terre">dermatologica</i>.
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">
            Distribua o Skinner como ferramenta de ativacao para sua rede de PDVs e farmacias parceiras.
            O catalogo da marca aparece como recomendacao personalizada — nao como prateleira.
          </p>
        </div>
      </section>

      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-start">
          <div>
            <ul className="flex flex-col gap-3 mb-8">
              {["Painel master multi-rede", "Co-marketing com farmacias", "Atribuicao por SKU e por regiao", "Insights de demanda por bioma"].map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
            <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre transition-all inline-block mt-6">
              Falar com vendas →
            </Link>
          </div>
          <div className="p-8 border border-sable/30 bg-white">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Resultados tipicos</p>
            <div className="space-y-6">
              {[["+47%", "sell-out em 90 dias"], ["380+", "pontos ativados"], ["R$ 1.2M", "GMV atribuido / mes"]].map(([n, l], i) => (
                <div key={i} className="border-b border-sable/20 pb-4">
                  <b className="font-serif text-4xl italic text-carbone block leading-none">{n}</b>
                  <span className="text-sm text-pierre font-light mt-2 block">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-16">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Implementacao</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              14 dias do contrato ao primeiro <i className="text-terre">relatorio</i>.
            </h2>
          </div>
          <div className="space-y-4 max-w-2xl mx-auto">
            {[
              { d: "Dia 1—2", t: "Setup tecnico", x: "Subdominio, marca branca, primeiros usuarios" },
              { d: "Dia 3—5", t: "Catalogo", x: "Importacao e mapeamento de SKUs e ingredientes" },
              { d: "Dia 6—9", t: "Treinamento", x: "2h de onboarding pro time + material assincrono" },
              { d: "Dia 10—14", t: "Piloto", x: "Primeiras 50 analises com acompanhamento de CSM" },
              { d: "Mes 2", t: "Otimizacao", x: "Revisao de funil + ajuste de match score" },
            ].map((x, i) => (
              <div key={i} className="flex gap-6 items-start p-5 border border-sable/30">
                <span className="font-mono text-[10px] tracking-[0.1em] text-pierre uppercase w-20 flex-shrink-0 pt-1">{x.d}</span>
                <div>
                  <h4 className="font-serif text-base text-carbone">{x.t}</h4>
                  <p className="text-sm text-pierre font-light mt-1">{x.x}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
