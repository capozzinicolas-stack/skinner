import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@skinner/db";
import Anthropic from "@anthropic-ai/sdk";
import { concernEquivalents } from "./condition-aliases";
import {
  SIGN_ANATOMY,
  SIGN_EDIT,
  combineReductions,
  gradeWord,
  sideWord,
  targetGrade,
  type SignId,
  type SignSide,
  type VisibleSign,
} from "./visible-signs";
import { procedureProfile, procedureSignEffects, type SkinAxis, type SkinEffect } from "./procedure-profiles";

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
  // Clinic mode (Nov-2026): localized signs from the analysis, and an
  // optional copy of the photo with the target areas outlined (built in the
  // browser from face landmarks) to tell the model where to edit.
  signs?: VisibleSign[];
  guideImageBase64?: string;
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

// Image model is configurable so a retirement or an upgrade never needs a
// deploy (same lesson as ANTHROPIC_MODEL). Clinics can run a stronger model
// than the dermocosmetic flow: procedure projections need local anatomical
// edits (frown lines, jowls), which older models tend to skip.
const DERMO_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const CLINIC_IMAGE_MODEL =
  process.env.GEMINI_CLINIC_IMAGE_MODEL || process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

function toInlineImage(dataUrl: string) {
  // Keep the mime type: the clinic flow feeds a Gemini output (often PNG)
  // back in as the next input.
  const mimeType = dataUrl.match(/^data:(image\/[\w+.-]+);base64,/)?.[1] ?? "image/jpeg";
  const data = dataUrl.replace(/^data:image\/[\w+.-]+;base64,/, "");
  return { inlineData: { mimeType, data } };
}

/**
 * One image edit. `images[0]` is the photo to edit; any further images are
 * references described in the prompt (e.g. the zone guide in clinic mode).
 */
async function generateProjection(
  images: string | string[],
  prompt: string,
  modelName: string = DERMO_IMAGE_MODEL
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: modelName });
  const list = Array.isArray(images) ? images : [images];

  const result = await model.generateContent([prompt, ...list.map(toInlineImage)]);

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

// Shared closing block. Nov-2026: the old "preserve expression EXACTLY" and
// "do not change age group" lines contradicted relaxing frown lines and
// lifting jowls, and the image model resolved the conflict by not editing.
const CLINIC_ALLOWED_AND_IDENTITY = `WHAT IS ALLOWED:
- Skin quality, texture, pores, spots, redness, fine lines and wrinkles.
- Soft-tissue changes produced by the procedures listed: relaxed expression lines, softer folds, lifted jowls and lower-face laxity, less submental fullness, restored volume. They bring back the person's own firmer, more rested look.
- A relaxed area between the eyebrows or on the forehead is allowed with the same neutral expression.

KEEP (identity):
- The SAME person, instantly recognizable. Same skeleton (jaw bone, chin bone, cheekbones), nose, eyes, lip shape (unless a lip filler is listed), hair, glasses if present, pose, head angle, framing, background and lighting.
- Sagging soft tissue over the bone (jowls, folds, cheek fat) is NOT identity: change it wherever a target or a listed procedure asks for it.
- Natural skin texture: no makeup, no filters, no plastic or airbrushed look. The expression stays natural, never frozen.
- Moles, and any dark spot with irregular borders or mixed colors, stay exactly as they are. Diffuse symmetric brown patches on the cheeks, forehead or upper lip (melasma) stay as they are unless a target asks to lighten melasma.
- Skin never becomes lighter than the person's own surrounding skin tone.
- Show the settled result: no swelling, bruising, treatment redness, crusts, peeling or needle marks.

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
 * Visual effect of a procedure for the zone prompts (analyses without
 * visible signs). Comes from the evidence-based profiles; procedures without
 * a profile fall back to the condition-level edits.
 */
function procedureVisual(p: ProjectionProcedure): string | null {
  const profile = procedureProfile(p.name);
  return profile ? `${profile.look}. Do not change ${profile.keep}` : null;
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
    if (procedureProfile(p.name)?.noImage) continue;
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

// ── Sign-target path (Nov-2026) ─────────────────────────────────────────
// When the analysis carries `visible_signs`, each stage asks the image model
// to take every treated sign from its current grade to a target grade. This
// replaced zone-level wording that the model applied as a global retouch.

export type SignTarget = {
  sign: SignId;
  side: SignSide;
  description: string;
  from: number; // grade in the input image of this stage
  to: number;   // grade to reach
};

/** Fraction (0–1) of a procedure's full effect reached at `weeks`. */
function procedureProgress(p: ProjectionProcedure, weeks: number): number {
  const full = p.improvementPct ?? 0;
  return full > 0 ? procedureCurve(p, weeks) / full : 0;
}

function gradeAt(sign: VisibleSign, procedures: ProjectionProcedure[], weeks: number): number {
  const reductions = procedures.map(
    (p) => (procedureSignEffects(p.name)[sign.sign] ?? 0) * procedureProgress(p, weeks)
  );
  return targetGrade(sign.grade, combineReductions(reductions));
}

/**
 * Targets for one stage. Stage 2 starts from the stage-1 grade (its input is
 * the stage-1 image) and lists only signs that keep improving.
 */
export function buildSignTargets(
  signs: VisibleSign[],
  procedures: ProjectionProcedure[],
  weeks: number,
  previousWeeks?: number
): { targets: SignTarget[]; done: SignTarget[] } {
  const targets: SignTarget[] = [];
  const done: SignTarget[] = [];
  for (const s of signs) {
    const from = previousWeeks !== undefined ? gradeAt(s, procedures, previousWeeks) : s.grade;
    const to = gradeAt(s, procedures, weeks);
    const t = { sign: s.sign, side: s.side, description: s.description, from, to };
    if (to < from) targets.push(t);
    else if (previousWeeks !== undefined && to < s.grade) done.push(t);
  }
  // Biggest visible change first: the model weighs the top of the list most.
  targets.sort((a, b) => b.from - b.to - (a.from - a.to));
  return { targets, done };
}

/** How much of a procedure's effect is visible, in words (Gemini ignores %). */
function progressWord(fraction: number): string {
  if (fraction < 0.35) return "only an early, partial part of its effect is visible now";
  if (fraction < 0.75) return "most of its effect is visible now";
  return "its full effect is visible now";
}

function targetLine(t: SignTarget, i: number): string {
  return `${i + 1}. ${SIGN_ANATOMY[t.sign]}${sideWord(t.sign, t.side)}. Seen now: ${t.description}. Current grade ${t.from}/4 (${gradeWord(t.from)}) → target grade ${t.to}/4 (${gradeWord(t.to)}). How: ${SIGN_EDIT[t.sign]}.`;
}

const GUIDE_NOTE = `The SECOND image is the same original photo with magenta outlines drawn around the target areas. Use it only to locate them. The result must NOT contain any outline or mark.`;

function buildSignPrompt(
  stageIndex: 0 | 1,
  stages: [ProjectionStage, ProjectionStage],
  signs: VisibleSign[],
  procedures: ProjectionProcedure[],
  conditions: { name: string; severity: number }[],
  conditionsKB: Map<string, { visualEditPrompt: string | null; displayName: string; description: string }>,
  hasGuide: boolean,
  emphasis?: string
): { prompt: string; targets: SignTarget[] } {
  const weeks = stages[stageIndex].weeks;
  const previousWeeks = stageIndex === 1 ? stages[0].weeks : undefined;
  const { targets, done } = buildSignTargets(signs, procedures, weeks, previousWeeks);

  // How each procedure's real result looks (evidence-based profiles), with
  // how much of it is reached at this point of its curve. Procedures without
  // a profile keep the condition-level instruction.
  const effectLines = procedures.flatMap((p) => {
    const profile = procedureProfile(p.name);
    if (!profile) return [];
    if (profile.noImage) {
      return [`- ${p.name}: maintenance care; it causes no visible change in this photo.`];
    }
    const now = procedureProgress(p, weeks);
    if (now <= 0) return [];
    const before = previousWeeks !== undefined ? procedureProgress(p, previousWeeks) : 0;
    if (previousWeeks !== undefined && now - before < 0.1) {
      return [`- ${p.name}: already at its full visible effect in this photo; keep it as it is.`];
    }
    return [`- ${p.name}: ${progressWord(now)}. Its real result looks like this: ${profile.look}. It does not change ${profile.keep}.`];
  });
  // Skin-quality effects (redness, spots, texture) are targets too: listed
  // only in the procedure block, the model ignored them (redness under a
  // vascular laser stayed unchanged in the Nov-2026 test). Per skin axis
  // only the strongest procedure is shown: effects never add up.
  const bestPerAxis = new Map<SkinAxis, { p: ProjectionProcedure; effect: SkinEffect; now: number }>();
  for (const p of procedures) {
    const now = procedureProgress(p, weeks);
    const before = previousWeeks !== undefined ? procedureProgress(p, previousWeeks) : 0;
    if (now <= 0 || now - before < 0.1) continue;
    for (const effect of procedureProfile(p.name)?.skin ?? []) {
      const best = bestPerAxis.get(effect.axis);
      if (!best || effect.strength * now > best.effect.strength * best.now) {
        bestPerAxis.set(effect.axis, { p, effect, now });
      }
    }
  }
  const skinTargets = [...bestPerAxis.values()].map(
    ({ p, effect, now }) => `Skin (${p.name}): ${effect.text}; ${progressWord(now)}.`
  );
  const unprofiled = procedures.filter((p) => !procedureProfile(p.name));
  const skinLines = unprofiled.length > 0
    ? buildClinicZoneEdits(weeks, conditions, unprofiled, conditionsKB, previousWeeks)
    : "";

  const procs = procedures.map((p) => p.name).join(", ");
  const intro =
    stageIndex === 0
      ? `Edit this photo of a real patient to simulate the photorealistic result ${weeks} weeks after starting these in-clinic aesthetic procedures: ${procs}.`
      : `This photo already shows the patient ${previousWeeks} weeks after starting these in-clinic aesthetic procedures: ${procs}. Edit it to show the SAME patient ${weeks} weeks after starting, at the end of the protocol. Keep every improvement already visible; the result must never look worse or older than this photo.`;

  const targetLines = [
    ...targets.map(targetLine),
    ...skinTargets.map((line, i) => `${targets.length + i + 1}. ${line}`),
  ];
  const targetBlock =
    targetLines.length > 0
      ? `TARGETS — the purpose of this edit. Change exactly these:\n${targetLines.join("\n")}\nEach target must reach its target grade (or the described change) and look obviously different from the input when compared side by side. Areas and signs not listed stay as they are.`
      : `No sign changes further at this stage: keep the result and refine overall skin quality only very slightly.`;
  const doneBlock =
    done.length > 0
      ? `\nALREADY IMPROVED (keep exactly as in this photo): ${done.map((t) => SIGN_ANATOMY[t.sign]).join("; ")}.`
      : "";

  const prompt = `${intro}

${targetBlock}${doneBlock}
${hasGuide ? `\n${GUIDE_NOTE}\n` : ""}
WHAT EACH PROCEDURE REALLY DOES (match the result to these clinical descriptions — typical average results, not the best case):
${effectLines.join("\n") || "- Keep the current result."}
${skinLines ? `\nOTHER SKIN CHANGES:\n${skinLines}\n` : ""}
${emphasis ? `\nCORRECTION: ${emphasis}\n` : ""}
${CLINIC_ALLOWED_AND_IDENTITY}`;
  return { prompt, targets };
}

// ── Optional quality check (PROJECTION_QA=1) ────────────────────────────
// Claude compares input and output on each target and lists the ones that
// did not visibly change; the stage is regenerated once with a correction.
// Off by default: adds ~10s per stage plus a possible regeneration.

const QA_ENABLED = process.env.PROJECTION_QA === "1";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 30_000, maxRetries: 0 });

function toClaudeImage(dataUrl: string) {
  const m = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/);
  if (!m) return null;
  return {
    type: "image" as const,
    source: { type: "base64" as const, media_type: m[1] as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: m[2] },
  };
}

async function missedTargets(before: string, after: string, targets: SignTarget[]): Promise<SignTarget[]> {
  const a = toClaudeImage(before);
  const b = toClaudeImage(after);
  if (!a || !b || targets.length === 0) return [];
  const res = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          a,
          b,
          {
            type: "text",
            text: `Image 1 is the input, image 2 the edited result. For each target below, answer whether image 2 shows the requested reduction clearly enough to notice side by side. Reply only with the numbers of the targets that did NOT change enough, comma-separated, or "none".\n${targets.map(targetLine).join("\n")}`,
          },
        ],
      },
    ],
  });
  const text = res.content.map((c) => (c.type === "text" ? c.text : "")).join(" ").toLowerCase();
  if (text.includes("none")) return [];
  const nums = new Set((text.match(/\d+/g) ?? []).map(Number));
  return targets.filter((_, i) => nums.has(i + 1));
}

async function generateStage(
  images: string[],
  build: (emphasis?: string) => { prompt: string; targets: SignTarget[] }
): Promise<string> {
  const { prompt, targets } = build();
  const result = await generateProjection(images, prompt, CLINIC_IMAGE_MODEL);
  if (!QA_ENABLED || targets.length === 0) return result;
  try {
    const missed = await missedTargets(images[0], result, targets);
    if (missed.length === 0) return result;
    const emphasis = `A previous attempt left these almost unchanged: ${missed
      .map((t) => SIGN_ANATOMY[t.sign])
      .join("; ")}. Make each reach its target grade, clearly visible side by side.`;
    return await generateProjection(images, build(emphasis).prompt, CLINIC_IMAGE_MODEL);
  } catch (err) {
    console.error("[projection] QA skipped:", err instanceof Error ? err.message : err);
    return result;
  }
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
  const signs = (input.signs ?? []).filter((s) => s.grade > 0);
  const guide = input.guideImageBase64 ? [input.guideImageBase64] : [];

  // Chained on purpose: image 2 is edited from image 1 so the end of the
  // protocol always builds on the first result. Two independent edits of
  // the original photo varied more than the intended difference between
  // stages (image 1 sometimes looked better than image 2).
  if (signs.length > 0) {
    const build = (i: 0 | 1) => (emphasis?: string) =>
      buildSignPrompt(i, stages, signs, procedures, input.conditions, conditionsKB, guide.length > 0, emphasis);
    const first = await generateStage([input.photoBase64, ...guide], build(0));
    const second = await generateStage([first, ...guide], build(1));
    return { week8: first, week12: second, stages };
  }

  // Analyses without visible_signs (dermo tenants, older analyses, mock
  // fallback): zone-level instructions per procedure.
  const first = await generateProjection(
    input.photoBase64,
    buildClinicPrompt(0, stages, input.conditions, input.primaryObjective, conditionsKB, procedures),
    CLINIC_IMAGE_MODEL
  );
  const second = await generateProjection(
    first,
    buildClinicPrompt(1, stages, input.conditions, input.primaryObjective, conditionsKB, procedures),
    CLINIC_IMAGE_MODEL
  );

  return { week8: first, week12: second, stages };
}

// Export default template for admin preview
export const PROJECTION_DEFAULT_TEMPLATE = DEFAULT_PROMPT_TEMPLATE;
