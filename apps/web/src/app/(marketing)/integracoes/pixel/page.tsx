export const metadata = {
  title: "Pixel de Conversao — Skinner",
  description:
    "Documentacao tecnica do pixel de conversao Skinner para rastrear vendas geradas via recomendacoes da analise de pele.",
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

const trackClickSnippet = `<!-- Use como pixel transparente em emails ou paginas -->
<img src="https://app.skinner.lat/api/pixel?ref=RECOMMENDATION_ID"
     width="1" height="1" alt="" />`;

export default function PixelDocsPage() {
  return (
    <main className="min-h-screen bg-blanc-casse">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="border-b border-sable/30 pb-6 mb-10">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
            Documentacao tecnica
          </p>
          <h1 className="font-serif text-3xl text-carbone">
            Pixel de Conversao
          </h1>
          <p className="text-sm text-pierre font-light mt-3">
            Rastreie vendas geradas a partir das recomendacoes da analise de pele
            Skinner. Os dados aparecem automaticamente no dashboard do seu portal B2B.
          </p>
        </div>

        <section className="space-y-6 mb-12">
          <h2 className="font-serif text-xl text-carbone">Como funciona</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            Quando um paciente conclui uma analise, cada produto recomendado recebe um
            identificador unico (<code className="text-carbone bg-ivoire px-1.5 py-0.5">recommendationId</code>).
            Quando esse paciente compra um produto recomendado, voce envia esse
            identificador junto com o valor da venda para o pixel Skinner. O sistema
            registra a conversao, calcula a comissao e atualiza o relatorio do periodo.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">1. Compra confirmada (POST)</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            Cole o snippet abaixo no thank-you page (pagina de "compra confirmada") do seu
            e-commerce. Substitua os placeholders pelos valores que voce ja tem no carrinho.
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
            nao esta disponivel.
          </p>
          <pre className="bg-carbone text-blanc-casse text-xs p-5 overflow-x-auto font-mono leading-relaxed">
{trackClickSnippet}
          </pre>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">Onde encontrar o recommendationId</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            O <code className="text-carbone bg-ivoire px-1.5 py-0.5">recommendationId</code> esta
            disponivel no link de cada produto recomendado no resultado da analise. Se voce
            usa integracao com Nuvemshop ou Shopify, o identificador e propagado automaticamente
            via UTM. Para integracoes manuais, contate o suporte e ajustamos o pipeline.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-serif text-xl text-carbone">Privacidade e LGPD</h2>
          <p className="text-sm text-pierre font-light leading-relaxed">
            O pixel registra apenas o identificador da recomendacao e o valor da venda.
            Nao coleta IP, cookies de terceiros, nem dados pessoais do cliente final.
            E compativel com LGPD sem necessidade de consentimento explicito do usuario.
          </p>
        </section>

        <div className="border-t border-sable/30 pt-6">
          <p className="text-xs text-pierre font-light">
            Duvidas tecnicas? Contate o time Skinner em{" "}
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
