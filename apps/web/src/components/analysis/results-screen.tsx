"use client";

import { useState } from "react";
import type { FullAnalysisResult, MatchedProduct } from "@/lib/sae/types";
import { AnnotatedPhoto } from "@/components/analysis/annotated-photo";
import { SkinRadarChart } from "@/components/analysis/skin-radar-chart";
import { SkinProjection } from "@/components/analysis/skin-projection";
import { useCartSafe } from "@/lib/cart/cart-store";
import { resolveProductChannel } from "@/lib/cart/resolve-channel";
import {
  skinTypeLabels as skinTypeLabelsRaw,
  conditionLabels as conditionLabelsRaw,
  barrierStatusLabels,
} from "@/lib/sae/labels";

// Local capitalized variants for display headings (labels.ts uses lowercase for inline use)
const skinTypeLabels: Record<string, string> = Object.fromEntries(
  Object.entries(skinTypeLabelsRaw).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);
const conditionLabels: Record<string, string> = Object.fromEntries(
  Object.entries(conditionLabelsRaw).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])
);

const barrierLabels: Record<string, { label: string; color: string; explanation: string }> = {
  healthy: {
    label: barrierStatusLabels.healthy.short,
    explanation: barrierStatusLabels.healthy.explanation,
    color: "bg-ivoire text-terre",
  },
  compromised: {
    label: barrierStatusLabels.compromised.short,
    explanation: barrierStatusLabels.compromised.explanation,
    color: "bg-ivoire text-terre border-sable",
  },
  needs_attention: {
    label: barrierStatusLabels.needs_attention.short,
    explanation: barrierStatusLabels.needs_attention.explanation,
    color: "bg-ivoire text-terre border-sable",
  },
};

const severityLabels = ["", "Leve", "Moderado", "Severo"];

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

// Config shape passed from B2C analysis page
export type ResultsConfig = {
  resultsShowBarrier?: boolean;
  resultsShowConditions?: boolean;
  resultsShowConditionsDesc?: boolean;
  resultsShowSeverityBars?: boolean;
  resultsShowActionPlan?: boolean;
  resultsShowTimeline?: boolean;
  resultsShowAlertSigns?: boolean;
  resultsShowProducts?: boolean;
  resultsShowServices?: boolean;
  resultsShowMatchScore?: boolean;
  resultsShowPdfButton?: boolean;
  resultsShowPrices?: boolean;
  resultsShowAnnotatedPhoto?: boolean;
  resultsTopMessage?: string | null;
  resultsFooterText?: string | null;
  productCtaText?: string | null;
  serviceCtaText?: string | null;
  maxProductRecs?: number | null;
  maxServiceRecs?: number | null;
  // Storefront Lite
  storefrontEnabled?: boolean;
  storefrontCtaMode?: string | null;
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
  mercadoPagoEnabled?: boolean;
  mercadoPagoEmail?: string | null;
  // Skin projection feature
  projectionEnabled?: boolean;
};

// Extended MatchedProduct to include optional service fields
type MatchedProductExtended = MatchedProduct & {
  type?: string | null;
  bookingLink?: string | null;
  sessionCount?: number | null;
  sessionFrequency?: string | null;
  durationMinutes?: number | null;
};

function buildWhatsAppUrl(
  number: string,
  template: string,
  productName: string,
  price?: number | null,
  kitName?: string,
  clientName?: string
): string {
  const priceStr = price != null ? price.toFixed(2) : "";
  const message = template
    .replace("{produto}", productName)
    .replace("{preco}", priceStr)
    .replace("{kit}", kitName ?? "")
    .replace("{cliente}", clientName ?? "");
  const cleaned = number.replace(/\D/g, "");
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

function ProductCard({
  rec,
  idx,
  showMatchScore,
  showPrice,
  ctaText,
  storefrontCtaMode,
  storefrontEnabled,
  whatsappNumber,
  whatsappMessage,
  mercadoPagoEnabled,
  mercadoPagoEmail,
  cartChannel,
  primaryColor,
  secondaryColor,
}: {
  rec: MatchedProductExtended;
  idx: number;
  showMatchScore: boolean;
  showPrice: boolean;
  ctaText: string;
  storefrontCtaMode: string;
  storefrontEnabled: boolean;
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
  mercadoPagoEnabled: boolean;
  mercadoPagoEmail?: string | null;
  // Optional cart-driven flow. When cartChannel is provided AND cart context
  // is available, the card renders a single Adicionar/No carrinho toggle
  // instead of the legacy 1-3 channel-specific buttons. Falls back to legacy
  // CTAs for any environment without the cart provider (kits manuais embed
  // outside the new analise flow today).
  cartChannel?: import("@/lib/cart/types").CartChannel;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const cartCtx = useCartSafe();
  const useCartFlow = !!cartCtx && !!cartChannel;

  const showWhatsApp =
    !useCartFlow &&
    storefrontEnabled &&
    (storefrontCtaMode === "whatsapp" || storefrontCtaMode === "both") &&
    !!whatsappNumber;

  const showMercadoPago =
    !useCartFlow &&
    storefrontEnabled &&
    mercadoPagoEnabled &&
    (storefrontCtaMode === "mercadopago" || storefrontCtaMode === "both") &&
    !!mercadoPagoEmail;

  const showExternal =
    !useCartFlow && storefrontCtaMode === "external" && !!rec.ecommerceLink;

  const template = whatsappMessage || DEFAULT_WHATSAPP_MESSAGE;
  const inCart = useCartFlow ? cartCtx!.hasItem(rec.productId) : false;
  const brandPrimary = primaryColor || "#1C1917";
  const brandSecondary = secondaryColor || brandPrimary;

  return (
    <div className="p-5 bg-white border border-sable/20">
      <div className="flex gap-4">
        {rec.imageUrl ? (
          <img src={rec.imageUrl} alt={rec.name} className="w-16 h-16 object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 bg-ivoire flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-pierre font-light">#{idx + 1}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm text-carbone">{rec.name}</h4>
                {rec.recommendationTag && (
                  <span className={`text-[9px] px-2 py-0.5 uppercase tracking-wider font-light ${
                    rec.recommendationTag === "recomendado"
                      ? "bg-carbone text-blanc-casse"
                      : "bg-ivoire text-terre border border-sable/30"
                  }`}>
                    {rec.recommendationTag}
                  </span>
                )}
              </div>
              {rec.stepRoutine && (
                <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  {stepLabels[rec.stepRoutine] ?? rec.stepRoutine}
                </span>
              )}
            </div>
            {showPrice && rec.price && (
              <span className="text-sm text-carbone flex-shrink-0">
                R$ {rec.price.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-xs text-pierre font-light mt-1">{rec.reason}</p>
          <p className="text-xs text-pierre/60 font-light mt-1 italic">{rec.howToUse}</p>
          {showMatchScore && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-px bg-sable/30">
                <div className="h-full bg-carbone" style={{ width: `${rec.matchScore * 100}%` }} />
              </div>
              <span className="text-[10px] text-pierre font-light">
                {Math.round(rec.matchScore * 100)}%
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {useCartFlow ? (
              <button
                type="button"
                onClick={() => {
                  if (!cartCtx || !cartChannel) return;
                  if (inCart) {
                    cartCtx.removeItem(rec.productId);
                    return;
                  }
                  const item = {
                    productId: rec.productId,
                    name: rec.name,
                    price: rec.price ?? 0,
                    imageUrl: rec.imageUrl ?? null,
                    channel: cartChannel,
                    channelRef: rec.sku || rec.ecommerceLink || "",
                    trackingRef: rec.productId,
                    recommendationTag: rec.recommendationTag,
                  };
                  const result = cartCtx.addItem(item);
                  if (!result.ok && result.reason === "channel-mismatch") {
                    const ok = window.confirm(
                      `Você já tem itens de ${result.existingChannel}. Adicionar este item de ${cartChannel} vai substituir o carrinho. Confirmar?`
                    );
                    if (ok) cartCtx.replaceCart(item);
                  }
                }}
                style={
                  inCart
                    ? { backgroundColor: brandPrimary }
                    : { borderColor: brandPrimary, color: brandPrimary }
                }
                onMouseEnter={(e) => {
                  if (inCart) e.currentTarget.style.backgroundColor = brandSecondary;
                }}
                onMouseLeave={(e) => {
                  if (inCart) e.currentTarget.style.backgroundColor = brandPrimary;
                }}
                className={`inline-block px-4 py-2 text-xs font-light tracking-wide transition-colors ${
                  inCart ? "text-blanc-casse" : "border bg-white"
                }`}
              >
                {inCart ? "✓ No carrinho" : "Adicionar"}
              </button>
            ) : (
              <>
                {showExternal && (
                  <a
                    href={`${rec.ecommerceLink}?skr_ref=${rec.productId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
                  >
                    {ctaText}
                  </a>
                )}
                {showWhatsApp && (
                  <a
                    href={buildWhatsAppUrl(whatsappNumber!, template, rec.name, rec.price)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
                  >
                    Comprar via WhatsApp
                  </a>
                )}
                {showMercadoPago && (
                  <a
                    href={`mailto:${mercadoPagoEmail}?subject=Pagamento ${encodeURIComponent(rec.name)}`}
                    className="inline-block px-4 py-2 border border-sable/40 text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors"
                  >
                    Pagar
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  rec,
  idx,
  showMatchScore,
  showPrice,
  ctaText,
  storefrontCtaMode,
  storefrontEnabled,
  whatsappNumber,
  whatsappMessage,
  mercadoPagoEnabled,
  mercadoPagoEmail,
}: {
  rec: MatchedProductExtended;
  idx: number;
  showMatchScore: boolean;
  showPrice: boolean;
  ctaText: string;
  storefrontCtaMode: string;
  storefrontEnabled: boolean;
  whatsappNumber?: string | null;
  whatsappMessage?: string | null;
  mercadoPagoEnabled: boolean;
  mercadoPagoEmail?: string | null;
}) {
  const showWhatsApp =
    storefrontEnabled &&
    (storefrontCtaMode === "whatsapp" || storefrontCtaMode === "both") &&
    !!whatsappNumber;

  const showMercadoPago =
    storefrontEnabled &&
    mercadoPagoEnabled &&
    (storefrontCtaMode === "mercadopago" || storefrontCtaMode === "both") &&
    !!mercadoPagoEmail;

  const showExternal = storefrontCtaMode === "external" && !!rec.bookingLink;

  const template = whatsappMessage || DEFAULT_WHATSAPP_MESSAGE;

  return (
    <div className="p-5 bg-white border border-sable/20">
      <div className="flex gap-4">
        {rec.imageUrl ? (
          <img src={rec.imageUrl} alt={rec.name} className="w-16 h-16 object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 bg-ivoire flex items-center justify-center flex-shrink-0">
            <span className="text-xs text-pierre font-light">#{idx + 1}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm text-carbone">{rec.name}</h4>
              {/* Session info row */}
              <div className="flex flex-wrap gap-2 mt-1">
                {rec.sessionCount && (
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    {rec.sessionCount} {rec.sessionCount === 1 ? "sessao" : "sessoes"}
                  </span>
                )}
                {rec.sessionCount && (rec.sessionFrequency || rec.durationMinutes) && (
                  <span className="text-[10px] text-pierre/40 font-light">·</span>
                )}
                {rec.sessionFrequency && (
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    {sessionFrequencyLabels[rec.sessionFrequency] ?? rec.sessionFrequency}
                  </span>
                )}
                {rec.sessionFrequency && rec.durationMinutes && (
                  <span className="text-[10px] text-pierre/40 font-light">·</span>
                )}
                {rec.durationMinutes && (
                  <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                    {rec.durationMinutes} min
                  </span>
                )}
              </div>
            </div>
            {showPrice && rec.price && (
              <span className="text-sm text-carbone flex-shrink-0">
                R$ {rec.price.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-xs text-pierre font-light mt-1">{rec.reason}</p>
          <p className="text-xs text-pierre/60 font-light mt-1 italic">{rec.howToUse}</p>
          {showMatchScore && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-px bg-sable/30">
                <div className="h-full bg-carbone" style={{ width: `${rec.matchScore * 100}%` }} />
              </div>
              <span className="text-[10px] text-pierre font-light">
                {Math.round(rec.matchScore * 100)}%
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {showExternal && (
              <a
                href={`${rec.bookingLink}?skr_ref=${rec.productId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
              >
                {ctaText}
              </a>
            )}
            {showWhatsApp && (
              <a
                href={buildWhatsAppUrl(whatsappNumber!, template, rec.name, rec.price)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
              >
                Agendar via WhatsApp
              </a>
            )}
            {showMercadoPago && (
              <a
                href={`mailto:${mercadoPagoEmail}?subject=Pagamento ${encodeURIComponent(rec.name)}`}
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
}

export function ResultsScreen({
  result,
  tenantName,
  disclaimer,
  primaryColor,
  secondaryColor,
  config,
  photoBase64,
  tenantIntegrations,
}: {
  result: FullAnalysisResult;
  tenantName: string;
  disclaimer?: string;
  primaryColor: string;
  secondaryColor?: string;
  config?: ResultsConfig;
  photoBase64?: string;
  // Active integrations on the tenant (passed from the parent page when the
  // cart flow is enabled). Used to resolve which checkout channel each
  // product card uses. When undefined, ProductCard falls back to legacy CTAs.
  tenantIntegrations?: Array<{ platform: string; status: string; storeId?: string | null }>;
}) {
  // brandHover falls back to primaryColor if the tenant didn't set a
  // secondary so we never get a flash of an unrelated color on hover.
  const brandHover = secondaryColor || primaryColor;
  const { analysis, recommendations } = result;
  const barrier = barrierLabels[analysis.barrier_status] ?? barrierLabels.healthy;
  const [showPlan, setShowPlan] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [kitCopied, setKitCopied] = useState(false);

  // Config defaults (all on by default to preserve existing behaviour)
  const showBarrier = config?.resultsShowBarrier ?? true;
  const showConditions = config?.resultsShowConditions ?? true;
  const showConditionsDesc = config?.resultsShowConditionsDesc ?? true;
  const showSeverityBars = config?.resultsShowSeverityBars ?? true;
  const showActionPlan = config?.resultsShowActionPlan ?? true;
  const showAlertSigns = config?.resultsShowAlertSigns ?? true;
  const showProducts = config?.resultsShowProducts ?? true;
  const showServices = config?.resultsShowServices ?? true;
  const showMatchScore = config?.resultsShowMatchScore ?? true;
  const showPdfButton = config?.resultsShowPdfButton ?? true;
  const showPrices = config?.resultsShowPrices ?? true;
  const showAnnotatedPhoto = config?.resultsShowAnnotatedPhoto ?? true;
  const topMessage = config?.resultsTopMessage ?? null;
  const footerText = config?.resultsFooterText ?? null;
  const productCtaText = config?.productCtaText || "Comprar";
  const serviceCtaText = config?.serviceCtaText || "Agendar";
  const maxProducts = config?.maxProductRecs ?? null;
  const maxServices = config?.maxServiceRecs ?? null;
  // Projection feature — defaults to true so existing tenants see it once schema is migrated
  const projectionEnabled = config?.projectionEnabled ?? true;

  // Storefront config
  const storefrontEnabled = config?.storefrontEnabled ?? false;
  const storefrontCtaMode = config?.storefrontCtaMode ?? "external";
  const whatsappNumber = config?.whatsappNumber ?? null;
  const whatsappMessage = config?.whatsappMessage ?? null;
  const mercadoPagoEnabled = config?.mercadoPagoEnabled ?? false;
  const mercadoPagoEmail = config?.mercadoPagoEmail ?? null;

  // Split recommendations into products and services
  const extendedRecs = recommendations as MatchedProductExtended[];
  const allProductRecs = extendedRecs.filter((r) => !r.type || r.type === "product");
  const allServiceRecs = extendedRecs.filter((r) => r.type === "service");
  const productRecs = maxProducts != null ? allProductRecs.slice(0, maxProducts) : allProductRecs;
  const serviceRecs = maxServices != null ? allServiceRecs.slice(0, maxServices) : allServiceRecs;

  const kitUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/kit/${result.kitLink}`
      : `/kit/${result.kitLink}`;

  function handleCopyKit() {
    navigator.clipboard.writeText(kitUrl).then(() => {
      setKitCopied(true);
      setTimeout(() => setKitCopied(false), 2500);
    });
  }

  // Determine whether to render the annotated photo section
  const hasAnnotations =
    showAnnotatedPhoto &&
    !!photoBase64 &&
    Array.isArray(analysis.zone_annotations) &&
    analysis.zone_annotations.length > 0;

  return (
    <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 pb-12">
      {/* Custom top message */}
      {topMessage && (
        <div className="mb-6 p-4 bg-ivoire border border-sable/20">
          <p className="text-sm text-terre font-light leading-relaxed">{topMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[10px] text-pierre uppercase tracking-skinners font-light mb-4">
          Resultado da Analise
        </p>
        <h2 className="font-serif text-2xl text-carbone italic">
          Sua pele e{" "}
          {skinTypeLabels[analysis.skin_type] ?? analysis.skin_type}
        </h2>
        <div className="w-12 h-px bg-sable mx-auto mt-4 mb-4" />
        <p className="text-sm text-pierre font-light leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Skin type discrepancy notice */}
      {analysis.skin_type_discrepancy && analysis.skin_type_self_reported && (
        <div className="mb-6 p-5 bg-ivoire border border-sable/20">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-2">
            Observacao sobre seu tipo de pele
          </p>
          <p className="text-sm text-terre font-light leading-relaxed">
            Voce informou que sua pele e{" "}
            <span className="text-carbone">{skinTypeLabels[analysis.skin_type_self_reported] ?? analysis.skin_type_self_reported}</span>,
            porem nossa analise identificou que sua pele e{" "}
            <span className="text-carbone">{skinTypeLabels[analysis.skin_type] ?? analysis.skin_type}</span>.
          </p>
          <p className="text-xs text-pierre font-light mt-2 leading-relaxed">
            {analysis.skin_type_discrepancy}
          </p>
        </div>
      )}

      {/* Mapa Facial + Radar — side by side on desktop, stacked on mobile */}
      {(hasAnnotations || (analysis.zone_annotations && analysis.zone_annotations.length > 0)) && (
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {hasAnnotations && (
            <div>
              <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-3">
                Mapa Facial
              </p>
              <AnnotatedPhoto
                photoBase64={photoBase64!}
                annotations={analysis.zone_annotations}
              />
            </div>
          )}
          {analysis.zone_annotations && analysis.zone_annotations.length > 0 && (
            <div className="p-5 bg-white border border-sable/20">
              <SkinRadarChart annotations={analysis.zone_annotations} />
            </div>
          )}
        </div>
      )}

      {/* Skin projection — on-demand, only when photo is available and feature is enabled */}
      {projectionEnabled && !!photoBase64 && analysis.conditions.length > 0 && (
        <SkinProjection
          photoBase64={photoBase64}
          conditions={analysis.conditions.map((c) => ({
            name: c.name,
            severity: c.severity,
          }))}
          primaryObjective={analysis.primary_objective}
          products={recommendations
            .filter((r) => r.recommendationTag === "recomendado")
            .map((r) => ({
              name: r.name,
              activeIngredients: r.activeIngredients ?? [],
              stepRoutine: r.stepRoutine,
            }))}
        />
      )}

      {/* Barrier status */}
      {showBarrier && (
        <div className="mb-6 p-5 bg-white border border-sable/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-pierre uppercase tracking-wider font-light">Estado da sua pele</span>
            <span className={`text-xs px-3 py-1 ${barrier.color}`}>
              {barrier.label}
            </span>
          </div>
          {barrier.explanation && (
            <p className="text-xs text-pierre font-light mt-2 leading-relaxed">
              {barrier.explanation}
            </p>
          )}
        </div>
      )}

      {/* Conditions */}
      {showConditions && (
        <div className="mb-8">
          <h3 className="font-serif text-lg text-carbone mb-4">
            O que observamos na sua pele
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.conditions.map((condition) => (
              <div key={condition.name} className="p-5 bg-white border border-sable/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-carbone">
                    {conditionLabels[condition.name] ?? condition.name}
                  </span>
                  <span className="text-xs text-pierre font-light">
                    {severityLabels[condition.severity]}
                  </span>
                </div>
                {showConditionsDesc && (
                  <p className="text-xs text-pierre font-light leading-relaxed">{condition.description}</p>
                )}
                {showSeverityBars && (
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action plan */}
      {showActionPlan && (
        <div className="mb-8">
          <button
            onClick={() => setShowPlan(!showPlan)}
            className="w-full flex items-center justify-between p-5 bg-white border border-sable/20 hover:bg-ivoire transition-colors"
          >
            <span className="font-serif text-lg text-carbone">Seu cuidado em 3 fases</span>
            <span className="text-pierre text-xs">{showPlan ? "fechar" : "abrir"}</span>
          </button>
          {showPlan && (
            <div className="mt-px space-y-px">
              {[
                { phase: "Comecando", period: "Semanas 1-2", text: analysis.action_plan.phase1 },
                { phase: "Avancando", period: "Semanas 3-8", text: analysis.action_plan.phase2 },
                { phase: "Mantendo", period: "Mes 3+", text: analysis.action_plan.phase3 },
              ].map(({ phase, period, text }) => (
                <div key={phase} className="p-5 bg-white border border-sable/20">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-carbone uppercase tracking-wider">{phase}</span>
                    <span className="text-xs text-pierre font-light">{period}</span>
                  </div>
                  <p className="text-sm text-pierre font-light leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended products */}
      {showProducts && productRecs.length > 0 && (
        <div className="mb-8">
          <h3 className="font-serif text-lg text-carbone mb-4">
            Produtos Recomendados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productRecs.map((rec, idx) => {
              // Resolve the channel only when the parent passed integrations
              // info AND there's a cart provider in scope. Otherwise the card
              // falls back to its legacy CTA stack.
              const channel = tenantIntegrations
                ? resolveProductChannel({
                    product: {
                      type: rec.type,
                      ecommerceLink: rec.ecommerceLink,
                      bookingLink: rec.bookingLink,
                      sku: rec.sku,
                    },
                    tenantConfig: {
                      storefrontEnabled,
                      storefrontCtaMode,
                      whatsappNumber,
                      mercadoPagoEnabled,
                      mercadoPagoEmail,
                    },
                    integrations: tenantIntegrations,
                  })
                : undefined;
              return (
                <ProductCard
                  key={rec.productId}
                  rec={rec}
                  idx={idx}
                  showMatchScore={showMatchScore}
                  showPrice={showPrices}
                  ctaText={productCtaText}
                  storefrontCtaMode={storefrontCtaMode}
                  storefrontEnabled={storefrontEnabled}
                  whatsappNumber={whatsappNumber}
                  whatsappMessage={whatsappMessage}
                  mercadoPagoEnabled={mercadoPagoEnabled}
                  mercadoPagoEmail={mercadoPagoEmail}
                  cartChannel={channel}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended services/treatments */}
      {showServices && serviceRecs.length > 0 && (
        <div className="mb-8">
          <h3 className="font-serif text-lg text-carbone mb-4">
            Tratamentos Recomendados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {serviceRecs.map((rec, idx) => (
              <ServiceCard
                key={rec.productId}
                rec={rec}
                idx={idx}
                showMatchScore={showMatchScore}
                showPrice={showPrices}
                ctaText={serviceCtaText}
                storefrontCtaMode={storefrontCtaMode}
                storefrontEnabled={storefrontEnabled}
                whatsappNumber={whatsappNumber}
                whatsappMessage={whatsappMessage}
                mercadoPagoEnabled={mercadoPagoEnabled}
                mercadoPagoEmail={mercadoPagoEmail}
              />
            ))}
          </div>
        </div>
      )}

      {/* Kit CTA */}
      {result.kitLink && (
        <div className="mb-8 p-5 bg-white border border-sable/20">
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light mb-1">
            Kit de Tratamento
          </p>
          <h4 className="font-serif text-base text-carbone mb-2">
            Todos os seus produtos em um link
          </h4>
          <p className="text-xs text-pierre font-light mb-4 leading-relaxed">
            Compartilhe seu kit personalizado ou acesse-o a qualquer momento.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyKit}
              className="flex-1 px-4 py-2.5 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
            >
              {kitCopied ? "Link copiado" : "Compartilhar Kit"}
            </button>
            <a
              href={kitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2.5 border border-sable/40 text-terre text-xs font-light tracking-wide hover:bg-ivoire transition-colors"
            >
              Ver Kit Completo
            </a>
          </div>
        </div>
      )}

      {/* Alert signs */}
      {showAlertSigns && analysis.alert_signs.length > 0 && (
        <div className="mb-8 p-5 bg-ivoire border border-sable/30">
          <h4 className="text-xs text-terre uppercase tracking-wider mb-3">
            Quando consultar um dermatologista
          </h4>
          <ul className="space-y-1">
            {analysis.alert_signs.map((sign, i) => (
              <li key={i} className="text-xs text-terre font-light">{sign}</li>
            ))}
          </ul>
          <p className="text-xs text-pierre font-light mt-3">
            Se apresentar qualquer um destes sinais, consulte um dermatologista.
          </p>
        </div>
      )}

      {/* Email capture */}
      {!emailSent && (
        <div className="mb-8 p-5 bg-white border border-sable/20">
          <h4 className="text-xs text-carbone uppercase tracking-wider mb-3">
            Receba o relatorio completo
          </h4>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="flex-1 px-4 py-2.5 border border-sable/40 bg-blanc-casse text-sm font-light text-carbone focus:outline-none focus:border-terre"
            />
            <button
              onClick={() => { if (email) setEmailSent(true); }}
              className="px-5 py-2.5 bg-carbone text-blanc-casse text-xs font-light tracking-wide hover:bg-terre transition-colors"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
      {emailSent && (
        <div className="mb-8 p-4 bg-ivoire border border-sable/20 text-center">
          <p className="text-sm text-terre font-light">Relatorio enviado para {email}</p>
        </div>
      )}

      {/* Download PDF */}
      {showPdfButton && (
        <div className="mb-8 text-center">
          <a
            href={`/api/report/${result.analysisId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: primaryColor }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = brandHover)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = primaryColor)}
            className="inline-block px-8 py-3 text-blanc-casse text-sm font-light tracking-wide transition-colors"
          >
            Baixar relatorio em PDF
          </a>
        </div>
      )}

      {/* Custom footer text */}
      {footerText && (
        <p className="text-xs text-pierre text-center font-light mb-4">{footerText}</p>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <p className="text-xs text-pierre text-center font-light italic">{disclaimer}</p>
      )}
      <p className="text-[10px] text-sable text-center mt-3 uppercase tracking-skinners font-light">
        Powered by Skinner
      </p>
    </div>
  );
}
