import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@skinner/db";
import { concernEquivalents } from "./condition-aliases";

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

  // Strip data URL prefix if present. Keep its mime type: the clinic flow
  // feeds a Gemini output (often PNG) back in as the next input.
  const mimeType = photoBase64.match(/^data:(image\/[\w+.-]+);base64,/)?.[1] ?? "image/jpeg";
  const base64Data = photoBase64.replace(/^data:image\/[\w+.-]+;base64,/, "");

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType,
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
//
// Oct-2026 rework after clinical feedback (image 1 looked better than image
// 2; forehead lines, nasolabial folds and jowls barely changed):
//   - Gemini does not follow percentages, so each procedure is translated
//     into a zone-specific visual instruction (PROCEDURE_VISUALS) with a
//     qualitative strength word derived from its result curve.
//   - Image 2 is edited FROM image 1 (chained), so the progression always
//     moves forward instead of two independent random draws.
//   - Reducing sagging (jowls, lower-face laxity) is explicitly allowed; the
//     old "keep contour changes subtle" wording made Gemini skip it.
//   - Structural reshaping (chin, jaw, cheekbones, nose) stays forbidden:
//     Skinner does not simulate anatomical changes yet.

const CLINIC_ALLOWED_AND_IDENTITY = `WHAT IS ALLOWED:
- Skin quality, texture, pores, spots, redness, fine lines and wrinkles.
- Soft-tissue changes produced by the procedures listed: smoothing expression lines, softening folds, reducing sagging jowls, lower-face laxity and submental fullness, and restoring lost volume. These bring back the person's own firmer, more rested contour and are expected when listed above.

CRITICAL IDENTITY PRESERVATION RULES:
- This is the SAME person and must be instantly recognizable.
- Do NOT change bone structure, nose shape, eye shape or color, cheekbone, chin or jaw shape, age group, gender or ethnicity.
- Do NOT change lip shape unless a lip filler is listed above.
- Preserve hair, expression, pose, head angle, background, framing, lighting direction and color temperature EXACTLY.
- Do NOT add makeup, filters or cosmetic effects. Keep natural skin texture (no plastic or airbrushed look).

Return only the edited image.`;

const CLINIC_STAGE1_TEMPLATE = `Edit this facial photo to show a photorealistic result {weeksLabel} after starting the following in-clinic aesthetic procedures, performed by a qualified professional:
{proceduresList}

TREATMENT CONTEXT:
- Primary objective: {objective}
- Conditions being treated: {conditionsList}

CHANGES TO APPLY AT THIS POINT IN TIME (zone, what changes, and how strong the change is):
{zoneEdits}

Every change listed must be clearly visible when this photo and the result are compared side by side. Zones not listed must stay as they are.

${CLINIC_ALLOWED_AND_IDENTITY}`;

const CLINIC_STAGE2_TEMPLATE = `This photo shows a patient {prevWeeksLabel} after starting the in-clinic aesthetic procedures below. Edit it to show the SAME patient {weeksLabel} after starting, at the end of the protocol:
{proceduresList}

TREATMENT CONTEXT:
- Primary objective: {objective}
- Conditions being treated: {conditionsList}

KEEP every improvement already visible in this photo. The result must never look worse, older or more tired than this photo.

FURTHER CHANGES SINCE THE PREVIOUS STAGE (zone, what changes, and the overall strength reached now):
{zoneEdits}

The progression must be clearly noticeable compared with this photo, especially in the zones listed above.

${CLINIC_ALLOWED_AND_IDENTITY}`;

/**
 * Visual effect of each procedure family, matched on the procedure name
 * (accent-insensitive). First match wins, so specific entries come first.
 * Names follow the procedure library; clinics that rename a service keep the
 * match as long as the key term (e.g. "toxina", "ultraformer") stays.
 * Procedures without a match fall back to the condition-level edits.
 */
const PROCEDURE_VISUALS: { match: RegExp; effect: string }[] = [
  { match: /toxina.*pescoco|nefertiti/, effect: "Neck and jawline: soften the vertical neck bands and make the jawline edge slightly crisper" },
  { match: /toxina|botox|botulin|dysport|xeomin/, effect: "Forehead horizontal lines, frown lines between the eyebrows and crow's feet: smooth these expression wrinkles, reducing their depth and visibility while keeping a natural, non-frozen look" },
  { match: /labial|labio/, effect: "Lips: better hydrated, smoother and slightly fuller, keeping the person's own lip shape" },
  { match: /sulco|bigode|marionete|nasogenian|nasolabial/, effect: "Nasolabial folds (from the nose to the mouth corners) and marionette lines: reduce the depth of the folds and the shadow they cast" },
  { match: /olheira|lagrima|tear trough/, effect: "Under-eye area: fill the tear-trough hollow and lighten the shadow under the eyes" },
  { match: /malar|mandibula|mento|queixo/, effect: "Midface: restore lost volume in the cheeks so the midface looks less hollow and less tired (do not reshape cheekbones, chin or jaw)" },
  { match: /enzima|papada|lipo de papada/, effect: "Submental area: reduce the fullness under the chin (double chin)" },
  { match: /ultrassom microfocado|ultraformer|ultherapy|hifu|mfu/, effect: "Lower face and neck lift: reduce the sagging jowl bulge in front of the jaw angle, redefine the jawline contour, reduce submental fullness and slightly lift the brows and midface" },
  { match: /fios de sustentacao|\bcog\b|fios.*(pcl|plla)/, effect: "Mechanical lift: lift the midface and the jowls, reposition sagging tissue and soften the nasolabial folds" },
  { match: /radiesse|hidroxiapatita|sculptra|poli-?l|ellanse|policaprolactona|bioestimulador/, effect: "Firmness of the lower and middle face: denser, firmer skin; reduce the sagging jowls along the jawline and soften the nasolabial folds" },
  { match: /morpheus|microagulhamento com radio/, effect: "Skin texture and firmness: smoother surface, smaller pores, softer acne scars and slightly tighter skin along the jawline" },
  { match: /thermage|radiofrequencia/, effect: "Skin tightening: firmer skin, mild tightening of the jowls and jawline and softer fine lines" },
  { match: /fios/, effect: "Skin quality and firmness: firmer, denser skin with softer fine lines" },
  { match: /profhilo|hidratacao injetavel|skinbooster|pdrn|polinucleot|biorremodel/, effect: "Skin quality: better hydrated, plumper and more radiant skin, with softer fine lines and a more even texture" },
  { match: /vasinho|vermelhid|vascular/, effect: "Redness: reduce diffuse redness and visible small vessels" },
  { match: /co2|fracionado|resurfacing|erbium/, effect: "Skin surface: soften fine lines and wrinkles, refine texture and pores and soften acne scars" },
  { match: /lavieen|picosseg|nd:?yag|luz intensa|\blip\b|ipl|laser/, effect: "Skin tone: lighten dark spots and melasma, more even tone and refined texture" },
  { match: /plasma|palpebra/, effect: "Upper eyelids: reduce the excess, hooded eyelid skin so the eyes look more open" },
  { match: /microagulhamento/, effect: "Skin texture: smoother surface, smaller pores and softer acne scars" },
  { match: /peeling|hydrafacial|hidrodermo|limpeza/, effect: "Skin surface: fresher, more radiant skin with fewer clogged pores and lighter superficial spots" },
];

function normalizeName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function procedureVisual(p: ProjectionProcedure): string | null {
  const n = normalizeName(p.name);
  return PROCEDURE_VISUALS.find((v) => v.match.test(n))?.effect ?? null;
}

/** Qualitative strength for Gemini (it does not follow percentages). */
function strengthWord(pct: number): string {
  if (pct < 25) return "subtle but visible";
  if (pct < 45) return "moderate, clearly visible";
  if (pct < 65) return "marked";
  return "strong";
}

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
      const ids = concernEquivalents(c.name);
      const treating = procedures.filter((p) => ids.some((id) => p.concernTags.includes(id)));
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

/**
 * Zone instructions for one stage. Procedures with a visual profile become
 * "zone: change. Strength: X" lines; the rest fall back to condition-level
 * edits (KB visualEditPrompt) for the conditions they treat.
 *
 * Stage 2 (`previousWeeks` set) lists only procedures still progressing
 * since stage 1, because the input image already carries the earlier gains.
 */
export function buildClinicZoneEdits(
  weeks: number,
  conditions: { name: string; severity: number }[],
  procedures: ProjectionProcedure[],
  conditionsKB: Map<string, { visualEditPrompt: string | null; displayName: string; description: string }>,
  previousWeeks?: number
): string {
  const lines: string[] = [];
  const unprofiled: ProjectionProcedure[] = [];

  for (const p of procedures) {
    const effect = procedureVisual(p);
    if (!effect) {
      unprofiled.push(p);
      continue;
    }
    const now = procedureCurve(p, weeks);
    if (now <= 0) continue;
    if (previousWeeks !== undefined && now - procedureCurve(p, previousWeeks) < 5) continue;
    lines.push(`- ${effect}. Strength of this change: ${strengthWord(now)} (${p.name}).`);
  }

  // Unprofiled procedures keep the original condition-level behavior.
  if (unprofiled.length > 0) {
    for (const c of conditions) {
      const ids = concernEquivalents(c.name);
      const treating = unprofiled.filter((p) => ids.some((id) => p.concernTags.includes(id)));
      const now = combine(treating.map((p) => procedureCurve(p, weeks)));
      const before = previousWeeks !== undefined
        ? combine(treating.map((p) => procedureCurve(p, previousWeeks)))
        : 0;
      if (now <= 0 || (previousWeeks !== undefined && now - before < 5)) continue;
      lines.push(`- ${buildConditionEdits([c], roundTo5(now), conditionsKB)}.`);
    }
  }

  if (lines.length > 0) return lines.join("\n");
  return previousWeeks !== undefined
    ? "- The result is consolidated: keep every improvement and refine overall skin quality only very slightly (firmer, more even, more rested)."
    : "- Subtle overall improvement in skin quality.";
}

function buildClinicPrompt(
  stageIndex: 0 | 1,
  stages: [ProjectionStage, ProjectionStage],
  conditions: { name: string; severity: number }[],
  objective: string,
  conditionsKB: Map<string, { visualEditPrompt: string | null; displayName: string; description: string }>,
  procedures: ProjectionProcedure[]
): string {
  const weeks = stages[stageIndex].weeks;
  const previousWeeks = stageIndex === 1 ? stages[0].weeks : undefined;
  const zoneEdits = buildClinicZoneEdits(weeks, conditions, procedures, conditionsKB, previousWeeks);
  const conditionsList = conditions.map((c) => `${c.name} (severity ${c.severity}/3)`).join(", ");
  const proceduresList = procedures.map((p) => `  - ${p.name}`).join("\n");

  return (stageIndex === 0 ? CLINIC_STAGE1_TEMPLATE : CLINIC_STAGE2_TEMPLATE)
    .replace("{weeksLabel}", `${weeks} weeks`)
    .replace("{prevWeeksLabel}", `${previousWeeks ?? 0} weeks`)
    .replace("{proceduresList}", proceduresList)
    .replace("{objective}", objective)
    .replace("{conditionsList}", conditionsList)
    .replace("{zoneEdits}", zoneEdits);
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

  const { stages } = computeClinicStages(input.conditions, procedures);

  // Chained on purpose: image 2 is edited from image 1 so the end of the
  // protocol always builds on the first result. Two independent edits of
  // the original photo varied more than the intended difference between
  // stages (image 1 sometimes looked better than image 2).
  const first = await generateProjection(
    input.photoBase64,
    buildClinicPrompt(0, stages, input.conditions, input.primaryObjective, conditionsKB, procedures)
  );
  const second = await generateProjection(
    first,
    buildClinicPrompt(1, stages, input.conditions, input.primaryObjective, conditionsKB, procedures)
  );

  return { week8: first, week12: second, stages };
}

// Export default template for admin preview
export const PROJECTION_DEFAULT_TEMPLATE = DEFAULT_PROMPT_TEMPLATE;
