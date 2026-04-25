import Link from "next/link";

const steps = [
  { n: "01", t: "Questionario", d: "7 perguntas sobre tipo de pele, preocupacoes e objetivos." },
  { n: "02", t: "Foto facial", d: "Frontal com boa luz. Processada e descartada apos analise." },
  { n: "03", t: "Analise IA", d: "Identifica condicoes, severidade e estado da barreira cutanea." },
  { n: "04", t: "Recomendacao", d: "Produtos do seu catalogo, ordenados por match score." },
];

const segments = [
  { num: "I", title: "Laboratorios", desc: "Seu catalogo virando recomendacao personalizada em milhares de pontos de contato — direto na ponta com o consumidor final.", href: "/laboratorios", feat: false },
  { num: "II", title: "Clinicas", desc: "Diagnostico IA antes da consulta: o paciente chega 70% mais educado e a venda do tratamento fica muito mais fluida.", href: "/clinicas", feat: true },
  { num: "III", title: "Farmacias", desc: "Tablet no balcao. Analise em 3 minutos. Ticket medio de skincare 2.4x maior comparado a clientes sem analise.", href: "/farmacias", feat: false },
];

const stats = [
  { value: "+38%", label: "conversao recomendacao → venda\nvs. baseline humano" },
  { value: "2.4x", label: "ticket medio em skincare\ncom analise vs. sem analise" },
  { value: "0.87", label: "match score medio\n(escala 0—1)" },
  { value: "91%", label: "satisfacao do consumidor final\nNPS pos-analise" },
];

const quotes = [
  { text: "Em 4 meses o Skinner virou o nosso melhor canal de venda de skincare. A conversao por sessao e 3x a da abordagem tradicional.", author: "Dra. Helena Rocha", role: "Diretora · Clinica Pele Bela · SP" },
  { text: "Consegui ativar 380 farmacias em 6 meses. O painel de atribuicao mata qualquer discussao sobre ROI no comite.", author: "Rafael Andrade", role: "VP Comercial · Laboratorio (NDA)" },
];

const hlStats = [
  { value: "1.842", label: "analises / mes (media growth)" },
  { value: "8.9%", label: "taxa de conversao recomend → venda" },
  { value: "R$ 47k", label: "receita atribuida media / mes" },
  { value: "+38%", label: "vs. recomendacao humana" },
];

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="pt-20 pb-0">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Copy */}
          <div className="max-w-[540px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">
              Inteligencia dermatologica · pt-BR
            </p>
            <h1 className="font-serif text-[clamp(48px,7vw,84px)] leading-[1.02] tracking-[-0.015em] text-carbone">
              A pele e <i className="text-terre">dados</i>.<br />Nos lemos.
            </h1>
            <p className="text-lg font-light text-terre mt-6 leading-relaxed">
              IA que analisa a pele em 3 minutos, recomenda produtos do seu catalogo
              e mede a venda. Para clinicas, farmacias e laboratorios no Brasil.
            </p>
            <div className="flex gap-3 mt-8 flex-wrap">
              <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre hover:-translate-y-px transition-all">
                Solicitar demo →
              </Link>
              <Link href="/como-funciona" className="px-7 py-4 border border-sable text-carbone text-sm hover:bg-ivoire hover:border-carbone transition-all">
                Ver o produto
              </Link>
            </div>
            {/* Strip stats */}
            <div className="flex items-center gap-5 mt-12 pt-7 border-t border-sable/40">
              {[
                { v: "+38%", l: "conversao media" },
                { v: "3 min", l: "analise completa" },
                { v: "0.87", l: "match score IA" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-5">
                  {i > 0 && <div className="w-px h-8 bg-sable/50" />}
                  <div className="flex flex-col">
                    <b className="font-serif text-[28px] italic text-carbone leading-none">{s.v}</b>
                    <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-pierre mt-1">{s.l}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — cards stack */}
          <div className="relative h-[560px] p-8 hidden lg:block">
            {/* Crosshairs */}
            <span className="absolute top-0 left-0 w-3 h-3 border border-sable/60" />
            <span className="absolute top-0 right-0 w-3 h-3 border border-sable/60" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border border-sable/60" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border border-sable/60" />

            {/* Face card */}
            <div className="absolute top-4 left-4 w-[62%] bg-white border border-pierre/20 p-4 z-[1]">
              <div className="aspect-[4/5] bg-gradient-to-b from-ivoire to-[#e0d8cc] border border-pierre/15 relative flex items-center justify-center">
                <svg viewBox="0 0 200 240" width="60%" style={{position:'absolute', opacity:0.65}}>
                  <ellipse cx="100" cy="120" rx="58" ry="78" fill="none" stroke="#3D342C" strokeWidth="1" strokeDasharray="3 4"/>
                  <line x1="100" y1="20" x2="100" y2="50" stroke="#3D342C" strokeWidth="1"/>
                  <line x1="100" y1="190" x2="100" y2="220" stroke="#3D342C" strokeWidth="1"/>
                  <line x1="20" y1="120" x2="42" y2="120" stroke="#3D342C" strokeWidth="1"/>
                  <line x1="158" y1="120" x2="180" y2="120" stroke="#3D342C" strokeWidth="1"/>
                </svg>
              </div>
              <div className="flex justify-between items-baseline mt-3 font-mono text-[9px] tracking-[0.1em] uppercase text-terre">
                <span>Analise · 14:32 BRT</span>
                <b className="font-serif italic text-[13px] normal-case tracking-normal text-carbone font-normal">Mariana, 32</b>
              </div>
            </div>

            {/* Diagnostic data card */}
            <div className="absolute top-20 right-4 w-[50%] bg-carbone text-blanc-casse p-[18px] z-[2]">
              <div className="flex justify-between items-baseline mb-2.5">
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-sable">Diagnostico</span>
                <span className="font-serif italic text-[13px] text-terre">0.87</span>
              </div>
              {[
                { l: "Tipo", v: "Mista" },
                { l: "Fototipo", v: "III" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between items-center text-[11px] py-1.5 border-t border-sable/[0.18]">
                  <span className="text-sable font-light">{r.l}</span>
                  <span className="text-blanc-casse font-mono">{r.v}</span>
                </div>
              ))}
              {[
                { l: "Acne leve", v: "62%", w: "62%" },
                { l: "Hiperpigmentacao", v: "48%", w: "48%" },
                { l: "Barreira", v: "forte", w: "78%" },
              ].map((r, i) => (
                <div key={i} className="flex flex-col py-1.5 border-t border-sable/[0.18]">
                  <div className="flex justify-between text-[11px] w-full">
                    <span className="text-sable font-light">{r.l}</span>
                    <span className="text-blanc-casse font-mono">{r.v}</span>
                  </div>
                  <div className="h-0.5 bg-sable/20 mt-1.5 w-full">
                    <div className="h-full bg-blanc-casse" style={{ width: r.w }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Product card */}
            <div className="absolute bottom-4 left-[12%] w-[70%] bg-white border border-pierre/20 p-4 z-[3]">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-terre">Rotina recomendada</span>
              </div>
              {[
                { name: "Serum Vit. C 15%", meta: "Manha · Antioxidante", score: 94 },
                { name: "Hidratante Ceramidas", meta: "2x dia · Barreira", score: 91 },
                { name: "FPS 50+ Fluido", meta: "Manha · Fotoprotecao", score: 98 },
              ].map((item, i) => (
                <div key={i} className="grid grid-cols-[32px_1fr_auto] gap-3 items-center py-2 border-t border-sable/25 first:border-0">
                  <span className="w-8 h-8 bg-ivoire border border-pierre/15" />
                  <div>
                    <div className="text-xs text-carbone">{item.name}</div>
                    <div className="font-mono text-[9px] tracking-[0.08em] uppercase text-pierre mt-0.5">{item.meta}</div>
                  </div>
                  <span className="font-mono text-sm text-carbone bg-ivoire px-2 py-1 border border-pierre/20">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Marquee */}
        <div className="mt-24 border-y border-sable/40 overflow-hidden py-[18px]">
          <div className="flex gap-12 whitespace-nowrap font-serif text-[22px] italic text-pierre animate-[marquee_45s_linear_infinite]">
            {["Dermage", "Granado", "Pague Menos", "Drogasil", "L'Oreal Brasil", "Vichy", "La Roche-Posay", "Pharmapele", "Dermage", "Granado", "Pague Menos", "Drogasil"].map((brand, i) => (
              <span key={i} className="flex-shrink-0">{i > 0 && <span className="mx-6">·</span>}{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROCESSO ─────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Processo · 4 etapas</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              Da foto ao plano de tratamento.<br /><i className="text-terre">Em tres minutos.</i>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 border border-sable/40 bg-white">
            {steps.map((s, i) => (
              <div key={s.n} className={`p-9 ${i < 3 ? "border-r border-sable/40" : ""}`}>
                <span className="font-serif text-[40px] italic text-sable block mb-4">{s.n}</span>
                <h3 className="font-serif text-xl text-carbone mb-2">{s.t}</h3>
                <p className="text-[13px] text-pierre font-light leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RELATORIO DO PACIENTE ────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-20 items-center">
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Relatorio do paciente</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              Um diagnostico que <i className="text-terre">vende sozinho</i>.
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">
              Cada analise gera um relatorio dermatologico claro: condicoes detectadas,
              severidade e a rotina ideal — montada com produtos do <em className="text-carbone not-italic font-normal">seu</em> catalogo.
              Pronto para enviar por WhatsApp, exportar em PDF ou imprimir no PDV.
            </p>
            <ul className="flex flex-col gap-3 mt-6">
              {[
                "Match score por produto baseado em 142 atributos",
                "Severidade em escala clinica de 5 niveis",
                "Compativel com receituario e prontuario eletronico",
                "Marca branca — fica com a identidade do seu negocio",
              ].map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-terre font-light leading-relaxed pb-3 border-b border-sable/30">
                  <span className="w-1.5 h-1.5 bg-carbone mt-2 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          {/* Analysis screen mock */}
          <div className="bg-white border border-pierre/25 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.18)] overflow-hidden">
            <div className="h-8 bg-ivoire flex items-center px-3 gap-1.5 border-b border-pierre/20">
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="font-mono text-[9px] text-pierre mx-auto tracking-[0.04em]">analise.skinner.lat/clinica-pele-bela/r/8c2a</span>
            </div>
            <div className="grid grid-cols-2 min-h-[460px]">
              {/* Photo area */}
              <div className="relative bg-gradient-to-br from-ivoire to-[#ddd2c4] border-r border-pierre/15 p-6">
                <span className="absolute border border-terre/40 rounded-full w-16 h-16" style={{top:'32%',left:'38%'}} />
                <span className="absolute border border-terre/40 rounded-full w-7 h-7" style={{top:'56%',right:'30%'}} />
                <span className="absolute border border-terre/40 rounded-full w-10 h-10" style={{top:'28%',right:'22%'}} />
                <span className="absolute font-mono text-[9px] tracking-[0.08em] text-carbone bg-white/90 px-2 py-1 border border-pierre/30" style={{top:'26%',left:'50%'}}>T-zone · oleosidade 0.71</span>
                <span className="absolute font-mono text-[9px] tracking-[0.08em] text-carbone bg-white/90 px-2 py-1 border border-pierre/30" style={{top:'60%',right:'12%'}}>Mancha · 4mm</span>
                <div className="absolute bottom-4 left-4 font-mono text-[10px] text-terre tracking-[0.08em]">
                  ID 8c2a · 12.04.26 · 14:32
                </div>
              </div>
              {/* Info area */}
              <div className="p-7 flex flex-col gap-6 overflow-hidden">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-1">Relatorio de pele</p>
                  <h3 className="font-serif text-[28px] text-carbone tracking-[-0.005em]">Pele <i className="text-terre">mista</i>, fototipo III</h3>
                  <p className="text-xs text-pierre font-mono tracking-[0.04em] mt-1">7 condicoes detectadas · barreira integra</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-3">Condicoes</p>
                  {[
                    { name: "Acne leve", sub: "T-zone", sev: [1,1,1,0,0] },
                    { name: "Hiperpigmentacao", sub: "pos-inflamatoria", sev: [1,1,0,0,0] },
                    { name: "Oleosidade", sub: "moderada", sev: [1,1,1,0,0] },
                    { name: "Linhas finas", sub: "periorbital", sev: [1,0,0,0,0] },
                  ].map((c, i) => (
                    <div key={i} className="flex justify-between items-center pb-2 mb-2 border-b border-pierre/15">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[13px] text-carbone">{c.name}</span>
                        <span className="font-mono text-[9px] tracking-[0.08em] uppercase text-pierre">{c.sub}</span>
                      </div>
                      <div className="flex gap-[3px]">
                        {c.sev.map((v, j) => (
                          <span key={j} className={`w-3 h-1 ${v ? "bg-carbone" : "bg-pierre/20"}`} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── DASHBOARD ────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-8 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-20 items-center">
          {/* Dashboard KPIs mock */}
          <div className="bg-white border border-pierre/25 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.18)] overflow-hidden">
            <div className="h-8 bg-ivoire flex items-center px-3 gap-1.5 border-b border-pierre/20">
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="w-2 h-2 rounded-full bg-sable/70" />
              <span className="font-mono text-[9px] text-pierre mx-auto tracking-[0.04em]">app.skinner.lat/dashboard</span>
            </div>
            <div className="p-6">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-2">Painel · Abril 2026</p>
              <h3 className="font-serif text-2xl italic text-carbone mb-4">Boa tarde, Dra. Helena</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { l: "Analises", v: "1.842", d: "+24% mes" },
                  { l: "Conversao", v: "8,9%", d: "+1,2pp" },
                  { l: "Receita", v: "R$ 47k", d: "+38%" },
                  { l: "Match", v: "0.81", d: "+0.04" },
                ].map((k, i) => (
                  <div key={i} className="p-3.5 bg-ivoire border border-pierre/[0.12] flex flex-col gap-1">
                    <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-pierre">{k.l}</span>
                    <span className="font-serif text-[28px] italic text-carbone leading-none">{k.v}</span>
                    <span className="font-mono text-[9px] tracking-[0.04em] text-[#5C6B4E]">↗ {k.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Copy */}
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Painel de gestao</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-6">
              Dados duros sobre <i className="text-terre">cada venda</i>.
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed mb-6">
              Atribuicao completa: qual produto foi recomendado, em qual canal, para qual
              tipo de pele, e o que converteu em receita. Metricas que conselho consultivo
              e diretor comercial entendem na primeira reuniao.
            </p>
            <div className="grid grid-cols-2 border-t border-l border-sable/40 mt-6">
              {hlStats.map((s, i) => (
                <div key={i} className="p-5 border-b border-r border-sable/40">
                  <b className="font-serif text-[32px] italic text-carbone block leading-none">{s.value}</b>
                  <span className="text-[11px] text-pierre block mt-2 leading-snug">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── PROJECAO ─────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Projecao de evolucao</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-4">
              O paciente <i className="text-terre">ve o futuro</i> da pele dele.
            </h2>
            <p className="text-base font-light text-pierre leading-relaxed max-w-[620px] mx-auto">
              Visualizacoes de 8 e 12 semanas com aderencia a rotina recomendada.
              E o gatilho de compra mais forte que existe: ver o resultado antes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { when: "Hoje · semana 0", title: "Estado atual", pct: null, grad: "from-ivoire to-[#d6cabb]" },
              { when: "Projecao · 8 semanas", title: "Melhora moderada", pct: "-52%", grad: "from-ivoire to-[#d2c8b9]" },
              { when: "Projecao · 12 semanas", title: "Aderencia alta", pct: "-81%", grad: "from-ivoire to-[#ccc4b3]" },
            ].map((p, i) => (
              <div key={i} className="bg-white border border-pierre/20">
                <div className={`aspect-[4/5] bg-gradient-to-br ${p.grad} border-b border-pierre/15 relative`}>
                  {p.pct && (
                    <span className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.12em] text-carbone bg-white/90 px-2 py-1 border border-pierre/20">
                      {p.pct}
                    </span>
                  )}
                </div>
                <div className="p-[18px] flex flex-col gap-1.5">
                  <span className="font-mono text-[9px] tracking-[0.12em] uppercase text-pierre">{p.when}</span>
                  <span className="font-serif text-lg italic text-carbone">{p.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SEGMENTOS ────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Para quem e</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone">
              Tres jeitos de usar.<br />Mesma <i className="text-terre">tecnologia</i>.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {segments.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className={`p-10 border transition-all hover:-translate-y-0.5 ${
                  s.feat
                    ? "bg-carbone text-blanc-casse border-carbone hover:border-terre"
                    : "bg-white border-sable/40 hover:border-carbone"
                }`}
              >
                <span className={`font-serif text-sm italic ${s.feat ? "text-blanc-casse" : "text-terre"}`}>{s.num}</span>
                <h3 className={`font-serif text-[30px] italic mt-3 mb-3 ${s.feat ? "text-blanc-casse" : "text-carbone"}`}>{s.title}</h3>
                <p className={`text-sm font-light leading-relaxed ${s.feat ? "text-sable" : "text-pierre"}`}>{s.desc}</p>
                <span className={`font-mono text-[11px] tracking-[0.1em] uppercase mt-4 inline-block pb-1 border-b ${
                  s.feat ? "text-blanc-casse border-blanc-casse" : "text-carbone border-carbone"
                }`}>Ver caso →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RESULTADOS (DARK) ────────────────────────────────── */}
      <section className="py-24 bg-carbone text-blanc-casse">
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="text-center max-w-[760px] mx-auto mb-[72px]">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-sable mb-4">Resultados · base de 47 clientes ativos</p>
            <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-blanc-casse">
              Os <i>numeros</i> que importam.
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-l border-sable/30">
            {stats.map((s, i) => (
              <div key={i} className="p-9 border-b border-r border-sable/30">
                <b className="font-serif text-[64px] italic text-blanc-casse leading-none block">{s.value}</b>
                <span className="text-xs text-sable mt-4 block leading-snug whitespace-pre-line">{s.label}</span>
              </div>
            ))}
          </div>
          {/* Quotes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mt-20">
            {quotes.map((q, i) => (
              <figure key={i} className="m-0 pt-8 border-t border-sable/40">
                <p className="font-serif text-[22px] italic text-blanc-casse leading-[1.4] mb-6">"{q.text}"</p>
                <figcaption className="flex flex-col">
                  <b className="text-blanc-casse text-xs font-normal">{q.author}</b>
                  <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-sable mt-1">{q.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section className="py-28 bg-ivoire border-t border-sable/40">
        <div className="max-w-[1200px] mx-auto px-8 text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-pierre mb-4">Proximo passo</p>
          <h2 className="font-serif text-[clamp(32px,4.2vw,52px)] leading-[1.08] text-carbone mb-2">
            Pronto pra ler a pele<br />dos seus clientes?
          </h2>
          <p className="text-base font-light text-pierre leading-relaxed max-w-[620px] mx-auto mt-4 mb-8">
            Demo de 25 minutos com o time de produto. Saimos com um plano-piloto desenhado pro seu negocio.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/contato" className="px-7 py-4 bg-carbone text-blanc-casse text-sm border border-carbone hover:bg-terre hover:-translate-y-px transition-all">
              Solicitar demo
            </Link>
            <Link href="/planos" className="px-7 py-4 border border-sable text-carbone text-sm hover:bg-blanc-casse hover:border-carbone transition-all">
              Ver planos →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
