import Link from "next/link";

const features = [
  {
    title: "Integracao com portfolio",
    desc: "Conecte seu catalogo de produtos via CSV ou API. O algoritmo de matching cruza cada diagnostico com seus SKUs considerando indicacao clinica, tipo de pele e objetivos do usuario.",
  },
  {
    title: "Relatorios PDF com identidade visual",
    desc: "O relatorio entregue ao consumidor carrega a marca do seu laboratorio. Logo, paleta, nome dos produtos e links de compra customizaveis.",
  },
  {
    title: "Rastreamento de conversao",
    desc: "Pixel de rastreamento integrado a seu e-commerce ou parceiros de distribuicao. Cada recomendacao e rastreada ate a venda concluida.",
  },
  {
    title: "Dashboard de analytics",
    desc: "Volume de analises, taxa de conversao por produto, preocupacoes mais frequentes por regiao. Dados que informam estrategia de portfolio e comunicacao.",
  },
];

const metrics = [
  { value: "3 min", label: "da foto ao relatorio" },
  { value: "+40%", label: "conversao media no canal digital" },
  { value: "100%", label: "LGPD compliant" },
];

export default function LaboratoriosPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">
            Para laboratorios
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-carbone italic leading-tight">
            Seu portfolio.<br />A pele certa.
          </h1>
          <div className="w-16 h-px bg-sable mx-auto mt-6 mb-6" />
          <p className="text-pierre text-lg font-light leading-relaxed max-w-xl mx-auto">
            O Skinner conecta o diagnostico individual de pele ao seu portfolio de produtos,
            gerando recomendacoes precisas e rastreando cada venda gerada. Sem intermediarios.
          </p>
          <div className="mt-10">
            <Link
              href="/contato"
              className="inline-block px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
            >
              Falar com vendas
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 px-8 bg-white border-y border-sable/20">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {metrics.map((m) => (
            <div key={m.label}>
              <p className="font-serif text-4xl text-carbone">{m.value}</p>
              <p className="text-xs text-pierre font-light mt-2 uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">
            Funcionalidades
          </p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-12">
            Uma plataforma construida para o B2B
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-8 border border-sable/20 bg-white">
                <h3 className="text-sm text-carbone mb-3">{f.title}</h3>
                <p className="text-sm text-pierre font-light leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it fits */}
      <section className="py-20 px-8 bg-ivoire border-y border-sable/20">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">
            Modelo de negocio
          </p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-8">
            Alinhado ao seu crescimento
          </h2>
          <div className="space-y-6 text-center max-w-xl mx-auto">
            <p className="text-pierre font-light leading-relaxed">
              Assinatura mensal fixa por tenant, sem limite de analises no plano Growth.
              Comissao de 2% sobre vendas confirmadas rastreadas via pixel.
            </p>
            <p className="text-pierre font-light leading-relaxed">
              Quanto mais o Skinner vende para o seu cliente, menos voce paga proporcionalmente.
              Crescemos juntos.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <h2 className="font-serif text-2xl text-carbone italic">
          Seu portfolio merece uma experiencia a altura
        </h2>
        <div className="w-12 h-px bg-sable mx-auto mt-6 mb-6" />
        <p className="text-pierre font-light mb-8 max-w-md mx-auto">
          Agende uma conversa. Mostramos como integrar seu catalogo e configurar
          a primeira analise em menos de uma semana.
        </p>
        <Link
          href="/contato"
          className="inline-block px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
        >
          Solicitar demonstracao
        </Link>
      </section>
    </>
  );
}
