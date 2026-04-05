import type { AnalysisOutput, MatchedProduct } from "./types";
import { db } from "@skinner/db";

/**
 * Match analysis results to products from the tenant's catalog.
 * Scores products based on concern overlap, skin type compatibility,
 * objective alignment, and severity matching.
 */
export async function matchProducts(
  tenantId: string,
  analysis: AnalysisOutput
): Promise<MatchedProduct[]> {
  const products = await db.product.findMany({
    where: { tenantId, isActive: true },
  });

  if (products.length === 0) return [];

  const detectedConcerns = analysis.conditions.map((c) => c.name);
  const maxSeverity = Math.max(...analysis.conditions.map((c) => c.severity), 1);
  const isPregnant = false; // TODO: pass from questionnaire

  const scored = products
    .map((product) => {
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
      const step = product.stepRoutine ? stepLabels[product.stepRoutine] ?? product.stepRoutine : "";
      const time = timeLabels[product.useTime] ?? "manhã e noite";
      const howToUse = `Usar na etapa de ${step || "tratamento"}, ${time}. Aplicar conforme instrução do produto.`;

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
        reason: reasons.join(". ") || "Produto adequado para seu perfil de pele.",
        howToUse,
      } satisfies MatchedProduct;
    })
    .filter(Boolean) as MatchedProduct[];

  // Sort by score descending, return top 5
  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

function safeParseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
