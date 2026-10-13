import type { AnalysisOutput, MatchedProduct } from "./types";
import { db } from "@skinner/db";
import {
  conditionLabelsLocalized,
  skinTypeLabelsLocalized,
  objectiveLabelsLocalized,
  stepRoutineLabelsLocalized,
  useTimeLabelsLocalized,
  trList,
  tr,
} from "./labels";
import type { Locale } from "@/lib/i18n/types";
import { concernEquivalents } from "./condition-aliases";

// Reason / howToUse templates per locale. Keep aligned with the patient-flow
// dictionary (results_indicated_for, results_aligned_objective, etc.) — these
// duplicate the values intentionally because matcher.ts runs server-side and
// can't import the React i18n provider.
const MATCHER_TEMPLATES: Record<Locale, {
  treats: string;
  indicatedFor: string;
  alignedObjective: string;
  ingredientsHelp: string;
  treatmentSessions: (count: number) => string;
  treatmentFrequency: (freq: string) => string;
  treatmentDuration: (minutes: number) => string;
  treatmentLine: (sessions: string, freq: string, duration: string) => string;
  useLine: (step: string, time: string) => string;
  treatmentStep: string;
}> = {
  "pt-BR": {
    treats: "Trata",
    indicatedFor: "Indicado para pele",
    alignedObjective: "Alinhado com seu objetivo",
    ingredientsHelp: "Ingredientes que ajudam",
    treatmentSessions: (count) => `${count} ${count > 1 ? "sessões" : "sessão"}`,
    // Free-text frequencies ("a cada 4-6 meses", "manutenção anual") read
    // naturally on their own; the three standard values get a connector.
    treatmentFrequency: (freq) =>
      ["semanal", "quinzenal", "mensal"].includes(freq.toLowerCase())
        ? `, com frequência ${freq.toLowerCase()}`
        : `, ${freq.charAt(0).toLowerCase()}${freq.slice(1)}`,
    treatmentDuration: (min) => `, com ${min} minutos por sessão`,
    treatmentLine: (sessions, freq, duration) =>
      `Protocolo de ${sessions}${freq}${duration}.`,
    useLine: (step, time) =>
      `Usar na etapa de ${step}, ${time}. Aplicar conforme instrução do produto.`,
    treatmentStep: "tratamento",
  },
  es: {
    treats: "Trata",
    indicatedFor: "Indicado para piel",
    alignedObjective: "Alineado con tu objetivo",
    ingredientsHelp: "Ingredientes que ayudan",
    treatmentSessions: (count) => `${count} sesion${count > 1 ? "es" : ""}`,
    treatmentFrequency: (freq) => `, frecuencia ${freq}`,
    treatmentDuration: (min) => `, duracion de ${min} minutos cada una`,
    treatmentLine: (sessions, freq, duration) =>
      `Tratamiento en ${sessions}${freq}${duration}.`,
    useLine: (step, time) =>
      `Usar en la etapa de ${step}, ${time}. Aplica segun las instrucciones del producto.`,
    treatmentStep: "tratamiento",
  },
  en: {
    treats: "Treats",
    indicatedFor: "Indicated for",
    alignedObjective: "Aligned with your goal",
    ingredientsHelp: "Helpful ingredients",
    treatmentSessions: (count) => `${count} session${count > 1 ? "s" : ""}`,
    treatmentFrequency: (freq) => `, frequency ${freq}`,
    treatmentDuration: (min) => `, ${min} minutes each`,
    treatmentLine: (sessions, freq, duration) =>
      `Treatment in ${sessions}${freq}${duration}.`,
    useLine: (step, time) =>
      `Use in the ${step} step, ${time}. Apply according to product instructions.`,
    treatmentStep: "treatment",
  },
};

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
  options?: {
    pregnantOrNursing?: string;
    locale?: Locale;
    maxServices?: number | null;
    // "aesthetic_clinic" switches SERVICE scoring + selection to the
    // procedure-clinic model (see scoreService / category diversity below).
    // Products are scored identically in both segments.
    segment?: string | null;
  }
): Promise<MatchedProduct[]> {
  const isClinic = options?.segment === "aesthetic_clinic";
  const locale: Locale = options?.locale ?? "pt-BR";
  const tmpl = MATCHER_TEMPLATES[locale] ?? MATCHER_TEMPLATES["pt-BR"];
  const catalogItems = await db.product.findMany({
    where: { tenantId, isActive: true },
    include: { _count: { select: { recommendations: true } } },
  });

  if (catalogItems.length === 0) return [];

  // Load dermatological knowledge base for ingredient cross-referencing
  const skinConditions = await db.skinCondition.findMany();

  // Detected condition names plus their simple-ID equivalents (Claude may
  // answer with clinical KB IDs; catalog tags use the simple ones).
  const detectedConcerns = Array.from(
    new Set(analysis.conditions.flatMap((c) => concernEquivalents(c.name)))
  );
  const treatsCondition = (tags: string[], name: string) =>
    concernEquivalents(name).some((id) => tags.includes(id));
  // Procedures Claude already named in the written plan get a bonus so the
  // cards and the plan recommend the same things (clinic segment).
  const planText = [analysis.action_plan?.phase1, analysis.action_plan?.phase2, analysis.action_plan?.phase3]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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

    // Skip if contraindicated for pregnancy/nursing. The catalog form asks
    // clinics to type contraindications in Portuguese ("gravidez,
    // amamentação"), so the pt-BR terms are recognized alongside the legacy
    // English keys.
    if (isPregnant && contraindications.some((c) => PREGNANCY_CONTRAINDICATIONS.has(normalizeTerm(c)))) {
      return null;
    }

    // Punto 5: skip products with avoid-listed ingredients
    const hasAvoidIngredient = activeIngs.some((ing) => avoidIngredients.has(ing));
    if (hasAvoidIngredient) {
      return null;
    }

    // Score: concern match (0-0.35) — share of detected conditions treated
    const concernOverlap = analysis.conditions.filter((c) => treatsCondition(concernTags, c.name)).length;
    const concernScore = Math.min(concernOverlap / Math.max(analysis.conditions.length, 1), 1) * 0.35;

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

    // Procedure-clinic service scoring (segment "aesthetic_clinic"). The
    // dermocosmetics formula above rewards ingredient overlap with the KB and
    // breadth of concerns covered, which buries focused high-value procedures
    // (botulinum toxin, fillers) under "generalist" ones. For clinics:
    //   concern relevance weighted by detected severity ... 0.45
    //   covers the most severe detected condition ......... 0.10
    //   objective match ................................... 0.20
    //   skin type match ................................... 0.15
    //   severity fit ...................................... 0.10
    // No ingredient bonus (procedures are not ingredient-driven).
    let matchScore: number;
    if (isClinic && product.type === "service") {
      const totalSeverity = analysis.conditions.reduce((sum, c) => sum + c.severity, 0) || 1;
      const coveredSeverity = analysis.conditions
        .filter((c) => treatsCondition(concernTags, c.name))
        .reduce((sum, c) => sum + c.severity, 0);
      const relevanceScore = (coveredSeverity / totalSeverity) * 0.45;
      const topCondition = [...analysis.conditions].sort((a, b) => b.severity - a.severity)[0];
      const topScore = topCondition && treatsCondition(concernTags, topCondition.name) ? 0.10 : 0;
      // Name match against the plan: full name or its main part before " (".
      const baseName = product.name.split(" (")[0].toLowerCase();
      const planBonus = planText && (planText.includes(product.name.toLowerCase()) || planText.includes(baseName)) ? 0.15 : 0;
      const clinicObjective = objectiveTags.includes(analysis.primary_objective) ? 0.20 : 0;
      const clinicSkinType = skinTypeTags.includes(analysis.skin_type) ? 0.15 : 0;
      matchScore = Math.min(
        Math.round((relevanceScore + topScore + clinicObjective + clinicSkinType + severityScore + planBonus) * 100) / 100,
        1
      );
    } else {
      matchScore = Math.round((concernScore + skinTypeMatch + objectiveMatch + severityScore + ingredientScore) * 100) / 100;
    }

    // Generate reason in patient locale (translates raw IDs via labels.ts).
    const reasons: string[] = [];
    const matchedConcerns = analysis.conditions
      .map((c) => c.name)
      .filter((name) => treatsCondition(concernTags, name));
    if (matchedConcerns.length > 0) {
      reasons.push(`${tmpl.treats}: ${trList(conditionLabelsLocalized, matchedConcerns, locale)}`);
    }
    if (skinTypeMatch > 0) {
      reasons.push(`${tmpl.indicatedFor} ${tr(skinTypeLabelsLocalized, analysis.skin_type, locale)}`);
    }
    if (objectiveMatch > 0) {
      reasons.push(`${tmpl.alignedObjective}: ${tr(objectiveLabelsLocalized, analysis.primary_objective, locale)}`);
    }
    if (ingredientMatches > 0 && !(isClinic && product.type === "service")) {
      // Show the ingredient names as written in the catalog (proper casing:
      // "Vitamina C", not "vitamina c").
      const matchedIngs = safeParseArray(product.activeIngredients).filter((ing) =>
        recommendedIngredients.has(ing.toLowerCase())
      );
      reasons.push(`${tmpl.ingredientsHelp}: ${matchedIngs.join(", ")}`);
    }

    // Generate how to use — locale-aware step + time labels.
    let howToUse: string;
    if (product.type === "service") {
      const sessionInfo = product.sessionCount
        ? tmpl.treatmentSessions(product.sessionCount)
        : "";
      const freqInfo = product.sessionFrequency ? tmpl.treatmentFrequency(product.sessionFrequency) : "";
      const durationInfo = product.durationMinutes ? tmpl.treatmentDuration(product.durationMinutes) : "";
      howToUse = tmpl.treatmentLine(sessionInfo, freqInfo, durationInfo);
    } else {
      const stepRaw = product.stepRoutine
        ? tr(stepRoutineLabelsLocalized, product.stepRoutine, locale) || product.stepRoutine
        : tmpl.treatmentStep;
      const step = stepRaw.charAt(0).toUpperCase() + stepRaw.slice(1);
      const time = tr(useTimeLabelsLocalized, product.useTime, locale) || tr(useTimeLabelsLocalized, "both", locale);
      howToUse = tmpl.useLine(step || tmpl.treatmentStep, time);
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
      serviceCategory: product.serviceCategory,
      concernTags,
      addOns: safeParseAddOns(product.addOns),
      projectionOnsetWeeks: product.projectionOnsetWeeks,
      projectionPeakWeeks: product.projectionPeakWeeks,
      projectionImprovementPct: product.projectionImprovementPct,
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

  // Tag services. Default 2; tenants can raise it via TenantConfig.maxServiceRecs
  // (e.g. procedure clinics whose catalog is mostly services). Clamped to 1-10.
  const maxServices = Math.min(Math.max(options?.maxServices ?? 2, 1), 10);
  let selectedServices: typeof services;
  if (isClinic) {
    // Category diversity (mirrors the product routine-step pass): best
    // relevant procedure of each category first, then the highest scores.
    // A category only gets a slot when its best procedure treats a detected
    // condition AND scores at least 60% of the overall best procedure, so a
    // weak match is never pushed above a strong one just for variety.
    selectedServices = [];
    const usedServiceIds = new Set<string>();
    const bestServiceScore = services[0]?.matchScore ?? 0;
    // 1) Procedures Claude chose for this patient (and wrote into the plan),
    //    in its priority order. `services` already excludes contraindicated
    //    items, so a pregnant patient never gets one of these.
    for (const name of analysis.recommended_procedures ?? []) {
      if (selectedServices.length >= maxServices) break;
      const svc = services.find((s) => s.name === name && !usedServiceIds.has(s.productId));
      if (svc) {
        svc.recommendationTag = "recomendado";
        selectedServices.push(svc);
        usedServiceIds.add(svc.productId);
      }
    }
    // 2) Category diversity, then 3) best remaining scores.
    for (const category of SERVICE_CATEGORIES) {
      if (selectedServices.length >= maxServices) break;
      const best = services.find(
        (svc) =>
          svc.serviceCategory === category &&
          !usedServiceIds.has(svc.productId) &&
          svc.matchScore >= bestServiceScore * 0.6 &&
          (svc.concernTags ?? []).some((tag) => detectedConcerns.includes(tag))
      );
      if (best) {
        best.recommendationTag = "recomendado";
        selectedServices.push(best);
        usedServiceIds.add(best.productId);
      }
    }
    for (const svc of services) {
      if (selectedServices.length >= maxServices) break;
      if (usedServiceIds.has(svc.productId)) continue;
      svc.recommendationTag = "alternativa";
      selectedServices.push(svc);
      usedServiceIds.add(svc.productId);
    }
  } else {
    selectedServices = services.slice(0, maxServices);
    for (const svc of selectedServices) {
      svc.recommendationTag = "recomendado";
    }
  }

  // Strip internal fields before returning
  const stripInternal = (items: (MatchedProduct & { _popularity: number; _priorityRank: number })[]): MatchedProduct[] =>
    items.map(({ _popularity, _priorityRank, ...rest }) => rest);

  if (selectedServices.length === 0) {
    return stripInternal(selectedProducts.slice(0, 6));
  }

  // Treatments always come first so they get the top ranks
  // (Recommendation.rank → PDF and kit order). Products follow.
  return [...stripInternal(selectedServices), ...stripInternal(selectedProducts.slice(0, 5))];
}

// Category order for the procedure-clinic diversity pass.
const SERVICE_CATEGORIES = ["injectables", "technologies", "skin"] as const;

// Contraindication terms that mean "not during pregnancy / breastfeeding".
// Compared after normalizeTerm (lowercase, no accents).
const PREGNANCY_CONTRAINDICATIONS = new Set([
  "pregnancy",
  "pregnant",
  "breastfeeding",
  "nursing",
  "gravidez",
  "gravida",
  "gestacao",
  "gestante",
  "gestantes",
  "amamentacao",
  "amamentando",
  "lactacao",
  "lactantes",
]);

function normalizeTerm(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function safeParseAddOns(
  json: string | null | undefined
): { name: string; description?: string; price?: number }[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (a): a is { name: string; description?: string; price?: number } =>
        !!a && typeof a === "object" && typeof a.name === "string" && a.name.trim() !== ""
    );
  } catch {
    return [];
  }
}

function safeParseArray(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
}
