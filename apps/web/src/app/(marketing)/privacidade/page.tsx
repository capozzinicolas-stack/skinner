export default function PrivacidadePage() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">Legal</p>
        <h1 className="font-serif text-3xl text-carbone italic mb-8">Política de Privacidade</h1>

        <div className="space-y-8 text-sm text-pierre font-light leading-relaxed">
          <div>
            <h2 className="text-carbone text-sm mb-2">1. Introdução</h2>
            <p>
              A Skinner ("nós") opera como Operador de dados sensíveis (biométricos) em nome dos
              seus clientes B2B (Controladores), em conformidade com a Lei Geral de Proteção de
              Dados (LGPD - Lei 13.709/2018).
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">2. Dados coletados</h2>
            <p>
              <strong className="text-carbone font-normal">Foto facial:</strong> Dado biométrico sensível sob LGPD Art. 11.
              Processada em memória por inteligência artificial e descartada imediatamente após a análise.
              Não é armazenada em nenhum banco de dados.
            </p>
            <p className="mt-2">
              <strong className="text-carbone font-normal">Questionário:</strong> Tipo de pele, preocupações, faixa etária e
              dados de saúde básicos. Armazenados de forma anônima por padrão.
            </p>
            <p className="mt-2">
              <strong className="text-carbone font-normal">E-mail (opcional):</strong> Fornecido voluntariamente para recebimento
              do relatório. Pode ser deletado a qualquer momento.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">3. Base legal</h2>
            <p>
              Consentimento explícito coletado antes da captura de foto, com linguagem clara
              sobre finalidade e tratamento dos dados.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">4. Retenção de dados</h2>
            <p>
              Fotos faciais: processadas e descartadas imediatamente. Resultados de análise:
              armazenados conforme plano do cliente B2B (30 a 365 dias). Leads de contato:
              mantidos até solicitação de exclusão.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">5. Direitos do titular</h2>
            <p>
              Você tem direito a: confirmação de tratamento, acesso, correção, anonimização,
              portabilidade, eliminação e revogação do consentimento. Para exercer seus direitos,
              entre em contato pelo e-mail privacidade@skinner.com.br.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">6. Segurança</h2>
            <p>
              Criptografia em trânsito (TLS 1.3) e em repouso (AES-256). Rate limiting por IP.
              Audit log de todas as ações. Revisão de segurança trimestral.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">7. Contato do DPO</h2>
            <p>
              Encarregado de Proteção de Dados: privacidade@skinner.com.br
            </p>
          </div>

          <p className="text-xs text-sable mt-8">Última atualização: abril de 2026.</p>
        </div>
      </div>
    </section>
  );
}
