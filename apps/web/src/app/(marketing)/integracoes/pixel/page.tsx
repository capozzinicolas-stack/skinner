export const metadata = {
  title: "Pixel de Conversão — Skinner",
  description:
    "Documentação técnica do pixel de conversão Skinner para rastrear vendas geradas via recomendações da análise de pele.",
};

const trackPurchaseSnippet = `<!-- Cole no thank-you page do seu e-commerce.
     Substitua RECOMMENDATION_ID e SALE_VALUE pelos valores reais. -->
<script>
  fetch("https://app.skinner.lat/api/pixel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ref: "RECOMMENDATION_ID",
      value: SALE_VALUE
    })
  });
</script>`;

const trackClickSnippet = `<!-- Use como pixel transparente em emails ou páginas -->
<img src="https://app.skinner.lat/api/pixel?ref=RECOMMENDATION_ID"
     width="1" height="1" alt="" />`;

export default function PixelDocsPage() {
  return (
    <main className="min-h-screen bg-blanc-casse">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="border-b border-sable/30 pb-6 mb-10">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
            Documentação técnica
          </p>
          <h1 className="font-serif text-3xl text-carbone">
            Pixel de Conversão
          </h1>
          <p className="text-sm text-pierre font-light mt-3">
            Rastreie vendas geradas a partir das recomendações da análise de pele
            Skinner. Os dados aparecem automaticamente no dashboard do seu portal B2B.
          </p>
        </div>

        <section className="space-y-6 mb-12">
          <h2 className="font-serif text-xl text-carbone">Como funciona</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            Quando um paciente conclui uma análise, cada produto recomendado recebe um
            identificador único (<code className="text-carbone bg-ivoire px-1.5 py-0.5">recommendationId</code>).
            Quando esse paciente compra um produto recomendado, você envia esse
            identificador junto com o valor da venda para o pixel Skinner. O sistema
            registra a conversão, calcula a comissão e atualiza o relatório do período.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">1. Compra confirmada (POST)</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            Cole o snippet abaixo no thank-you page (página de "compra confirmada") do seu
            e-commerce. Substitua os placeholders pelos valores que você já tem no carrinho.
          </p>
          <pre className="bg-carbone text-blanc-casse text-xs p-5 overflow-x-auto font-mono leading-relaxed">
{trackPurchaseSnippet}
          </pre>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">2. Click tracking (GET)</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            Para rastrear cliques (sem valor de venda), use a imagem pixel transparente.
            Funciona em emails marketing, landing pages e qualquer contexto onde JavaScript
            não está disponível.
          </p>
          <pre className="bg-carbone text-blanc-casse text-xs p-5 overflow-x-auto font-mono leading-relaxed">
{trackClickSnippet}
          </pre>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">Onde encontrar o recommendationId</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            O <code className="text-carbone bg-ivoire px-1.5 py-0.5">recommendationId</code> está
            disponível no link de cada produto recomendado no resultado da análise. Se você
            usa integração com Nuvemshop ou Shopify, o identificador é propagado automaticamente
            via UTM. Para integrações manuais, contate o suporte e ajustamos o pipeline.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">Privacidade e LGPD</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            O pixel registra apenas o identificador da recomendação e o valor da venda.
            Não coleta IP, cookies de terceiros, nem dados pessoais do cliente final.
            É compatível com LGPD sem necessidade de consentimento explícito do usuário.
          </p>
        </section>

        <div className="border-t border-sable/30 pt-6">
          <p className="text-xs text-pierre font-light">
            Dúvidas técnicas? Contate o time Skinner em{" "}
            <a
              href="mailto:suporte@skinner.lat"
              className="text-carbone hover:underline"
            >
              suporte@skinner.lat
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
