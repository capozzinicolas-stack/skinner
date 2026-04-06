import Link from "next/link";

const features = [
  {
    title: "Tablet ou QR code no PDV",
    desc: "O cliente inicia a analise por conta propria no balcao ou via QR code impresso. Sem necessidade de funcionario dedicado ou treinamento extenso.",
  },
  {
    title: "Recomendacoes personalizadas",
    desc: "O algoritmo seleciona produtos do seu estoque ordenados por compatibilidade com o diagnostico. O cliente sai com confianca na escolha.",
  },
  {
    title: "Rastreamento de comissao",
    desc: "Cada analise e vinculada a venda via codigo de produto ou terminal. Dashboard com conversao por periodo, por produto e por ponto de venda.",
  },
  {
    title: "Configuracao em horas",
    desc: "Integracao com catalogo via planilha. Nenhum sistema legado precisa ser alterado. Suporte tecnico incluido no onboarding.",
  },
];

const steps = [
  { number: "01", title: "Cliente escaneia o QR", desc: "Presente no balcao, vitrine ou material de PDV. Acesso instantaneo, sem download." },
  { number: "02", title: "Questionario rapido", desc: "7 perguntas sobre tipo de pele e preocupacoes. Menos de 60 segundos." },
  { number: "03", title: "Foto e diagnostico", desc: "IA analisa a pele em menos de 15 segundos. Resultado visual e claro." },
  { number: "04", title: "Produtos recomendados", desc: "Lista dos produtos do seu estoque ordenada por compatibilidade. O atendente fecha a venda." },
];

const metrics = [
  { value: "60s", label: "para o primeiro resultado" },
  { value: "zero", label: "treinamento tecnico necessario" },
  { value: "PDV", label: "fisico e digital integrados" },
];

export default function FarmaciasPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">
            Para farmacias
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-carbone italic leading-tight">
            Da duvida a compra.<br />Em menos de um minuto.
          </h1>
          <div className="w-16 h-px bg-sable mx-auto mt-6 mb-6" />
          <p className="text-pierre text-lg font-light leading-relaxed max-w-xl mx-auto">
            Analise facial instantanea no ponto de venda. O cliente entende sua pele,
            o atendente recomenda com confianca, a venda acontece.
            Sem friccao, sem desperdicio de estoque.
          </p>
          <div className="mt-10">
            <Link
              href="/contato"
              className="inline-block px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
            >
              Quero para minha farmacia
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

      {/* How it works */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">
            Processo
          </p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-16">
            Do QR code ao recibo
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

      {/* Features */}
      <section className="py-20 px-8 bg-white border-y border-sable/20">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">
            Funcionalidades
          </p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-12">
            Simples de configurar. Poderoso na operacao.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="p-8 border border-sable/20">
                <h3 className="text-sm text-carbone mb-3">{f.title}</h3>
                <p className="text-sm text-pierre font-light leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <h2 className="font-serif text-2xl text-carbone italic">
          Seu balcao pode fazer mais
        </h2>
        <div className="w-12 h-px bg-sable mx-auto mt-6 mb-6" />
        <p className="text-pierre font-light mb-8 max-w-md mx-auto">
          Configure em horas. Escale para quantas unidades quiser.
          Fale com a nossa equipe e receba uma proposta personalizada.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contato"
            className="inline-block px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
          >
            Solicitar proposta
          </Link>
          <Link
            href="/demo"
            className="inline-block px-8 py-3 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire transition-colors"
          >
            Ver demo
          </Link>
        </div>
      </section>
    </>
  );
}
