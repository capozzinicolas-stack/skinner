import type { AnalysisOutput, MatchedProduct } from "./types";
import { db } from "@skinner/db";

/**
 * Match analysis results to products from the tenant's catalog.
 * Scores products based on concern overlap, skin type compatibility,
 * objective alignment, and severity matching.
 *
 * Returns top 4 products + top 2 services (if services exist in the catalog).
 * If no services exist, falls back to top 5 products (backwards compatible).
 */
export async function matchProducts(
  tenantId: string,
  analysis: AnalysisOutput
): Promise<MatchedProduct[]> {
  const catalogItems = await db.product.findMany({
    where: { tenantId, isActive: true },
  });

  if (catalogItems.length === 0) return [];

  const detectedConcerns = analysis.conditions.map((c) => c.name);
  const maxSeverity = Math.max(...analysis.conditions.map((c) => c.severity), 1);
  const isPregnant = false; // TODO: pass from questionnaire

  const scoreItem = (product: (typeof catalogItems)[number]): MatchedProduct | null => {
    const concernTags = safeParseArray(product.concernTags);
    const skinTypeTags = safeParseArray(product.skinTypeTags);
    const objectiveTags = safeParseArray(product.objectiveTags);
    const contraindications = safeParseArray(product.contraindications);

    // Skip if contraindicated
    if (isPregnant && contraindications.some((c) => c === "pregnancy" || c === "breastfeeding")) {
      return null;
    }

    // Score: concern match (0-0.4)
    const concernOverlap = detectedConcerns.filter((c) => concernTags.includes(c)).length;
    const concernScore = Math.min(concernOverlap / Math.max(detectedConcerns.length, 1), 1) * 0.4;

    // Score: skin type match (0-0.25)
    const skinTypeMatch = skinTypeTags.includes(analysis.skin_type) ? 0.25 : 0;

    // Score: objective match (0-0.2)
    const objectiveMatch = objectiveTags.includes(analysis.primary_objective) ? 0.2 : 0;

    // Score: severity match (0-0.15)
    const severityDiff = Math.abs(product.severityLevel - Math.min(maxSeverity, 3));
    const severityScore = (1 - severityDiff / 2) * 0.15;

    const matchScore = Math.round((concernScore + skinTypeMatch + objectiveMatch + severityScore) * 100) / 100;

    // Generate reason
    const reasons: string[] = [];
    const matchedConcerns = detectedConcerns.filter((c) => concernTags.includes(c));
    if (matchedConcerns.length > 0) {
      reasons.push(`Trata: ${matchedConcerns.join(", ")}`);
    }
    if (skinTypeMatch > 0) {
      reasons.push(`Compatível com pele ${analysis.skin_type}`);
    }
    if (objectiveMatch > 0) {
      reasons.push(`Alinhado ao objetivo: ${analysis.primary_objective}`);
    }

    // Generate how to use
    const stepLabels: Record<string, string> = {
      cleanser: "Limpeza",
      toner: "Tônico",
      serum: "Sérum",
      moisturizer: "Hidratante",
      SPF: "Protetor Solar",
      treatment: "Tratamento",
    };
    const timeLabels: Record<string, string> = {
      am: "manhã",
      pm: "noite",
      both: "manhã e noite",
    };

    let howToUse: string;
    if (product.type === "service") {
      const sessionInfo = product.sessionCount
        ? `${product.sessionCount} sessão${product.sessionCount > 1 ? "ões" : ""}`
        : "sessões";
      const freqInfo = product.sessionFrequency ? `, frequência ${product.sessionFrequency}` : "";
      const durationInfo = product.durationMinutes ? `, duração de ${product.durationMinutes} minutos cada` : "";
      howToUse = `Tratamento em ${sessionInfo}${freqInfo}${durationInfo}.`;
    } else {
      const step = product.stepRoutine ? stepLabels[product.stepRoutine] ?? product.stepRoutine : "";
      const time = timeLabels[product.useTime] ?? "manhã e noite";
      howToUse = `Usar na etapa de ${step || "tratamento"}, ${time}. Aplicar conforme instrução do produto.`;
    }

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      ecommerceLink: product.ecommerceLink,
      stepRoutine: product.stepRoutine,
      useTime: product.useTime,
      matchScore,
      reason: reasons.join(". ") || "Adequado para seu perfil de pele.",
      howToUse,
      type: product.type,
      bookingLink: product.bookingLink,
      sessionCount: product.sessionCount,
      sessionFrequency: product.sessionFrequency,
      durationMinutes: product.durationMinutes,
    } satisfies MatchedProduct;
  };

  const scored = catalogItems.map(scoreItem).filter(Boolean) as MatchedProduct[];

  const products = scored
    .filter((item) => item.type !== "service")
    .sort((a, b) => b.matchScore - a.matchScore);

  const services = scored
    .filter((item) => item.type === "service")
    .sort((a, b) => b.matchScore - a.matchScore);

  // If no services in catalog, return top 5 products (backwards compatible)
  if (services.length === 0) {
    return products.slice(0, 5);
  }

  // Return top 4 products + top 2 services
  return [...products.slice(0, 4), ...services.slice(0, 2)];
}

function safeParseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
