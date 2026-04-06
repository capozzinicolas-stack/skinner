export default function PrivacidadePage() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">Legal</p>
        <h1 className="font-serif text-3xl text-carbone italic mb-8">Politica de Privacidade</h1>

        <div className="space-y-8 text-sm text-pierre font-light leading-relaxed">
          <div>
            <h2 className="text-carbone text-sm mb-2">1. Introducao</h2>
            <p>
              A Skinner ("nos") opera como Operador de dados sensiveis (biometricos) em nome dos
              seus clientes B2B (Controladores), em conformidade com a Lei Geral de Protecao de
              Dados (LGPD - Lei 13.709/2018).
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">2. Dados coletados</h2>
            <p>
              <strong className="text-carbone font-normal">Foto facial:</strong> Dado biometrico sensivel sob LGPD Art. 11.
              Processada em memoria por inteligencia artificial e descartada imediatamente apos a analise.
              Nao e armazenada em nenhum banco de dados.
            </p>
            <p className="mt-2">
              <strong className="text-carbone font-normal">Questionario:</strong> Tipo de pele, preocupacoes, faixa etaria e
              dados de saude basicos. Armazenados de forma anonima por padrao.
            </p>
            <p className="mt-2">
              <strong className="text-carbone font-normal">E-mail (opcional):</strong> Fornecido voluntariamente para recebimento
              do relatorio. Pode ser deletado a qualquer momento.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">3. Base legal</h2>
            <p>
              Consentimento explicito coletado antes da captura de foto, com linguagem clara
              sobre finalidade e tratamento dos dados.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">4. Retencao de dados</h2>
            <p>
              Fotos faciais: processadas e descartadas imediatamente. Resultados de analise:
              armazenados conforme plano do cliente B2B (30 a 365 dias). Leads de contato:
              mantidos ate solicitacao de exclusao.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">5. Direitos do titular</h2>
            <p>
              Voce tem direito a: confirmacao de tratamento, acesso, correcao, anonimizacao,
              portabilidade, eliminacao e revogacao do consentimento. Para exercer seus direitos,
              entre em contato pelo e-mail privacidade@skinner.com.br.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">6. Seguranca</h2>
            <p>
              Criptografia em transito (TLS 1.3) e em repouso (AES-256). Rate limiting por IP.
              Audit log de todas as acoes. Revisao de seguranca trimestral.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">7. Contato do DPO</h2>
            <p>
              Encarregado de Protecao de Dados: privacidade@skinner.com.br
            </p>
          </div>

          <p className="text-xs text-sable mt-8">Ultima atualizacao: abril de 2026.</p>
        </div>
      </div>
    </section>
  );
}
