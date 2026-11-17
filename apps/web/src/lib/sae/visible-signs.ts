/**
 * Visible signs (Nov-2026, procedure clinics).
 *
 * Claude lists the concrete, localized signs it sees in the patient's photo
 * (e.g. deep frown lines between the brows, a jowl on the image-left side)
 * with a 0–4 grade. The projection then asks the image model to take each
 * sign from its current grade to a target grade, instead of "improve aging
 * by 55%" — image models follow concrete anatomical targets, not
 * percentages. Clinical feedback that motivated this: glabellar lines,
 * jowls and nasolabial folds stayed unchanged in the projected images.
 *
 * Plain module (no server or browser imports): used by the Claude schema,
 * the projection prompt builder and the client-side guide image.
 */

export const SIGN_IDS = [
  "forehead_lines",
  "glabellar_lines",
  "crows_feet",
  "upper_eyelid_hooding",
  "tear_trough",
  "midface_volume_loss",
  "nasolabial_fold",
  "marionette_lines",
  "perioral_lines",
  "jowls",
  "submental_fullness",
  "neck_bands",
] as const;

export type SignId = (typeof SIGN_IDS)[number];

/** Side as seen in the photo (viewer's left/right), not the patient's. */
export type SignSide = "image_left" | "image_right" | "both" | "center";

export type VisibleSign = {
  sign: SignId;
  side: SignSide;
  /** 0 absent · 1 faint · 2 mild · 3 marked · 4 severe */
  grade: number;
  /** Short English description of what is seen (internal, never shown). */
  description: string;
};

/** Anatomical wording sent to the image model. */
export const SIGN_ANATOMY: Record<SignId, string> = {
  forehead_lines: "horizontal lines across the forehead",
  glabellar_lines: "vertical frown lines between the eyebrows (glabella)",
  crows_feet: "crow's feet lines at the outer corners of the eyes",
  upper_eyelid_hooding: "excess, hooded skin on the upper eyelids",
  tear_trough: "hollow and shadow under the eyes (tear trough)",
  midface_volume_loss: "flattened, hollow cheeks from midface volume loss",
  nasolabial_fold: "nasolabial fold (from the side of the nose to the mouth corner)",
  marionette_lines: "marionette lines (from the mouth corners down toward the chin)",
  perioral_lines: "fine vertical lines around the lips",
  jowls: "sagging jowl bulge along the jawline, below and beside the mouth corner",
  submental_fullness: "fullness under the chin (double chin)",
  neck_bands: "vertical bands on the neck",
};

/**
 * What the image model must change to lower each sign. A grade alone moved
 * fine lines but left contour signs (jowls, folds, volume) untouched in the
 * Nov-2026 test; a concrete visual action does better.
 */
export const SIGN_EDIT: Record<SignId, string> = {
  forehead_lines: "smooth the horizontal creases so the forehead skin looks even",
  glabellar_lines: "soften the vertical creases between the brows so the area looks smooth and relaxed",
  crows_feet: "soften the fine lines fanning out from the outer eye corners",
  upper_eyelid_hooding: "reduce the skin folding over the upper eyelid so more of the lid is visible",
  tear_trough: "fill the hollow under the eyes so the lower lid blends smoothly into the cheek, with less shadow",
  midface_volume_loss: "restore soft fullness to the upper cheeks so they look less flat and hollow",
  nasolabial_fold: "make the fold shallower and its shadow lighter and shorter; it must not disappear completely",
  marionette_lines: "make the lines from the mouth corners down to the chin shallower, with less shadow",
  perioral_lines: "soften the fine vertical lines around the lips",
  jowls: "lift the sagging soft tissue along the jaw: shrink the bulges hanging below the jawline beside the mouth corners so the lower edge of the face runs in a straighter, firmer line from the ear to the chin (the jaw bone itself does not change)",
  submental_fullness: "reduce the fullness under the chin so the angle between chin and neck is sharper",
  neck_bands: "soften the vertical bands on the neck",
};

/** Signs on one side of the face (side applies); the rest are midline. */
export const BILATERAL_SIGNS: ReadonlySet<SignId> = new Set<SignId>([
  "crows_feet",
  "upper_eyelid_hooding",
  "tear_trough",
  "midface_volume_loss",
  "nasolabial_fold",
  "marionette_lines",
  "jowls",
]);

export const GRADE_WORDS = [
  "absent, not visible",
  "faint, barely visible",
  "mild",
  "marked, clearly visible",
  "severe, deep",
] as const;

export function gradeWord(grade: number): string {
  const g = Math.min(Math.max(Math.round(grade), 0), 4);
  return GRADE_WORDS[g];
}

export function sideWord(sign: SignId, side: SignSide): string {
  if (!BILATERAL_SIGNS.has(sign)) return "";
  if (side === "image_left") return " (on the left side of the image)";
  if (side === "image_right") return " (on the right side of the image)";
  return " (both sides)";
}

/**
 * Grade points each procedure family removes from each sign at its full
 * effect (peak of its curve). Conservative, aligned with the evidence
 * spreadsheets reviewed with the clinical advisor (Oct-2026): scale-based
 * endpoints move roughly 1–2 points; neurotoxin on dynamic upper-face lines
 * is the strongest; biostimulators / microfocused ultrasound soften
 * nasolabial folds only mildly (no filler = no deep fold correction).
 * Matched on the accent-stripped procedure name; first match wins.
 */
export const PROCEDURE_SIGN_EFFECTS: { match: RegExp; effects: Partial<Record<SignId, number>> }[] = [
  { match: /toxina.*pescoco|nefertiti/, effects: { neck_bands: 1.5, jowls: 0.5 } },
  { match: /toxina|botox|botulin|dysport|xeomin/, effects: { glabellar_lines: 2.5, forehead_lines: 2.5, crows_feet: 2 } },
  { match: /labial|labio/, effects: { perioral_lines: 1 } },
  { match: /sulco|bigode|marionete|nasogenian|nasolabial/, effects: { nasolabial_fold: 2, marionette_lines: 1.5 } },
  { match: /olheira|lagrima|tear trough/, effects: { tear_trough: 2 } },
  { match: /malar|mandibula|mento|queixo/, effects: { midface_volume_loss: 2, nasolabial_fold: 0.5 } },
  { match: /enzima|papada|lipo de papada/, effects: { submental_fullness: 1.5 } },
  { match: /ultrassom microfocado|ultraformer|ultherapy|hifu|mfu/, effects: { jowls: 1.5, submental_fullness: 1, upper_eyelid_hooding: 0.5, nasolabial_fold: 0.5, marionette_lines: 0.5 } },
  { match: /fios de sustentacao|\bcog\b|fios.*(pcl|plla)/, effects: { jowls: 1.5, nasolabial_fold: 1, midface_volume_loss: 0.5, marionette_lines: 0.5 } },
  { match: /radiesse|hidroxiapatita|sculptra|poli-?l|ellanse|policaprolactona|bioestimulador/, effects: { jowls: 1, nasolabial_fold: 1, midface_volume_loss: 1, marionette_lines: 0.5, perioral_lines: 0.5 } },
  { match: /morpheus|microagulhamento com radio/, effects: { jowls: 0.5, perioral_lines: 1, crows_feet: 0.5 } },
  { match: /thermage|radiofrequencia/, effects: { jowls: 0.5, crows_feet: 0.5, perioral_lines: 0.5 } },
  { match: /fios/, effects: { perioral_lines: 0.5 } },
  { match: /profhilo|hidratacao injetavel|skinbooster|pdrn|polinucleot|biorremodel/, effects: { perioral_lines: 1, crows_feet: 0.5, tear_trough: 0.5 } },
  { match: /co2|fracionado|resurfacing|erbium/, effects: { perioral_lines: 1.5, crows_feet: 1, forehead_lines: 0.5 } },
  { match: /plasma|palpebra/, effects: { upper_eyelid_hooding: 1.5 } },
];

export function normalizeProcedureName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function procedureSignEffects(name: string): Partial<Record<SignId, number>> {
  const n = normalizeProcedureName(name);
  return PROCEDURE_SIGN_EFFECTS.find((p) => p.match.test(n))?.effects ?? {};
}

/**
 * Grade points removed from a sign by several procedures at once. The
 * strongest counts fully, each additional one half (effects overlap, they
 * do not add up — see the evidence review: combined protocols beat
 * monotherapy, but percentages are not additive).
 */
export function combineReductions(reductions: number[]): number {
  const sorted = reductions.filter((r) => r > 0).sort((a, b) => b - a);
  return sorted.reduce((acc, r, i) => acc + (i === 0 ? r : r * 0.5), 0);
}

/**
 * Target grade of a sign after a reduction. Never below 0, and a severe
 * sign (grade 4) never fully disappears in a projection.
 */
export function targetGrade(current: number, reduction: number): number {
  const floor = current >= 4 ? 1 : 0;
  return Math.max(Math.round((current - reduction) * 2) / 2, floor);
}
