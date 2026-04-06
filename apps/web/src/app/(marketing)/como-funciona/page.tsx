import Link from "next/link";

const pipeline = [
  { step: "01", title: "Acesso", desc: "O cliente acessa a analise via link, QR code ou tablet no seu ponto de venda. Sem necessidade de cadastro." },
  { step: "02", title: "Questionario", desc: "7 perguntas adaptativas sobre tipo de pele, preocupacoes, objetivos e historico. Menos de 1 minuto." },
  { step: "03", title: "Foto facial", desc: "Uma foto de frente com iluminacao natural. Processada por IA e descartada imediatamente. LGPD compliant." },
  { step: "04", title: "Analise IA", desc: "Inteligencia artificial multimodal identifica condicoes, severidade e estado da barreira cutanea em menos de 15 segundos." },
  { step: "05", title: "Matching", desc: "O motor cruza os resultados com o seu catalogo de produtos, pontuando cada item por compatibilidade." },
  { step: "06", title: "Resultado", desc: "O cliente recebe diagnostico visual, plano de acao em 3 fases e produtos recomendados com link de compra." },
  { step: "07", title: "Relatorio PDF", desc: "Relatorio completo com a identidade visual da sua marca. Enviado por e-mail ou disponivel para download." },
];

const techStack = [
  { label: "Visao computacional", desc: "Analise multimodal de imagem facial com IA de ultima geracao." },
  { label: "Base dermatologica", desc: "Conhecimento clinico proprietario sobre condicoes de pele, ingredientes e rotinas." },
  { label: "Matching inteligente", desc: "Algoritmo que cruza diagnostico com catalogo considerando concern, tipo de pele, objetivo e severidade." },
  { label: "Multi-tenant", desc: "Cada cliente B2B opera em ambiente isolado com marca, catalogo e configuracoes proprias." },
];

export default function ComoFuncionaPage() {
  return (
    <>
      <section className="py-20 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">Produto</p>
          <h1 className="font-serif text-4xl text-carbone italic">Como funciona</h1>
          <p className="text-pierre font-light mt-4 max-w-lg mx-auto">
            Do acesso ao relatorio em menos de 3 minutos.
            Uma experiencia precisa, personalizada e sem friccao.
          </p>
        </div>
      </section>

      <section className="py-16 px-8 bg-white border-y border-sable/20">
        <div className="max-w-3xl mx-auto">
          {pipeline.map((item, idx) => (
            <div key={item.step} className={`flex gap-8 ${idx > 0 ? "mt-10 pt-10 border-t border-sable/10" : ""}`}>
              <div className="flex-shrink-0 w-12">
                <p className="text-2xl font-serif text-sable">{item.step}</p>
              </div>
              <div>
                <h3 className="text-sm text-carbone mb-1">{item.title}</h3>
                <p className="text-sm text-pierre font-light leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">Tecnologia</p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-12">
            O que esta por tras
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {techStack.map((tech) => (
              <div key={tech.label} className="p-6 border border-sable/20">
                <h3 className="text-sm text-carbone mb-2">{tech.label}</h3>
                <p className="text-xs text-pierre font-light leading-relaxed">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-8 text-center">
        <h2 className="font-serif text-2xl text-carbone italic">Experimente agora</h2>
        <p className="text-pierre font-light mt-3 mb-8">
          Faca uma analise de demonstracao gratuita.
        </p>
        <Link href="/demo" className="px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors">
          Fazer analise demo
        </Link>
      </section>
    </>
  );
}
