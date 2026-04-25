import Link from "next/link";

const techGrid = [
  { t: "LGPD nativo", d: "DPO dedicado, ANPD-compliant, foto descartada por padrao." },
  { t: "Multi-tenant", d: "Marca branca completa: dominio, cores, tipografia, copy." },
  { t: "API REST + Webhooks", d: "Eventos de analise, recomendacao e venda em tempo real." },
  { t: "WhatsApp nativo", d: "Captura e relatorio direto pelo Business API oficial." },
  { t: "Pix + cartao", d: "Stripe, Pagar.me, Mercado Pago, Asaas integrados." },
  { t: "Datacenter SP", d: "Infraestrutura em Sao Paulo. Latencia < 80ms em todo o Brasil." },
];

export default function ComoFuncionaPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Produto · v1.0</p>
          <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
            Como o <i className="text-terre">Skinner</i> funciona.
          </h1>
          <p className="text-lg font-light text-terre mt-6 leading-relaxed max-w-[620px]">
            Quatro etapas. Tres minutos. Um diagnostico que fecha venda. Veja por dentro do
            motor de IA, do relatorio do paciente e do painel do gestor.
          </p>
        </div>
      </section>

      {/* 01 — Captura */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-center">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">01 — Captura</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              Foto, questionario, <i className="text-terre">contexto</i>.
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">
              Em qualquer canal — site, tablet do PDV, WhatsApp, app da clinica. Captura
              otimizada por orientacao visual de iluminacao e enquadramento.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "Orientacao ao vivo de iluminacao e angulo",
                "Deteccao automatica de fototipo Fitzpatrick",
                "Foto descartada apos analise (LGPD-friendly)",
                "Funciona offline e sincroniza depois",
              ].map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-pierre/25 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.18)] overflow-hidden">
            <div className="h-8 bg-ivoire flex items-center px-3 gap-1.5 border-b border-pierre/20">
              <span className="w-2 h-2 rounded-full bg-sable/70" /><span className="w-2 h-2 rounded-full bg-sable/70" /><span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="font-mono text-[9px] text-pierre mx-auto tracking-[0.04em]">analise.skinner.lat/captura</span>
            </div>
            <div className="p-8 flex gap-6">
              <div className="relative w-[48%] min-h-[380px] bg-ivoire">
                <div className="absolute inset-6 border border-dashed border-pierre/40" />
                <span className="absolute top-4 left-4 font-mono text-[9px] tracking-[0.1em] text-terre">CAPTURA · LIVE</span>
                <span className="absolute bottom-4 left-4 font-mono text-[9px] text-terre">ILUMINACAO ✓</span>
                <span className="absolute bottom-4 right-4 font-mono text-[9px] text-terre">ANGULO ✓</span>
              </div>
              <div className="flex-1">
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-1">Questionario · 3/7</p>
                <h3 className="font-serif text-[22px] italic text-carbone mt-1.5 mb-[18px]">Como sua pele se comporta no fim do dia?</h3>
                {["Brilha em testa, nariz e queixo", "Brilha em todo o rosto", "Fica repuxada, sem brilho", "Sem alteracao"].map((q, i) => (
                  <label key={i} className={`flex items-center gap-3 px-4 py-3.5 border border-pierre/20 mb-2 text-[13px] text-carbone ${i === 0 ? "bg-ivoire" : "bg-white"}`}>
                    <span className={`w-3.5 h-3.5 rounded-full border border-sable ${i === 0 ? "bg-carbone" : "bg-white"}`} />
                    {q}
                  </label>
                ))}
                <button className="mt-4 px-[22px] py-3 bg-carbone text-blanc-casse text-[13px] tracking-[0.02em]">Continuar →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — Analise */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-20 items-center">
          <div className="order-2 lg:order-1">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">02 — Analise</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              IA proprietaria treinada em <i className="text-terre">847k</i> imagens.
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">
              Modelo dermatologico proprio, validado clinicamente, que classifica condicoes
              em escala de 5 niveis e gera um match score por produto do seu catalogo.
            </p>
            <div className="grid grid-cols-2 border-t border-l border-sable/40">
              {[
                { v: "847k", l: "imagens de treino" },
                { v: "23", l: "condicoes detectadas" },
                { v: "0.94", l: "F1-score validado" },
                { v: "1.8s", l: "tempo de inferencia" },
              ].map((s, i) => (
                <div key={i} className="p-5 border-b border-r border-sable/40">
                  <b className="font-serif text-[32px] italic text-carbone block leading-none">{s.v}</b>
                  <span className="text-[11px] text-pierre block mt-2 leading-snug">{s.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Recomendacao */}
      <section className="py-24 px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-center">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">03 — Recomendacao</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              Seu catalogo, <i className="text-terre">inteligente</i>.
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">
              Faz upload do catalogo (CSV, integracao com ERP ou marketplace). O motor cruza
              ingredientes, indicacoes e contraindicacoes com cada analise.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                "142 atributos por SKU avaliados",
                "Filtro automatico de contraindicacao",
                "Ordenacao por match score + estoque + margem",
                "Integracao Bling, Tiny, Linx, VTEX, Shopify",
              ].map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Stack tecnica */}
      <section className="py-24 px-8 bg-white">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Stack tecnica</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              Construido pra <i className="text-terre">escalar</i> no Brasil.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {techGrid.map((x, i) => (
              <div key={i} className="p-8 border border-sable/40 bg-blanc-casse">
                <span className="font-mono text-[10px] tracking-[0.12em] text-sable">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-serif text-xl text-carbone mt-3 mb-2">{x.t}</h3>
                <p className="text-[13px] text-pierre font-light leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-ivoire border-t border-sable/40">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Proximo passo</p>
          <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
            Veja na <i className="text-terre">pratica</i>.
          </h2>
          <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre transition-all inline-block">
            Solicitar demo →
          </Link>
        </div>
      </section>
    </>
  );
}
