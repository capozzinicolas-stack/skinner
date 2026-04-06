import Link from "next/link";

const steps = [
  { number: "01", title: "Questionario", desc: "7 perguntas rapidas sobre seu tipo de pele, preocupacoes e objetivos." },
  { number: "02", title: "Foto facial", desc: "Uma foto de frente com boa iluminacao. Processada e descartada imediatamente." },
  { number: "03", title: "Analise IA", desc: "Inteligencia artificial identifica condicoes, severidade e estado da barreira cutanea." },
  { number: "04", title: "Recomendacoes", desc: "Produtos do seu catalogo selecionados por compatibilidade e ordenados por relevancia." },
];

const segments = [
  { title: "Laboratorios", desc: "Impulsione vendas com recomendacoes personalizadas do seu portfolio.", href: "/laboratorios" },
  { title: "Clinicas", desc: "Diferencie o atendimento com diagnostico IA antes da consulta.", href: "/clinicas" },
  { title: "Farmacias", desc: "Aumente conversao no PDV com analise facial instantanea.", href: "/farmacias" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <img src="/brand/logo-primary.png" alt="Skinner" className="h-24 mx-auto mb-8 object-contain" />
          <h1 className="font-serif text-4xl md:text-5xl text-carbone italic leading-tight">
            A pele e dados.<br />Nos lemos.
          </h1>
          <div className="w-16 h-px bg-sable mx-auto mt-6 mb-6" />
          <p className="text-pierre text-lg font-light leading-relaxed max-w-xl mx-auto">
            Plataforma de inteligencia dermatologica com IA que analisa a pele do seu cliente
            e recomenda os produtos certos do seu catalogo. Em menos de 3 minutos.
          </p>
          <div className="flex gap-4 justify-center mt-10">
            <Link href="/contato" className="px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors">
              Solicitar Demo
            </Link>
            <Link href="/como-funciona" className="px-8 py-3 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire transition-colors">
              Como funciona
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-8 bg-white border-y border-sable/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">Processo</p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-16">
            Da foto ao plano de tratamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number}>
                <p className="text-3xl font-serif text-sable">{step.number}</p>
                <h3 className="text-sm text-carbone mt-3 mb-2">{step.title}</h3>
                <p className="text-xs text-pierre font-light leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value prop */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">Para o B2B</p>
            <h3 className="font-serif text-lg text-carbone mb-2">Conversao e fidelizacao</h3>
            <p className="text-sm text-pierre font-light leading-relaxed">
              Ferramenta de diferenciacao que transforma a experiencia do cliente
              e impulsiona vendas com recomendacoes baseadas em dados.
            </p>
          </div>
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">Para o consumidor</p>
            <h3 className="font-serif text-lg text-carbone mb-2">Diagnostico personalizado</h3>
            <p className="text-sm text-pierre font-light leading-relaxed">
              Analise profissional, instantanea e gratuita. Plano de acao claro
              com produtos selecionados para o seu tipo de pele.
            </p>
          </div>
          <div>
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">Para Skinner</p>
            <h3 className="font-serif text-lg text-carbone mb-2">Receita recorrente</h3>
            <p className="text-sm text-pierre font-light leading-relaxed">
              Assinatura mensal + comissao por venda gerada.
              Modelo sustentavel alinhado ao sucesso do cliente.
            </p>
          </div>
        </div>
      </section>

      {/* Segments */}
      <section className="py-20 px-8 bg-white border-y border-sable/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">Segmentos</p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-12">
            Para quem e o Skinner
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {segments.map((seg) => (
              <Link key={seg.href} href={seg.href} className="p-8 border border-sable/20 hover:border-carbone transition-colors group">
                <h3 className="font-serif text-lg text-carbone group-hover:text-terre">{seg.title}</h3>
                <p className="text-sm text-pierre font-light mt-2 leading-relaxed">{seg.desc}</p>
                <p className="text-xs text-carbone mt-4 tracking-wide">Ver mais &#8594;</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <h2 className="font-serif text-3xl text-carbone italic">
          Pronto para ler a pele dos seus clientes?
        </h2>
        <div className="w-12 h-px bg-sable mx-auto mt-6 mb-6" />
        <p className="text-pierre font-light mb-8">
          Comece com o plano Starter. Sem contrato de permanencia.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/contato" className="px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors">
            Falar com vendas
          </Link>
          <Link href="/planos" className="px-8 py-3 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire transition-colors">
            Ver planos
          </Link>
        </div>
      </section>
    </>
  );
}
