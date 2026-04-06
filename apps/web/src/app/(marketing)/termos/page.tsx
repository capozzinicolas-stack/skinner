export default function TermosPage() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">Legal</p>
        <h1 className="font-serif text-3xl text-carbone italic mb-8">Termos de Uso</h1>

        <div className="space-y-8 text-sm text-pierre font-light leading-relaxed">
          <div>
            <h2 className="text-carbone text-sm mb-2">1. Aceitacao</h2>
            <p>
              Ao utilizar a plataforma Skinner, voce concorda com estes termos de uso.
              Se voce e um cliente B2B, um Contrato de Prestacao de Servicos (SLA) separado
              pode ser aplicavel.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">2. Descricao do servico</h2>
            <p>
              Skinner e uma plataforma SaaS B2B de inteligencia dermatologica que oferece
              analise facial por IA e recomendacao personalizada de produtos. O servico e
              contratado por empresas (tenants) e disponibilizado aos seus clientes finais.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">3. Disclaimer medico</h2>
            <p>
              A analise de pele fornecida pela Skinner e exclusivamente informativa e educacional.
              Nao constitui diagnostico medico, prescricao ou aconselhamento profissional de saude.
              Sempre consulte um dermatologista para condicoes de pele que necessitem tratamento medico.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">4. Uso aceitavel</h2>
            <p>
              O cliente B2B se compromete a: utilizar a plataforma apenas para fins legitimos,
              nao tentar reverter a engenharia do motor de analise, nao compartilhar credenciais
              de acesso e manter seu catalogo de produtos atualizado e veridico.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">5. Propriedade intelectual</h2>
            <p>
              A base dermatologica, algoritmos de matching, modelos de analise e marca Skinner
              sao propriedade exclusiva da Skinner. O conteudo do catalogo de produtos e os
              dados de clientes finais pertencem ao respectivo cliente B2B.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">6. Faturamento</h2>
            <p>
              A cobranca e realizada mensalmente via Stripe. Inclui mensalidade fixa,
              analises excedentes ao limite do plano e comissao sobre vendas rastreadas.
              O cancelamento pode ser feito a qualquer momento e entra em vigor no final
              do ciclo corrente.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">7. Limitacao de responsabilidade</h2>
            <p>
              A Skinner nao se responsabiliza por decisoes de compra tomadas pelo consumidor
              final com base nas recomendacoes da plataforma. A responsabilidade sobre os
              produtos recomendados e exclusiva do cliente B2B que os cadastrou.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">8. Alteracoes</h2>
            <p>
              Estes termos podem ser atualizados periodicamente. Alteracoes significativas
              serao comunicadas por e-mail aos clientes B2B com 30 dias de antecedencia.
            </p>
          </div>

          <p className="text-xs text-sable mt-8">Ultima atualizacao: abril de 2026.</p>
        </div>
      </div>
    </section>
  );
}
