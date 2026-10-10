import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@skinner/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type ProjectionProduct = {
  name: string;
  activeIngredients: string[];
  stepRoutine: string | null;
};

// Recommended procedure with its result curve (segment "aesthetic_clinic").
export type ProjectionProcedure = {
  name: string;
  concernTags: string[];
  onsetWeeks: number | null;
  peakWeeks: number | null;
  improvementPct: number | null;
};

export type ProjectionInput = {
  photoBase64: string;
  conditions: { name: string; severity: number }[];
  primaryObjective: string;
  products?: ProjectionProduct[];
  // "clinic" → per-procedure timing (Oct-2026). Default "dermo" keeps the
  // original fixed 8/12-week, 50/80% dermocosmetic projection.
  mode?: "dermo" | "clinic";
  procedures?: ProjectionProcedure[];
};

export type ProjectionStage = {
  weeks: number;
  label: string;     // pt-BR, e.g. "1 mês", "5 meses"
  phase: string;     // pt-BR, e.g. "Após as primeiras sessões"
  improvementPct: number;
};

export type ProjectionResult = {
  week8: string;  // first projected image (dermo: 8 weeks, 50%)
  week12: string; // second projected image (dermo: 12 weeks, 80%)
  // Present only in clinic mode: timing + intensity of each image.
  stages?: [ProjectionStage, ProjectionStage];
};

const DEFAULT_PROMPT_TEMPLATE = `Edit this facial photo to show a photorealistic {intensityLabel} after {weeks} weeks of professional dermocosmetic treatment.

TREATMENT CONTEXT:
- Primary objective: {objective}
- Conditions being treated: {conditionsList}
{productsSection}

SPECIFIC IMPROVEMENTS TO APPLY VISIBLY:
{conditionEdits}

CRITICAL IDENTITY PRESERVATION RULES:
- This is the SAME person. Do NOT alter facial structure, bone structure, jawline, nose shape, eye shape, lip shape, or face proportions in any way.
- Preserve hair (style, color, length), eye color, expression, pose, head angle, and background EXACTLY.
- Do NOT add makeup, filters, or cosmetic effects.
- Do NOT change the person's age, gender, ethnicity, or body features.
- Keep the exact same lighting direction, shadows, and color temperature.
- The person must be instantly recognizable as the same individual.

QUALITY REQUIREMENTS:
- High resolution photorealistic output
- Sharp focus on facial features
- Natural skin texture (avoid plastic/airbrushed look)
- The improvements should be clearly visible and pronounced — the patient should notice a real difference
- Maintain the original photo composition and framing

The improvements must be visually obvious and impactful while remaining believable. Show a clear transformation that motivates the patient to follow the treatment.

Return only the edited image.`;

/**
 * Builds the visual edit instructions sent to Gemini for each detected condition.
 *
 * Resolution order for the visual prompt of each condition:
 *   1. SkinCondition.visualEditPrompt from DB (editable via /admin)
 *   2. SkinCondition.displayName + description from DB (auto-built generic prompt)
 *   3. Generic fallback: "Improve {name} by approximately {intensity}%"
 *
 * This keeps the system data-driven: any condition added/edited in /admin (or via the
 * questionnaire flow) propagates here automatically, no code change needed.
 */
function buildConditionEdits(
  conditions: { name: string; severity: number }[],
  reductionPct: number,
  conditionsKB: Map<string, { visualEditPrompt: string | null; displayName: string; description: string }>
): string {
  const intensity = reductionPct;
  return conditions
    .map((c) => {
      const kb = conditionsKB.get(c.name);
      if (kb?.visualEditPrompt) {
        return kb.visualEditPrompt.replace(/\{intensity\}/g, String(intensity));
      }
      if (kb) {
        // Auto-built prompt from KB metadata when admin hasn't authored a visualEditPrompt yet.
        return `Improve the visible signs of ${kb.displayName.toLowerCase()} by approximately ${intensity}% (clinical context: ${kb.description.split(".")[0]})`;
      }
      return `Improve ${c.name} by approximately ${intensity}%`;
    })
    .join(".\n");
}

function buildProductsSection(products?: ProjectionProduct[]): string {
  if (!products || products.length === 0) return "";

  const lines = products.map((p) => {
    const ingredients = p.activeIngredients.length > 0
      ? ` (active ingredients: ${p.activeIngredients.join(", ")})`
      : "";
    const step = p.stepRoutine ? ` [${p.stepRoutine}]` : "";
    return `  - ${p.name}${step}${ingredients}`;
  });

  return `\nRECOMMENDED TREATMENT PRODUCTS (these inform the expected improvement level):
${lines.join("\n")}
The projection should reflect improvements consistent with using these specific products and their active ingredients.`;
}

function buildPrompt(
  template: string,
  weeks: 8 | 12,
  conditions: { name: string; severity: number }[],
  objective: string,
  conditionsKB: Map<string, { visualEditPrompt: string | null; displayName: string; description: string }>,
  products?: ProjectionProduct[]
): string {
  const reductionPct = weeks === 8 ? 50 : 80;
  const intensityLabel = weeks === 8
    ? "moderate but clearly visible improvement"
    : "significant and dramatic improvement";

  const conditionEdits = buildConditionEdits(conditions, reductionPct, conditionsKB);
  const conditionsList = conditions.map((c) => `${c.name} (severity ${c.severity}/3)`).join(", ");
  const productsSection = buildProductsSection(products);

  return template
    .replace("{intensityLabel}", intensityLabel)
    .replace("{weeks}", String(weeks))
    .replace("{objective}", objective)
    .replace("{conditionsList}", conditionsList)
    .replace("{productsSection}", productsSection)
    .replace("{conditionEdits}", conditionEdits);
}

async function generateProjection(
  photoBase64: string,
  prompt: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image",
  });

  // Strip data URL prefix if present
  const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    },
  ]);

  const response = result.response;
  const candidates = response.candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType ?? "image/jpeg"};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("Gemini did not return an image");
}

export async function generateProjections(
  input: ProjectionInput
): Promise<ProjectionResult> {
  // Load custom prompt template from platform config
  const platformConfig = await db.platformConfig.findUnique({
    where: { id: "default" },
  });
  const template = platformConfig?.projectionPromptTemplate || DEFAULT_PROMPT_TEMPLATE;

  // Load condition KB once and index by name. Visual edit prompts authored via /admin
  // (or seed) flow into Gemini through this map, no code change required for new conditions.
  const kbRows = await db.skinCondition.findMany({
    select: { name: true, visualEditPrompt: true, displayName: true, description: true },
  });
  const conditionsKB = new Map(
    kbRows.map((r) => [r.name, { visualEditPrompt: r.visualEditPrompt, displayName: r.displayName, description: r.description }])
  );

  const [week8, week12] = await Promise.all([
    generateProjection(
      input.photoBase64,
      buildPrompt(template, 8, input.conditions, input.primaryObjective, conditionsKB, input.products)
    ),
    generateProjection(
      input.photoBase64,
      buildPrompt(template, 12, input.conditions, input.primaryObjective, conditionsKB, input.products)
    ),
  ]);

  return { week8, week12 };
}

// ── Procedure-clinic projection (segment "aesthetic_clinic") ────────────

// Procedures change soft-tissue support (lifting, volume), so unlike the
// dermocosmetic template this one allows contour changes typical of the
// listed procedures while still forbidding identity/bone changes.
const CLINIC_PROMPT_TEMPLATE = `Edit this facial photo to show a photorealistic result {weeksLabel} after starting the following in-clinic aesthetic procedures, performed by a qualified professional:
{proceduresList}

TREATMENT CONTEXT:
- Primary objective: {objective}
- Conditions being treated: {conditionsList}

SPECIFIC IMPROVEMENTS TO APPLY VISIBLY (percentages are the expected visible improvement at this point in time):
{conditionEdits}

WHAT MAY CHANGE (only when the listed procedures do this):
- Skin quality, texture, pores, spots, redness, fine lines and wrinkles.
- Soft-tissue support typical of the procedures above: smoother expression lines (botulinum toxin), restored volume in cheeks, under-eyes or lips (hyaluronic acid fillers), firmer skin and a subtly lifted, more defined jawline and jowls (collagen biostimulators, microfocused ultrasound, radiofrequency, threads).
- Keep any contour change subtle and natural, proportional to the improvement percentage.

CRITICAL IDENTITY PRESERVATION RULES:
- This is the SAME person and must be instantly recognizable.
- Do NOT change bone structure, nose shape, eye shape or color, face proportions, age group, gender or ethnicity.
- Do NOT change lip shape unless a lip filler is listed above.
- Preserve hair, expression, pose, head angle, background, lighting direction and color temperature EXACTLY.
- Do NOT add makeup, filters or cosmetic effects. Keep natural skin texture (no plastic or airbrushed look).

Return only the edited image.`;

/**
 * Visible improvement of one procedure at `weeks` after starting, following
 * a linear ramp from onsetWeeks (0%) to peakWeeks (improvementPct).
 */
function procedureCurve(p: ProjectionProcedure, weeks: number): number {
  const pct = p.improvementPct ?? 0;
  if (pct <= 0) return 0;
  const onset = Math.max(p.onsetWeeks ?? 0, 0);
  const peak = Math.max(p.peakWeeks ?? onset, onset);
  if (weeks < onset) return 0;
  if (weeks >= peak || peak === onset) return pct;
  return (pct * (weeks - onset)) / (peak - onset);
}

/**
 * Combined improvement of several procedures on one condition. The strongest
 * procedure counts fully; each additional one contributes 40% of its effect
 * (combined protocols beat monotherapy, but effects are not independent —
 * the guide reports e.g. 60-75% for multimodal melasma vs 40-65% alone).
 * Stacked as 1 - Π(1 - wᵢ·pᵢ) and capped at 85% so the projection never
 * shows a "perfect" result.
 */
function combine(pcts: number[]): number {
  const sorted = pcts.filter((p) => p > 0).sort((a, b) => b - a);
  const remaining = sorted.reduce(
    (acc, p, i) => acc * (1 - (Math.min(p, 100) / 100) * (i === 0 ? 1 : 0.4)),
    1
  );
  return Math.min(Math.round((1 - remaining) * 100), 85);
}

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

function weeksLabelPt(weeks: number): string {
  if (weeks <= 4) return "1 mês";
  if (weeks % 4 === 0) return `${weeks / 4} meses`;
  return `${weeks} semanas`;
}

/**
 * Two projection points for a set of procedures:
 *   1. 4 weeks — after the first sessions (fast procedures already peak).
 *   2. End of protocol — the latest peak among recommended procedures,
 *      clamped to 8–26 weeks so the image stays a realistic horizon.
 */
export function computeClinicStages(
  conditions: { name: string; severity: number }[],
  procedures: ProjectionProcedure[]
): {
  stages: [ProjectionStage, ProjectionStage];
  perCondition: [Map<string, number>, Map<string, number>];
} {
  const maxPeak = Math.max(0, ...procedures.map((p) => p.peakWeeks ?? 0));
  const endWeeks = Math.min(Math.max(maxPeak, 8), 26);
  const points = [4, endWeeks] as const;

  const perCondition = points.map((weeks) => {
    const map = new Map<string, number>();
    for (const c of conditions) {
      const treating = procedures.filter((p) => p.concernTags.includes(c.name));
      const pct = combine(treating.map((p) => procedureCurve(p, weeks)));
      map.set(c.name, roundTo5(pct));
    }
    return map;
  }) as [Map<string, number>, Map<string, number>];

  const overall = perCondition.map((map) =>
    map.size > 0 ? Math.max(...Array.from(map.values())) : 0
  );

  const stages: [ProjectionStage, ProjectionStage] = [
    {
      weeks: points[0],
      label: weeksLabelPt(points[0]),
      phase: "Após as primeiras sessões",
      improvementPct: overall[0],
    },
    {
      weeks: points[1],
      label: weeksLabelPt(points[1]),
      phase: "Fim do protocolo",
      improvementPct: overall[1],
    },
  ];
  return { stages, perCondition };
}

function buildClinicPrompt(
  weeks: number,
  conditions: { name: string; severity: number }[],
  intensities: Map<string, number>,
  objective: string,
  conditionsKB: Map<string, { visualEditPrompt: string | null; displayName: string; description: string }>,
  procedures: ProjectionProcedure[]
): string {
  // Conditions no recommended procedure treats get no edit (stay as-is).
  const conditionEdits = conditions
    .map((c) => {
      const pct = intensities.get(c.name) ?? 0;
      if (pct <= 0) return null;
      return buildConditionEdits([c], pct, conditionsKB);
    })
    .filter(Boolean)
    .join(".\n") || "Subtle overall improvement in skin quality.";
  const conditionsList = conditions.map((c) => `${c.name} (severity ${c.severity}/3)`).join(", ");
  const proceduresList = procedures.map((p) => `  - ${p.name}`).join("\n");

  return CLINIC_PROMPT_TEMPLATE
    .replace("{weeksLabel}", `${weeks} weeks`)
    .replace("{proceduresList}", proceduresList)
    .replace("{objective}", objective)
    .replace("{conditionsList}", conditionsList)
    .replace("{conditionEdits}", conditionEdits);
}

export async function generateClinicProjections(
  input: ProjectionInput
): Promise<ProjectionResult> {
  const procedures = (input.procedures ?? []).filter((p) => (p.improvementPct ?? 0) > 0);
  if (procedures.length === 0) {
    // No curve data (e.g. manually created services without projection
    // fields) → fall back to the original dermocosmetic projection.
    return generateProjections({ ...input, mode: "dermo" });
  }

  const kbRows = await db.skinCondition.findMany({
    select: { name: true, visualEditPrompt: true, displayName: true, description: true },
  });
  const conditionsKB = new Map(
    kbRows.map((r) => [r.name, { visualEditPrompt: r.visualEditPrompt, displayName: r.displayName, description: r.description }])
  );

  const { stages, perCondition } = computeClinicStages(input.conditions, procedures);

  const [first, second] = await Promise.all(
    stages.map((stage, i) =>
      generateProjection(
        input.photoBase64,
        buildClinicPrompt(stage.weeks, input.conditions, perCondition[i], input.primaryObjective, conditionsKB, procedures)
      )
    )
  );

  return { week8: first, week12: second, stages };
}

// Export default template for admin preview
export const PROJECTION_DEFAULT_TEMPLATE = DEFAULT_PROMPT_TEMPLATE;
