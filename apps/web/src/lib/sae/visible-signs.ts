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

/**
 * Where a sign is in the photo: ellipses from the browser's face landmarks,
 * normalized to the image size (cx, rx / width · cy, ry / height). Used by
 * the region edit (lib/sae/region-edit.ts) to crop and blend each area.
 */
export type ZoneEllipse = { cx: number; cy: number; rx: number; ry: number; rot: number };
export type SignZone = { sign: SignId; ellipses: ZoneEllipse[] };

/**
 * Signs edited together in one crop. Gemini barely edits a full-face photo
 * (Nov-2026 test: same targets, almost no visible change); an enlarged crop
 * of the area gets a much stronger edit.
 */
export const SIGN_REGION: Record<SignId, "upper" | "lower"> = {
  forehead_lines: "upper",
  glabellar_lines: "upper",
  crows_feet: "upper",
  upper_eyelid_hooding: "upper",
  tear_trough: "upper",
  midface_volume_loss: "lower",
  nasolabial_fold: "lower",
  marionette_lines: "lower",
  perioral_lines: "lower",
  jowls: "lower",
  submental_fullness: "lower",
  neck_bands: "lower",
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
  const g = Math.min(Math.max(grade, 0), 4);
  if (Number.isInteger(g)) return GRADE_WORDS[g];
  // Half grades: "marked" for both 3 and 2.5 hid the requested change.
  return `between ${GRADE_WORDS[Math.floor(g)]} and ${GRADE_WORDS[Math.ceil(g)]}`;
}

export function sideWord(sign: SignId, side: SignSide): string {
  if (!BILATERAL_SIGNS.has(sign)) return "";
  if (side === "image_left") return " (on the left side of the image)";
  if (side === "image_right") return " (on the right side of the image)";
  return " (both sides)";
}

/**
 * Grade points removed from a sign by several procedures at once: the
 * strongest wins, they never add up. Clinical review (Nov-2026): MFU,
 * threads, fillers and biostimulators all act on the same jaw and folds,
 * so the result needs a ceiling per area, not a sum.
 */
export function combineReductions(reductions: number[]): number {
  return Math.max(0, ...reductions);
}

/**
 * Target grade of a sign after a reduction. A visible sign never fully
 * disappears (floor 0.5), and a severe one (grade 4) never goes below 1.
 */
export function targetGrade(current: number, reduction: number): number {
  // Clinical review (Nov-2026): treated signs soften, they never vanish.
  const floor = current >= 4 ? 1 : current > 0 ? 0.5 : 0;
  return Math.max(Math.round((current - reduction) * 2) / 2, floor);
}
