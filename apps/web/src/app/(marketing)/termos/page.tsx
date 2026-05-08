export default function TermosPage() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">Legal</p>
        <h1 className="font-serif text-3xl text-carbone italic mb-8">Termos de Uso</h1>

        <div className="space-y-8 text-sm text-pierre font-light leading-relaxed">
          <div>
            <h2 className="text-carbone text-sm mb-2">1. Aceitação</h2>
            <p>
              Ao utilizar a plataforma Skinner, você concorda com estes termos de uso.
              Se você é um cliente B2B, um Contrato de Prestação de Serviços (SLA) separado
              pode ser aplicável.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">2. Descrição do serviço</h2>
            <p>
              Skinner é uma plataforma SaaS B2B de inteligência dermatológica que oferece
              análise facial por IA e recomendação personalizada de produtos. O serviço é
              contratado por empresas (tenants) e disponibilizado aos seus clientes finais.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">3. Disclaimer médico</h2>
            <p>
              A análise de pele fornecida pela Skinner é exclusivamente informativa e educacional.
              Não constitui diagnóstico médico, prescrição ou aconselhamento profissional de saúde.
              Sempre consulte um dermatologista para condições de pele que necessitem tratamento médico.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">4. Uso aceitável</h2>
            <p>
              O cliente B2B se compromete a: utilizar a plataforma apenas para fins legítimos,
              não tentar reverter a engenharia do motor de análise, não compartilhar credenciais
              de acesso e manter seu catálogo de produtos atualizado e verídico.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">5. Propriedade intelectual</h2>
            <p>
              A base dermatológica, algoritmos de matching, modelos de análise e marca Skinner
              são propriedade exclusiva da Skinner. O conteúdo do catálogo de produtos e os
              dados de clientes finais pertencem ao respectivo cliente B2B.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">6. Faturamento</h2>
            <p>
              A cobrança é realizada mensalmente via Stripe. Inclui mensalidade fixa,
              análises excedentes ao limite do plano e comissão sobre vendas rastreadas.
              O cancelamento pode ser feito a qualquer momento e entra em vigor no final
              do ciclo corrente.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">7. Limitação de responsabilidade</h2>
            <p>
              A Skinner não se responsabiliza por decisões de compra tomadas pelo consumidor
              final com base nas recomendações da plataforma. A responsabilidade sobre os
              produtos recomendados é exclusiva do cliente B2B que os cadastrou.
            </p>
          </div>

          <div>
            <h2 className="text-carbone text-sm mb-2">8. Alterações</h2>
            <p>
              Estes termos podem ser atualizados periodicamente. Alterações significativas
              serão comunicadas por e-mail aos clientes B2B com 30 dias de antecedência.
            </p>
          </div>

          <p className="text-xs text-sable mt-8">Última atualização: abril de 2026.</p>
        </div>
      </div>
    </section>
  );
}
