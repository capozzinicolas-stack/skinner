import { notFound } from "next/navigation";
import { db } from "@skinner/db";

// ─── Label maps ────────────────────────────────────────────────────────────────

const skinTypeLabels: Record<string, string> = {
  oily: "Oleosa",
  dry: "Seca",
  combination: "Mista",
  normal: "Normal",
  sensitive: "Sensivel",
};

const conditionLabels: Record<string, string> = {
  acne: "Acne",
  hyperpigmentation: "Hiperpigmentacao",
  aging: "Envelhecimento",
  dehydration: "Desidratacao",
  sensitivity: "Sensibilidade",
  rosacea: "Rosacea",
  pores: "Poros dilatados",
  dullness: "Opacidade",
  dark_circles: "Olheiras",
  oiliness: "Oleosidade",
};

const stepLabels: Record<string, string> = {
  cleanser: "Limpeza",
  toner: "Tonico",
  serum: "Serum",
  moisturizer: "Hidratante",
  SPF: "Protetor Solar",
  treatment: "Tratamento",
};

const sessionFrequencyLabels: Record<string, string> = {
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

const DEFAULT_WHATSAPP_MESSAGE =
  "Ola, gostaria de adquirir o produto {produto} (R$ {preco}) recomendado pela analise Skinner.";

function buildWhatsAppUrl(
  number: string,
  template: string,
  productName: string,
  price?: number | null
): string {
  const priceStr = price != null ? price.toFixed(2) : "";
  const message = template
    .replace("{produto}", productName)
    .replace("{preco}", priceStr)
    .replace("{kit}", "")
    .replace("{cliente}", "");
  const cleaned = number.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function KitPage({
  params,
}: {
  params: { kitId: string };
}) {
  const analysis = await db.analysis.findUnique({
    where: { kitLink: params.kitId },
    include: {
      tenant: {
        include: { tenantConfig: true },
      },
      recommendations: {
        orderBy: { rank: "asc" },
        include: { product: true },
      },
    },
  });

  if (!analysis || analysis.status !== "completed") {
    notFound();
  }

  const { tenant } = analysis;
  const config = tenant.tenantConfig;

  // Kit feature flag: if explicitly disabled, show 404
  if (config && config.kitEnabled === false) {
    notFound();
  }

  // Parse stored JSON fields
  const conditions: { name: string; severity: number; description: string }[] =
    analysis.conditions ? JSON.parse(analysis.conditions) : [];

  // Separate products and services
  const productRecs = analysis.recommendations.filter(
    (r) => !r.product.type || r.product.type === "product"
  );
  const serviceRecs = analysis.recommendations.filter(
    (r) => r.product.type === "service"
  );

  // Compute totals (products only — services are priced per consultation)
  const productTotal = productRecs.reduce(
    (sum, r) => sum + (r.product.price ?? 0),
    0
  );
  const kitDiscount = config?.kitDiscount ?? null;
  const discountedTotal =
    kitDiscount !== null ? productTotal * (1 - kitDiscount / 100) : null;

  // Storefront config
  const storefrontEnabled = config?.storefrontEnabled ?? false;
  const storefrontCtaMode = config?.storefrontCtaMode ?? "external";
  const whatsappNumber = config?.whatsappNumber ?? null;
  const whatsappMessage = config?.whatsappMessage ?? DEFAULT_WHATSAPP_MESSAGE;
  const mercadoPagoEnabled = config?.mercadoPagoEnabled ?? false;
  const mercadoPagoEmail = config?.mercadoPagoEmail ?? null;

  return (
    <main className="min-h-screen bg-blanc-casse">
      {/* Header */}
      <header className="py-4 px-6 border-b border-sable/20 flex items-center justify-center bg-white">
        {tenant.logoUrl ? (
          <img src={tenant.logoUrl} alt={tenant.name} className="h-8 object-contain" />
        ) : (
          <img src="/brand/logo-primary.png" alt="Skinner" className="h-[72px] object-contain" />
        )}
      </header>

      <div className="w-full max-w-lg mx-auto px-4 py-10 pb-16">

        {/* Kit headline */}
        <div className="text-center mb-10">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
            Kit de Tratamento Personalizado
          </p>
          <h1 className="font-serif text-2xl text-carbone italic">
            Pele {skinTypeLabels[analysis.skinType ?? ""] ?? analysis.skinType}
          </h1>
          <div className="w-12 h-px bg-sable mx-auto mt-4 mb-4" />
          <p className="text-sm text-pierre font-light leading-relaxed">
            Protocolo completo gerado especificamente para o seu perfil de pele.
          </p>
        </div>

        {/* Conditions summary */}
        {conditions.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-lg text-carbone mb-4">
              Condicoes Identificadas
            </h2>
            <div className="space-y-3">
              {conditions.map((condition) => (
                <div
                  key={condition.name}
                  className="p-5 bg-white border border-sable/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-carbone">
                      {conditionLabels[condition.name] ?? condition.name}
                    </span>
                    <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                      {["", "Leve", "Moderado", "Severo"][condition.severity] ?? ""}
                    </span>
                  </div>
                  <p className="text-xs text-pierre font-light leading-relaxed">
                    {condition.description}
                  </p>
                  <div className="flex gap-1 mt-3">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-0.5 flex-1 ${
                          level <= condition.severity ? "bg-carbone" : "bg-sable/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended products */}
        {productRecs.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-lg text-carbone mb-4">
              Produtos Recomendados
            </h2>
            <div className="space-y-3">
              {productRecs.map((rec, idx) => {
                const showExternal =
                  storefrontCtaMode === "external" && !!rec.product.ecommerceLink;
                const showWhatsApp =
                  storefrontEnabled &&
                  (storefrontCtaMode === "whatsapp" || storefrontCtaMode === "both") &&
                  !!whatsappNumber;
                const showMercadoPago =
                  storefrontEnabled &&
                  mercadoPagoEnabled &&
                  (storefrontCtaMode === "mercadopago" || storefrontCtaMode === "both") &&
                  !!mercadoPagoEmail;

                return (
                  <div key={rec.id} className="p-5 bg-white border border-sable/20">
                    <div className="flex gap-4">
                      {rec.product.imageUrl ? (
                        <img
                          src={rec.product.imageUrl}
                          alt={rec.product.name}
                          className="w-16 h-16 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-ivoire flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-pierre font-light">
                            #{idx + 1}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm text-carbone">{rec.product.name}</h3>
                            {rec.product.stepRoutine && (
                              <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                                {stepLabels[rec.product.stepRoutine] ?? rec.product.stepRoutine}
                              </span>
                            )}
                          </div>
                          {rec.product.price != null && (
                            <span className="text-sm text-carbone flex-shrink-0">
                              R$ {rec.product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-pierre font-light mt-1">{rec.reason}</p>
                        {rec.howToUse && (
                          <p className="text-xs text-pierre/60 font-light mt-1 italic">
                            {rec.howToUse}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {showExternal && (
                            <a
                              href={`${rec.product.ecommerceLink}?skr_ref=${rec.trackingRef}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
                            >
                              Comprar
                            </a>
                          )}
                          {showWhatsApp && (
                            <a
                              href={buildWhatsAppUrl(
                                whatsappNumber!,
                                whatsappMessage,
                                rec.product.name,
                                rec.product.price
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
                            >
                              Comprar via WhatsApp
                            </a>
                          )}
                          {showMercadoPago && (
                            <a
                              href={`mailto:${mercadoPagoEmail}?subject=Pagamento ${encodeURIComponent(rec.product.name)}`}
                              className="inline-block px-4 py-2 border border-sable/40 text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors"
                            >
                              Pagar
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended services */}
        {serviceRecs.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-lg text-carbone mb-4">
              Tratamentos Recomendados
            </h2>
            <div className="space-y-3">
              {serviceRecs.map((rec, idx) => {
                const showExternal =
                  storefrontCtaMode === "external" && !!rec.product.bookingLink;
                const showWhatsApp =
                  storefrontEnabled &&
                  (storefrontCtaMode === "whatsapp" || storefrontCtaMode === "both") &&
                  !!whatsappNumber;
                const showMercadoPago =
                  storefrontEnabled &&
                  mercadoPagoEnabled &&
                  (storefrontCtaMode === "mercadopago" || storefrontCtaMode === "both") &&
                  !!mercadoPagoEmail;

                return (
                  <div key={rec.id} className="p-5 bg-white border border-sable/20">
                    <div className="flex gap-4">
                      {rec.product.imageUrl ? (
                        <img
                          src={rec.product.imageUrl}
                          alt={rec.product.name}
                          className="w-16 h-16 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-ivoire flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-pierre font-light">
                            #{idx + 1}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm text-carbone">
                              {rec.product.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {rec.product.sessionCount != null && (
                                <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                                  {rec.product.sessionCount}{" "}
                                  {rec.product.sessionCount === 1 ? "sessao" : "sessoes"}
                                </span>
                              )}
                              {rec.product.sessionCount != null &&
                                (rec.product.sessionFrequency || rec.product.durationMinutes) && (
                                  <span className="text-[10px] text-pierre/40 font-light">·</span>
                                )}
                              {rec.product.sessionFrequency && (
                                <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                                  {sessionFrequencyLabels[rec.product.sessionFrequency] ??
                                    rec.product.sessionFrequency}
                                </span>
                              )}
                              {rec.product.sessionFrequency && rec.product.durationMinutes && (
                                <span className="text-[10px] text-pierre/40 font-light">·</span>
                              )}
                              {rec.product.durationMinutes != null && (
                                <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                                  {rec.product.durationMinutes} min
                                </span>
                              )}
                            </div>
                          </div>
                          {rec.product.price != null && (
                            <span className="text-sm text-carbone flex-shrink-0">
                              R$ {rec.product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-pierre font-light mt-1">{rec.reason}</p>
                        {rec.howToUse && (
                          <p className="text-xs text-pierre/60 font-light mt-1 italic">
                            {rec.howToUse}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {showExternal && (
                            <a
                              href={`${rec.product.bookingLink}?skr_ref=${rec.trackingRef}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
                            >
                              Agendar
                            </a>
                          )}
                          {showWhatsApp && (
                            <a
                              href={buildWhatsAppUrl(
                                whatsappNumber!,
                                whatsappMessage,
                                rec.product.name,
                                rec.product.price
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
                            >
                              Agendar via WhatsApp
                            </a>
                          )}
                          {showMercadoPago && (
                            <a
                              href={`mailto:${mercadoPagoEmail}?subject=Pagamento ${encodeURIComponent(rec.product.name)}`}
                              className="inline-block px-4 py-2 border border-sable/40 text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors"
                            >
                              Pagar
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kit total pricing */}
        {productTotal > 0 && (
          <div className="mb-8 p-5 bg-white border border-sable/20">
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-4">
              Resumo do Kit
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-pierre font-light">
                  Total dos produtos
                </span>
                {discountedTotal !== null ? (
                  <span className="text-sm text-pierre font-light line-through">
                    R$ {productTotal.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm text-carbone">
                    R$ {productTotal.toFixed(2)}
                  </span>
                )}
              </div>
              {discountedTotal !== null && kitDiscount !== null && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-pierre font-light">
                      Desconto do kit ({kitDiscount}%)
                    </span>
                    <span className="text-sm text-terre font-light">
                      - R$ {(productTotal - discountedTotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-sable/20 my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-carbone">Total com desconto</span>
                    <span className="text-base text-carbone font-serif">
                      R$ {discountedTotal.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {tenant.disclaimer && (
          <div className="mb-6 p-5 bg-ivoire border border-sable/20">
            <p className="text-xs text-pierre font-light italic leading-relaxed">
              {tenant.disclaimer}
            </p>
          </div>
        )}

        <p className="text-[10px] text-sable text-center uppercase tracking-wider font-light">
          Powered by Skinner
        </p>
      </div>
    </main>
  );
}
