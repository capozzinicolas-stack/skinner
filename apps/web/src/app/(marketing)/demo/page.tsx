import Link from "next/link";

export default function DemoPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">
            Demonstracao
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-carbone italic leading-tight">
            Experimente o Skinner
          </h1>
          <div className="w-16 h-px bg-sable mx-auto mt-6 mb-6" />
          <p className="text-pierre text-lg font-light leading-relaxed">
            Uma analise de pele completa, gerada por IA, personalizada e gratuita.
            Nenhuma conta necessaria.
          </p>
        </div>
      </section>

      {/* Details */}
      <section className="py-8 px-8">
        <div className="max-w-xl mx-auto space-y-4 text-center">
          <p className="text-pierre font-light leading-relaxed">
            A demo utiliza o ambiente da clinica <span className="text-carbone">Skinner Demo</span>.
            Voce passa pelo fluxo completo: questionario adaptativo, foto facial, diagnostico por IA
            e recomendacoes de produtos. O relatorio PDF fica disponivel ao final.
          </p>
          <p className="text-sm text-pierre font-light leading-relaxed">
            A foto enviada e processada em memoria e descartada imediatamente.
            Nenhuma imagem e armazenada. Conforme a LGPD.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-8 text-center">
        <Link
          href="/analise/demo-clinic"
          className="inline-block px-12 py-4 bg-carbone text-blanc-casse text-sm font-light tracking-widest uppercase hover:bg-terre transition-colors"
        >
          Iniciar analise gratuita
        </Link>
        <p className="text-xs text-pierre font-light mt-6">
          Gratuito. Sem cadastro. LGPD compliant.
        </p>
      </section>

      {/* What to expect */}
      <section className="py-20 px-8 bg-white border-y border-sable/20">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">
            O que esperar
          </p>
          <h2 className="font-serif text-2xl text-carbone text-center mb-12">
            Menos de 3 minutos do inicio ao relatorio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="font-serif text-3xl text-sable">01</p>
              <h3 className="text-sm text-carbone mt-3 mb-2">Questionario</h3>
              <p className="text-xs text-pierre font-light leading-relaxed">
                7 perguntas sobre tipo de pele, preocupacoes e objetivos. Menos de 60 segundos.
              </p>
            </div>
            <div className="text-center">
              <p className="font-serif text-3xl text-sable">02</p>
              <h3 className="text-sm text-carbone mt-3 mb-2">Foto facial</h3>
              <p className="text-xs text-pierre font-light leading-relaxed">
                Uma foto de frente com boa iluminacao. Processada em menos de 15 segundos.
              </p>
            </div>
            <div className="text-center">
              <p className="font-serif text-3xl text-sable">03</p>
              <h3 className="text-sm text-carbone mt-3 mb-2">Resultado</h3>
              <p className="text-xs text-pierre font-light leading-relaxed">
                Diagnostico visual, plano de tratamento em 3 fases e produtos recomendados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For B2B */}
      <section className="py-20 px-8 text-center">
        <h2 className="font-serif text-2xl text-carbone italic">
          Quer oferecer isso aos seus clientes?
        </h2>
        <div className="w-12 h-px bg-sable mx-auto mt-6 mb-6" />
        <p className="text-pierre font-light mb-8 max-w-md mx-auto">
          O Skinner e uma plataforma B2B. Laboratorios, clinicas e farmacias
          podem configurar seu proprio ambiente com catalogo e identidade visual propria.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contato"
            className="inline-block px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
          >
            Falar com vendas
          </Link>
          <Link
            href="/planos"
            className="inline-block px-8 py-3 border border-sable text-terre text-sm font-light tracking-wide hover:bg-ivoire transition-colors"
          >
            Ver planos
          </Link>
        </div>
      </section>
    </>
  );
}
