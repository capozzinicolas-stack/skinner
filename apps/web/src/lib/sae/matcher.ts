import type { AnalysisOutput, MatchedProduct } from "./types";
import { db } from "@skinner/db";
import {
  conditionLabels,
  skinTypeLabels,
  objectiveLabels,
  trList,
  tr,
} from "./labels";

/**
 * Match analysis results to products from the tenant's catalog.
 * Scores products based on concern overlap, skin type compatibility,
 * objective alignment, severity matching, and active ingredient relevance.
 *
 * Selects one product per stepRoutine to build a complete routine,
 * then fills remaining slots with alternatives (tagged accordingly).
 *
 * Tiebreaker: priorityRank (tenant-set) → recommendation count (popularity) → lower price.
 *
 * Returns top products + top services with recommendationTag labels.
 */
export async function matchProducts(
  tenantId: string,
  analysis: AnalysisOutput,
  options?: { pregnantOrNursing?: string }
): Promise<MatchedProduct[]> {
  const catalogItems = await db.product.findMany({
    where: { tenantId, isActive: true },
    include: { _count: { select: { recommendations: true } } },
  });

  if (catalogItems.length === 0) return [];

  // Load dermatological knowledge base for ingredient cross-referencing
  const skinConditions = await db.skinCondition.findMany();

  const detectedConcerns = analysis.conditions.map((c) => c.name);
  const maxSeverity = Math.max(...analysis.conditions.map((c) => c.severity), 1);

  // Punto 4: real pregnancy/nursing status from questionnaire
  const pregnantOrNursing = options?.pregnantOrNursing ?? "no";
  const isPregnant = pregnantOrNursing === "pregnant" || pregnantOrNursing === "nursing";

  // Punto 5: build ingredient recommendation/avoidance maps from knowledge base
  const recommendedIngredients = new Set<string>();
  const avoidIngredients = new Set<string>();
  for (const condition of skinConditions) {
    if (!detectedConcerns.includes(condition.name)) continue;
    for (const ing of safeParseArray(condition.commonIngredients)) {
      recommendedIngredients.add(ing.toLowerCase());
    }
    for (const ing of safeParseArray(condition.avoidIngredients)) {
      avoidIngredients.add(ing.toLowerCase());
    }
  }

  const scoreItem = (product: (typeof catalogItems)[number]): (MatchedProduct & { _popularity: number; _priorityRank: number }) | null => {
    const concernTags = safeParseArray(product.concernTags);
    const skinTypeTags = safeParseArray(product.skinTypeTags);
    const objectiveTags = safeParseArray(product.objectiveTags);
    const contraindications = safeParseArray(product.contraindications);
    const activeIngs = safeParseArray(product.activeIngredients).map((i) => i.toLowerCase());

    // Skip if contraindicated for pregnancy/nursing
    if (isPregnant && contraindications.some((c) => c === "pregnancy" || c === "breastfeeding" || c === "pregnant" || c === "nursing")) {
      return null;
    }

    // Punto 5: skip products with avoid-listed ingredients
    const hasAvoidIngredient = activeIngs.some((ing) => avoidIngredients.has(ing));
    if (hasAvoidIngredient) {
      return null;
    }

    // Score: concern match (0-0.35)
    const concernOverlap = detectedConcerns.filter((c) => concernTags.includes(c)).length;
    const concernScore = Math.min(concernOverlap / Math.max(detectedConcerns.length, 1), 1) * 0.35;

    // Score: skin type match (0-0.20)
    const skinTypeMatch = skinTypeTags.includes(analysis.skin_type) ? 0.20 : 0;

    // Score: objective match (0-0.15)
    const objectiveMatch = objectiveTags.includes(analysis.primary_objective) ? 0.15 : 0;

    // Score: severity match (0-0.10)
    const severityDiff = Math.abs(product.severityLevel - Math.min(maxSeverity, 3));
    const severityScore = (1 - severityDiff / 2) * 0.10;

    // Punto 5: ingredient bonus (0-0.20)
    const ingredientMatches = activeIngs.filter((ing) => recommendedIngredients.has(ing)).length;
    const ingredientScore = Math.min(ingredientMatches / Math.max(recommendedIngredients.size, 1), 1) * 0.20;

    const matchScore = Math.round((concernScore + skinTypeMatch + objectiveMatch + severityScore + ingredientScore) * 100) / 100;

    // Generate reason in patient-friendly Portuguese (translates raw IDs via labels.ts)
    const reasons: string[] = [];
    const matchedConcerns = detectedConcerns.filter((c) => concernTags.includes(c));
    if (matchedConcerns.length > 0) {
      reasons.push(`Trata: ${trList(conditionLabels, matchedConcerns)}`);
    }
    if (skinTypeMatch > 0) {
      reasons.push(`Indicado para pele ${tr(skinTypeLabels, analysis.skin_type)}`);
    }
    if (objectiveMatch > 0) {
      reasons.push(`Alinhado com seu objetivo: ${tr(objectiveLabels, analysis.primary_objective)}`);
    }
    if (ingredientMatches > 0) {
      const matchedIngs = activeIngs.filter((ing) => recommendedIngredients.has(ing));
      reasons.push(`Ingredientes que ajudam: ${matchedIngs.join(", ")}`);
    }

    // Generate how to use
    const stepLabels: Record<string, string> = {
      cleanser: "Limpeza",
      toner: "Tonico",
      serum: "Serum",
      moisturizer: "Hidratante",
      SPF: "Protetor Solar",
      treatment: "Tratamento",
    };
    const timeLabels: Record<string, string> = {
      am: "manha",
      pm: "noite",
      both: "manha e noite",
    };

    let howToUse: string;
    if (product.type === "service") {
      const sessionInfo = product.sessionCount
        ? `${product.sessionCount} sessao${product.sessionCount > 1 ? "es" : ""}`
        : "sessoes";
      const freqInfo = product.sessionFrequency ? `, frequencia ${product.sessionFrequency}` : "";
      const durationInfo = product.durationMinutes ? `, duracao de ${product.durationMinutes} minutos cada` : "";
      howToUse = `Tratamento em ${sessionInfo}${freqInfo}${durationInfo}.`;
    } else {
      const step = product.stepRoutine ? stepLabels[product.stepRoutine] ?? product.stepRoutine : "";
      const time = timeLabels[product.useTime] ?? "manha e noite";
      howToUse = `Usar na etapa de ${step || "tratamento"}, ${time}. Aplicar conforme instrucao do produto.`;
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
      recommendationTag: "recomendado", // will be updated below
      activeIngredients: safeParseArray(product.activeIngredients),
      // Internal fields for sorting (not part of MatchedProduct type, stripped later)
      _popularity: product._count.recommendations,
      _priorityRank: product.priorityRank,
    } as MatchedProduct & { _popularity: number; _priorityRank: number };
  };

  const scored = catalogItems.map(scoreItem).filter(Boolean) as (MatchedProduct & { _popularity: number; _priorityRank: number })[];

  // Punto 2: Sort with tiebreakers — score → priorityRank → popularity → lower price
  scored.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    if (b._priorityRank !== a._priorityRank) return b._priorityRank - a._priorityRank;
    if (b._popularity !== a._popularity) return b._popularity - a._popularity;
    return (a.price ?? Infinity) - (b.price ?? Infinity);
  });

  const products = scored.filter((item) => item.type !== "service");
  const services = scored.filter((item) => item.type === "service");

  // Punto 1: Build routine — pick best product per stepRoutine first
  const routineSteps = ["cleanser", "toner", "serum", "moisturizer", "SPF", "treatment"];
  const selectedProducts: (MatchedProduct & { _popularity: number; _priorityRank: number })[] = [];
  const usedIds = new Set<string>();
  const usedSteps = new Set<string>();

  // First pass: best product per routine step
  for (const step of routineSteps) {
    const best = products.find((p) => p.stepRoutine === step && !usedIds.has(p.productId));
    if (best) {
      best.recommendationTag = "recomendado";
      selectedProducts.push(best);
      usedIds.add(best.productId);
      usedSteps.add(step);
    }
  }

  // Also add products without stepRoutine (general products) as "recomendado"
  for (const p of products) {
    if (!p.stepRoutine && !usedIds.has(p.productId) && selectedProducts.length < 6) {
      p.recommendationTag = "recomendado";
      selectedProducts.push(p);
      usedIds.add(p.productId);
    }
  }

  // Second pass: fill alternatives (second-best per step already used, or other high-scoring products)
  const maxTotal = 8; // max products to return
  for (const p of products) {
    if (selectedProducts.length >= maxTotal) break;
    if (usedIds.has(p.productId)) continue;
    p.recommendationTag = "alternativa";
    selectedProducts.push(p);
    usedIds.add(p.productId);
  }

  // Tag services
  const selectedServices = services.slice(0, 2);
  for (const svc of selectedServices) {
    svc.recommendationTag = "recomendado";
  }

  // Strip internal fields before returning
  const stripInternal = (items: (MatchedProduct & { _popularity: number; _priorityRank: number })[]): MatchedProduct[] =>
    items.map(({ _popularity, _priorityRank, ...rest }) => rest);

  if (selectedServices.length === 0) {
    return stripInternal(selectedProducts.slice(0, 6));
  }

  return [...stripInternal(selectedProducts.slice(0, 5)), ...stripInternal(selectedServices)];
}

function safeParseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
