import Link from "next/link";

const features = [
  {
    title: "Analise de pele antes da consulta",
    desc: "O paciente realiza a analise em casa ou na sala de espera via link personalizado. O dermato recebe o diagnostico IA antes mesmo de iniciar o atendimento.",
  },
  {
    title: "Relatorios com identidade da clinica",
    desc: "PDF com logo, paleta e informacoes de contato da sua clinica. O relatorio e compartilhado com o paciente e fica no historico para acompanhamento.",
  },
  {
    title: "Geracao de plano de tratamento",
    desc: "O Skinner sugere um plano em 3 fases com produtos e ativos indicados, que o medico pode validar, ajustar e assinar antes de compartilhar.",
  },
  {
    title: "LGPD by design",
    desc: "Foto processada em memoria e descartada imediatamente. Dados do paciente armazenados com criptografia end-to-end. Consentimento registrado a cada sessao.",
  },
];

const workflow = [
  { step: "01", title: "Pre-consulta", desc: "Paciente acessa link da clinica, responde questionario e envia foto. Menos de 3 minutos." },
  { step: "02", title: "Diagnostico IA", desc: "Analise multimodal identifica condicoes, severidade e indicadores de barreira cutanea." },
  { step: "03", title: "Revisao medica", desc: "Dermato visualiza relatorio IA no painel antes da consulta. Pode anotar, ajustar e assinar." },
  { step: "04", title: "Entrega ao paciente", desc: "PDF com identidade da clinica enviado por e-mail ou disponivel via QR code." },
];

export default function ClinicasPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">
            Para clinicas de dermatologia
          </p>
          <h1 className="font-serif text-4xl md:text-5xl text-carbone italic leading-tight">
            O diagnostico comeca<br />antes da consulta.
          </h1>
          <div className="w-16 h-px bg-sable mx-auto mt-6 mb-6" />
          <p className="text-pierre text-lg font-light leading-relaxed max-w-xl mx-auto">
            Skinner entrega ao dermatologista uma analise de pele baseada em IA antes mesmo
            de o paciente entrar no consultorio. Mais dados, consultas mais produtivas,
            experiencia diferenciada.
          </p>
          <div className="mt-10">
            <Link
              href="/contato"
              className="inline-block px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
            >
              Agendar demonstracao
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-16 px-8 bg-white border-y border-sable/20">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">
            Fluxo
          </p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-12">
            Como funciona na pratica
          </h2>
          {workflow.map((item, idx) => (
            <div
              key={item.step}
              className={`flex gap-8 ${idx > 0 ? "mt-10 pt-10 border-t border-sable/10" : ""}`}
            >
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

      {/* Features */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light text-center mb-4">
            Funcionalidades
          </p>
          <h2 className="font-serif text-3xl text-carbone text-center mb-12">
            Projetado para o ambiente clinico
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

      {/* Trust */}
      <section className="py-20 px-8 bg-ivoire border-y border-sable/20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">
            Conformidade
          </p>
          <h2 className="font-serif text-2xl text-carbone mb-6">
            Seguranca e privacidade sem concessoes
          </h2>
          <p className="text-pierre font-light leading-relaxed mb-4">
            O Skinner foi desenhado para o ambiente regulado da saude. Dados de pacientes
            tratados com criptografia AES-256. Consentimento explicitado em cada sessao.
            Fotos jamais armazenadas.
          </p>
          <p className="text-sm text-pierre font-light">
            Conformidade com LGPD verificada em cada release.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 text-center">
        <h2 className="font-serif text-2xl text-carbone italic">
          Diferencie o cuidado que voce oferece
        </h2>
        <div className="w-12 h-px bg-sable mx-auto mt-6 mb-6" />
        <p className="text-pierre font-light mb-8 max-w-md mx-auto">
          Configure sua clinica em menos de 48 horas. Suporte dedicado na integracao
          e treinamento da equipe inclusos.
        </p>
        <Link
          href="/contato"
          className="inline-block px-8 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
        >
          Falar com vendas
        </Link>
      </section>
    </>
  );
}
