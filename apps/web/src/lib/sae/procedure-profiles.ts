/**
 * Visual profile of each procedure family (Nov-2026, procedure clinics).
 *
 * Clinical feedback after the sign-based projection: "the image improves,
 * but not with the real effects of the procedures applied". Each profile
 * describes, from the published evidence, what a typical result looks like
 * in a frontal photo AT REST (not at maximum contraction, which is how most
 * trials grade lines), what never changes, and how many grade points it
 * removes from each visible sign at its peak.
 *
 * Validated by the clinical advisor (Nilson, 2026-11-23, spreadsheet
 * "Perfis visuais"). His rules, applied here and in the projection:
 * - Magnitudes are the TYPICAL responder, never the ceiling. Where the
 *   evidence only gives a ceiling (thread lift, MFU, CO2, skin boosters,
 *   plasma), the value was lowered to the typical gain.
 * - Effects on the same sign never add up: per sign the strongest
 *   procedure wins (`combineReductions`). Same for skin effects, per axis.
 * - No reduction without evidence for that area (Sculptra perioral, CO2
 *   glabella, Lavieen / Nd:YAG crow's feet, skin-booster under-eye were
 *   removed or lowered). Values of 0.25 are kept as data but round away in
 *   the grade target: the change is too small to show.
 * - Only the low-energy Nd:YAG may lighten melasma; lasers, IPL and peels
 *   can worsen it. Maintenance care (cleansing, superficial peels, LED)
 *   produces no image change: showing one would over-promise.
 *
 * Matched on the accent-stripped procedure name; first match wins, so
 * specific entries come first. Plain module: no server or browser imports.
 */

import type { SignId } from "./visible-signs";

/** Skin-quality axes. Per axis only the strongest procedure is shown. */
export type SkinAxis = "redness" | "sun_spots" | "melasma" | "texture" | "glow" | "oil";

export type SkinEffect = {
  axis: SkinAxis;
  /** Relative strength within the axis (highest wins). */
  strength: number;
  /** What changes, in English, with the typical magnitude in words. */
  text: string;
};

export type ProcedureProfile = {
  /** Family label in Portuguese (validation table for the clinical advisor). */
  family: string;
  match: RegExp;
  /** Grade points removed from each visible sign at full effect, at rest. */
  signs: Partial<Record<SignId, number>>;
  /** What the full result looks like in a frontal photo at rest (English). */
  look: string;
  /** Skin-quality changes (redness, spots, texture), when there are any. */
  skin?: SkinEffect[];
  /** What this procedure never changes (English). */
  keep: string;
  /** True for maintenance care: listed, but the image does not change. */
  noImage?: boolean;
  /** Short evidence note in Portuguese (validation table only). */
  evidence: string;
};

const SUN_SPOTS_ONLY =
  "only discrete brown sun spots; diffuse symmetric patches on the cheeks, forehead or upper lip (melasma), moles and any spot with irregular borders or mixed colors stay exactly as they are";

export const PROCEDURE_PROFILES: ProcedureProfile[] = [
  {
    family: "Toxina botulínica no pescoço (Nefertiti)",
    match: /toxina.*pescoco|nefertiti|platisma/,
    signs: { neck_bands: 1, jowls: 0.5, marionette_lines: 0.5 },
    look: "a slightly crisper jawline edge from the chin to the jaw angle, mouth corners lifted only a couple of millimeters, and vertical neck bands that look softer and more discreet but are still visible; a subtle change",
    keep: "the skin itself (laxity, texture, spots), the horizontal neck lines, the fat under the chin, the cheek volume, the folds and the jowl fat",
    evidence: "Fase 3 (onabotulinumtoxinA no platisma): melhora ≥1 grau em ~77% no dia 14; efeito leve, dura 3–4 meses. Validado: bandas suavizam sem sumir; pele e papada não mudam.",
  },
  {
    family: "Toxina botulínica preventiva (microdoses)",
    match: /toxina.*(preventiv|microdos)|microbotox/,
    signs: { forehead_lines: 0.5, glabellar_lines: 0.5, crows_feet: 0.5 },
    look: "a slightly smoother forehead and eye area: moving lines soften, lines already etched at rest only get a little shallower",
    skin: [
      { axis: "oil", strength: 1, text: "less oily shine on the forehead and T-zone, which look more matte (not dry everywhere), and pores there slightly less visible" },
    ],
    keep: "the brow position, the depth of established creases, spots, under-eye circles, laxity, acne scars, volume and the face contour",
    evidence: "Microdoses intradérmicas: efeito discreto em linhas finas, poros e oleosidade; pouca evidência controlada. Dura 2–3 meses.",
  },
  {
    family: "Toxina botulínica (terço superior)",
    match: /toxina|botox|botulin|dysport|xeomin/,
    signs: { glabellar_lines: 1.5, forehead_lines: 1.5, crows_feet: 1 },
    look: "the vertical lines between the brows (where the result is most evident) clearly softer, giving a more open, less frowning look; a relaxed, smoother forehead; smoother outer eye corners, where fine lines can remain if there is sun damage; deep creases etched at rest get shallower but stay as faint lines; the brow tail may sit 1–2 mm higher; the face keeps its natural expression, never frozen, surprised or overly smooth",
    keep: "spots, texture, pores, under-eye circles and bags, eyelid skin, the folds, jowls, cheek volume and skin color",
    evidence: "Fase 3 agrupada: ~43% com melhora ≥1 grau na glabela/testa até 150 dias (na contração máxima). Em repouso, rugas marcadas suavizam mas não somem. Pico 2 semanas, dura 3–4 meses.",
  },
  {
    family: "Preenchimento labial (ácido hialurônico)",
    match: /labial|labio/,
    signs: { perioral_lines: 0.25 },
    look: "lips with a moderate gain in volume, a sharper border and Cupid's bow and slightly more projection, keeping the person's own upper-to-lower lip proportion; settled, never overfilled",
    keep: "the upper-lip length, the size relation between upper and lower lip, the vertical lines around the mouth (at most very slightly softer), the nose and the rest of the face",
    evidence: "Ácido hialurônico: resultado imediato, dura 6–12 meses. Validado: ganho real é volume, contorno e projeção; código de barras melhora pouco.",
  },
  {
    family: "Preenchimento de sulcos (bigode chinês e marionete)",
    match: /sulco|bigode|marionete|nasogenian|nasolabial/,
    signs: { nasolabial_fold: 1.5, marionette_lines: 1 },
    look: "nasolabial folds clearly shallower with a lighter, shorter shadow (the fold is still there, as in any face); marionette lines improve less than the nasolabial folds; mouth corners at most slightly less turned down",
    keep: "the skin texture, spots, fine lines around the mouth, the fat under the chin, jaw laxity, pores and under-eye circles; the face never looks overfilled",
    evidence: "Ácido hialurônico em sulco nasogeniano: ~1–1,5 grau na escala WSRS, imediata, dura 9–12 meses. Validado: marionete melhora menos que o nasogeniano.",
  },
  {
    family: "Preenchimento de olheiras",
    match: /olheira|lagrima|tear trough/,
    signs: { tear_trough: 1 },
    look: "a softer transition from the lower eyelid into the cheek with a lighter shadow and a more rested look; the hollow is still slightly there, not erased",
    keep: "under-eye bags and puffiness, the eyelid skin color and pigmentation, fine crepey lines under the eye, crow's feet, the eye shape and the rest of the face",
    evidence: "Ácido hialurônico na goteira lacrimal: imediato, dura 9–12 meses. Validado: sulco não some; bolsas não melhoram.",
  },
  {
    family: "Preenchimento de malar, mandíbula e mento",
    match: /malar|mandibula|\bmento\b|queixo/,
    signs: { midface_volume_loss: 1.5, jowls: 0.5, nasolabial_fold: 0.5, tear_trough: 0.5 },
    look: "the upper cheeks a little fuller and higher (most of the effect is here), which supports the midface and softens the folds and under-eye shadow below; a cleaner jaw and chin outline; the face looks supported, never overfilled or reshaped to an 'ideal' standard",
    keep: "the bone structure, the hanging skin and fat along the jaw, texture, spots, wrinkles, pores, the nose, the eyes and the lips",
    evidence: "Ácido hialurônico de alta coesividade: imediato, dura 12–18 meses. Validado: malar é o maior efeito; efeito nos sulcos é indireto.",
  },
  {
    family: "Ácido desoxicólico (papada)",
    match: /desoxicol|kybella/,
    signs: { submental_fullness: 1 },
    look: "less fullness under the chin, so the line from the chin to the neck is a bit sharper; one step better, not gone",
    keep: "the jawline above the chin, the face, the neck skin and the neck bands",
    evidence: "Ácido desoxicólico (fase 3): ≥1 grau em ~66–70% após 2–4 sessões.",
  },
  {
    family: "Enzimas para papada",
    match: /enzima|papada/,
    signs: { submental_fullness: 0.5 },
    look: "slightly less fullness under the chin; a subtle change",
    keep: "the jawline above the chin, the face, the neck skin and the neck bands",
    evidence: "Coquetéis enzimáticos usados no Brasil têm evidência fraca: efeito esperado menor que o do ácido desoxicólico (−1 grau). Validado: simular mais sutil.",
  },
  {
    family: "Ultrassom microfocado (Ultraformer)",
    match: /ultrassom microfocado|ultraformer|ultherapy|hifu|mfu/,
    signs: { jowls: 0.5, submental_fullness: 0.5, upper_eyelid_hooding: 0.5, nasolabial_fold: 0.5, marionette_lines: 0.5 },
    look: "a subtle tightening: the lower edge of the jaw looks slightly cleaner, slightly less sagging along the jaw and under the chin, brows about 1 mm higher; real but discreet, never a surgical lift; the change in the folds is almost imperceptible",
    keep: "the cheek volume, fat, neck bands, pores, under-eye circles, the depth of fine lines and deep creases, the skin color and spots",
    evidence: "Revisão sistemática (maioria Ultherapy): sobrancelha 0,5–1,7 mm; 92% melhora pelo avaliador, ‘leve’ pelo paciente. Validado: −0,5 é o típico, −1 o teto.",
  },
  {
    family: "Fios de sustentação (PDO, PLLA ou PCL)",
    match: /fios de sustentacao|\bcog\b|fios.*(pcl|plla)|espiculad/,
    signs: { jowls: 0.75, nasolabial_fold: 0.75, midface_volume_loss: 0.5, marionette_lines: 0.5 },
    look: "cheek and jowl tissue repositioned slightly upward and backward: smaller jowls, softer folds, a more continuous jawline, and cheeks that look supported (not fuller); subtle, never stretched sideways or with an altered expression",
    keep: "the skin texture, fine lines, pores, pigmentation, the fat under the chin, neck bands, the forehead and eye area, and the bone structure",
    evidence: "Revisão sistemática: elevação com durabilidade limitada; satisfação máxima no 1º mês, cai em 1 ano. Validado: −1 é o teto; nasogeniano entre −0,5 e −1.",
  },
  {
    family: "Bioestimulador Radiesse / Ellansé",
    match: /radiesse|hidroxiapatita|ellanse|policaprolactona/,
    signs: { jowls: 1, midface_volume_loss: 1, marionette_lines: 0.75, nasolabial_fold: 0.75 },
    look: "a more defined, continuous jawline outline with somewhat less sagging along it, deep volume restored over the cheeks, and softer marionette area and folds",
    keep: "the bone structure, the skin texture (no visible change), lips, under-eye area, fat under the chin, neck bands, pigmentation, pores, the eyes, the nose and the upper face",
    evidence: "Hidroxiapatita na mandíbula: contorno 2,4 → 1,0 no dia 30 (~1,3 em 1 ano). Validado: −1 na flacidez (define, não firma); outras áreas −0,5 a −1 por extrapolação.",
  },
  {
    family: "Bioestimulador Sculptra (ácido poli-L-láctico)",
    match: /sculptra|poli-?l|plla|bioestimulador/,
    signs: { nasolabial_fold: 1, midface_volume_loss: 1, jowls: 0.5, marionette_lines: 0.5 },
    look: "a gradual return of soft volume to the cheeks (where it stands out most), softer nasolabial folds and shadows; the face looks rested and supported, not filled",
    keep: "the temples, the skin texture (no visible change), lines around the mouth, the bone structure, eyes, nose, lips, brows, fat under the chin, neck bands, pigmentation, pores and dynamic wrinkles",
    evidence: "Ensaios vs ácido hialurônico: semelhante até a semana 12, superior a partir da 24–36; ~92% na semana 48. Validado: perioral removido (não é injetado ali).",
  },
  {
    family: "Microagulhamento com radiofrequência (Morpheus8)",
    match: /morpheus|microagulhamento com radio/,
    signs: { perioral_lines: 0.75, crows_feet: 0.5, forehead_lines: 0.5, jowls: 0.5 },
    look: "a smoother skin surface with softer fine lines and a slight tightening along the jaw",
    skin: [
      { axis: "texture", strength: 2, text: "smoother skin surface; acne scars partially softer (never erased) and pores only subtly less visible" },
    ],
    keep: "spots and pigmentation, the volume of the face, the deep folds, neck bands, fat under the chin, eyelid bags and the skin color",
    evidence: "Revisões: rugas 5,0 → 3,5 (Fitzpatrick) em 3 meses após 3 sessões. Validado: perioral típico −0,5 a −1; poros e cicatrizes sutis.",
  },
  {
    family: "Radiofrequência monopolar (Thermage)",
    match: /thermage|radiofrequencia monopolar/,
    signs: { jowls: 0.5, crows_feet: 0.5, perioral_lines: 0.5 },
    look: "slightly firmer skin with softer fine lines; a mild tightening of the lower face",
    keep: "the brow position, spots, neck bands, fat under the chin, deep creases at rest, pores, acne scars, the volume of the face, the deep folds and the skin color",
    evidence: "Radiofrequência monopolar: efeito leve e progressivo em 2–6 meses. Validado: −0,5 é o teto.",
  },
  {
    family: "Radiofrequência facial",
    match: /radiofrequencia/,
    signs: { jowls: 0.25, crows_feet: 0.25, perioral_lines: 0.25 },
    look: "skin that looks very slightly firmer and smoother",
    skin: [{ axis: "texture", strength: 0.5, text: "very slightly smoother-looking skin" }],
    keep: "the brow position, spots, neck bands, fat under the chin, wrinkles, pores, the volume, the folds and the skin color",
    evidence: "Aparelhos de radiofrequência facial (bipolar/multipolar) produzem efeito menor que a monopolar. Validado: −0,25.",
  },
  {
    family: "Fios de PDO lisos (bioestimulação)",
    match: /fios/,
    signs: { perioral_lines: 0.25 },
    look: "skin that looks slightly denser, with fine lines a little softer; texture only, no lifting",
    skin: [{ axis: "texture", strength: 0.5, text: "slightly denser skin with fine lines a little softer" }],
    keep: "the tissue position, jowls, folds, brows, the face contour, volume, spots, fat under the chin, neck bands, under-eye circles and bags",
    evidence: "Fios lisos: bioestímulo leve, sem elevação. Validado: −0,25 a −0,5, baixa confiança.",
  },
  {
    family: "Profhilo, hidratação injetável e PDRN",
    match: /profhilo|hidratacao injetavel|skinbooster|pdrn|polinucleot|biorremodel/,
    signs: { perioral_lines: 0.25, crows_feet: 0.25 },
    look: "better hydrated, more radiant skin with fine crepey lines a little softer; deeper lines stay as they are; no change in volume",
    skin: [
      { axis: "glow", strength: 1, text: "better hydrated, more radiant skin with fine crepey lines a little softer, also under the eyes (the under-eye hollow and its color stay as they are)" },
    ],
    keep: "the volume, the face contour, the folds, the jowls, the under-eye hollow, eyelid bags, fat under the chin, neck bands, brows, deep lines, acne scars, pores and spots",
    evidence: "Bioremodeladores e skinboosters: hidratação, elasticidade e linhas finas; contorno não demonstrado. Validado: −0,5 é o teto, olheira sem redução.",
  },
  {
    family: "Laser CO2 fracionado",
    match: /co2|fracionado|resurfacing|erbium/,
    signs: { perioral_lines: 1, crows_feet: 0.75, forehead_lines: 0.5, glabellar_lines: 0.25 },
    look: "visibly smoother skin: fine and medium wrinkles around the mouth and eyes shallower, refined texture and a more even tone",
    skin: [
      { axis: "texture", strength: 3, text: "visibly smoother, refined texture; acne scars softer (never erased) and pores moderately less visible (never gone)" },
      { axis: "sun_spots", strength: 2, text: `sun spots slightly lighter, still visible; ${SUN_SPOTS_ONLY}` },
    ],
    keep: "the face contour, jaw laxity, fat under the chin, neck bands, under-eye hollows and bags, brows, the volume and the deep folds",
    evidence: "Perfilometria: rugas −31% (periorbital) a −51% (bochechas); textura ~48%, discromia ~54%. Validado: típico −0,5 a −1; glabela −0,25; melasma não.",
  },
  {
    family: "Laser para vasinhos e vermelhidão",
    match: /vasinho|vermelhid|vascular|\bktp\b|dye|\bpdl\b/,
    signs: {},
    look: "less redness and fine visible vessels much less visible on the nose, cheeks and chin",
    skin: [
      { axis: "redness", strength: 3, text: "the red areas on the nose, cheeks and chin fade a little less than halfway toward the color of the surrounding skin (never lighter than it), and fine visible red vessels become much less visible (not gone); diffuse redness improves only partially" },
    ],
    keep: "the wrinkles, folds, contour, brown spots, pores, acne scars, laxity, active acne and under-eye circles",
    evidence: "Laser KTP/PDL: melhora média ~40% após 3 sessões; avaliadores distinguem a foto pós em 89%. Validado: ~40%, vasinhos menos visíveis (não somem).",
  },
  {
    family: "Luz intensa pulsada",
    match: /luz intensa|\blip\b|\bipl\b/,
    signs: {},
    look: "brown sun spots clearly lighter and a more even skin tone, with slightly less redness",
    skin: [
      { axis: "sun_spots", strength: 3, text: `brown sun spots clearly lighter but not all gone; ${SUN_SPOTS_ONLY}` },
      { axis: "redness", strength: 1, text: "redness slightly reduced" },
    ],
    keep: "the wrinkles, folds, contour, melasma, marks left by acne, moles, pores, acne scars and laxity",
    evidence: "Revisão de lentigos solares: clareamento em 75–90%. Validado: clarear sem apagar tudo; vermelhidão só levemente.",
  },
  {
    family: "Laser de picossegundos",
    match: /picosseg/,
    signs: {},
    look: "brown sun spots clearly lighter and a more even skin tone",
    skin: [{ axis: "sun_spots", strength: 3, text: `brown sun spots clearly lighter but not all gone; ${SUN_SPOTS_ONLY}` }],
    keep: "the wrinkles, folds, contour, redness and vessels, melasma, marks left by acne, moles, pores, acne scars and laxity",
    evidence: "Revisão de lentigos solares: clareamento em 68–93%. Validado: clarear de forma marcada sem apagar tudo; não age nos vasos.",
  },
  {
    family: "Laser Nd:YAG de baixa energia (melasma)",
    match: /nd:?yag/,
    signs: {},
    look: "melasma patches less intense but still visible, and a more even tone",
    skin: [
      { axis: "melasma", strength: 3, text: "diffuse brown patches of melasma about a third lighter, still clearly visible; moles and spots with irregular borders stay exactly as they are" },
    ],
    keep: "the wrinkles, folds, contour, vessels, laxity, acne scars, under-eye circles and brows",
    evidence: "Melasma: clareamento parcial (~30–50%) com recidiva frequente. Validado: único procedimento que pode clarear melasma, típico 30–40%.",
  },
  {
    family: "Laser Lavieen (fracionado não ablativo)",
    match: /lavieen|thulium|tulio|laser/,
    signs: {},
    look: "a slightly more even, brighter tone and subtly finer pores",
    skin: [{ axis: "texture", strength: 1, text: "a slightly more even, brighter tone and subtly less visible pores (never gone)" }],
    keep: "melasma, the wrinkles, folds, contour, vessels, laxity, deep acne scars and brows",
    evidence: "Lavieen: melhora tom e poros (sem dado de melasma ou rugas). Validado: pés de galinha removido.",
  },
  {
    family: "Jato de plasma (pálpebras)",
    match: /plasma|palpebra/,
    signs: { upper_eyelid_hooding: 0.5 },
    look: "the upper eyelid skin fold slightly less heavy, so more of the upper lash line shows; the eye opening itself does not get bigger",
    keep: "the eye shape and opening, the lower eyelid, eyelid fat bags, under-eye circles, crow's feet, spots, the brows and the rest of the face",
    evidence: "Plasma: retração leve a moderada da pálpebra superior em 1–3 sessões (séries de casos). Validado: −0,5 típico, baixa confiança.",
  },
  {
    family: "Microagulhamento com ativos",
    match: /microagulhamento/,
    signs: { perioral_lines: 0.25 },
    look: "smoother skin with acne scars partially softer",
    skin: [
      { axis: "texture", strength: 1, text: "smoother skin; shallow acne scars partially softer (deep narrow scars barely change, none erased)" },
      { axis: "sun_spots", strength: 0.5, text: "marks left by old acne very slightly lighter; melasma, moles and irregular spots stay exactly as they are" },
    ],
    keep: "the contour, laxity, fat under the chin, neck bands, under-eye hollows and bags, vessels, dynamic wrinkles, brows, the folds and the volume",
    evidence: "Microagulhamento: cicatrizes e textura em séries de 3–6 sessões. Validado: rugas −0,25, cicatrizes melhora parcial.",
  },
  {
    family: "Peeling químico médio (ATA / Jessner)",
    match: /peeling quimico medio|\bata\b|jessner/,
    signs: { perioral_lines: 0.25, crows_feet: 0.25 },
    look: "a slightly more even, brighter tone with lighter spots",
    skin: [
      { axis: "sun_spots", strength: 1.5, text: "sun spots and marks left by acne moderately lighter, still visible; melasma, moles and irregular spots stay exactly as they are" },
      { axis: "glow", strength: 0.5, text: "a slightly more even and brighter tone, never stretched or overly smooth" },
    ],
    keep: "the contour, laxity, fat under the chin, neck bands, under-eye hollows and bags, vessels, dynamic and deep wrinkles, deep acne scars, the folds and the volume",
    evidence: "Peeling médio: manchas e linhas finas. Validado: linhas −0,25 típico; melasma não.",
  },
  {
    family: "Limpeza, peelings superficiais, hidrodermoabrasão e LED",
    match: /peeling|hydrafacial|hidrodermo|limpeza|\bled\b|diamante/,
    signs: {},
    look: "maintenance care with a temporary effect on glow and pore cleanliness",
    keep: "everything in the photo",
    noImage: true,
    evidence: "Efeito superficial e temporário. Validado: não alterar a imagem; listar como cuidado complementar.",
  },
];

export function normalizeProcedureName(name: string): string {
  return name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function procedureProfile(name: string): ProcedureProfile | null {
  const n = normalizeProcedureName(name);
  return PROCEDURE_PROFILES.find((p) => p.match.test(n)) ?? null;
}

export function procedureSignEffects(name: string): Partial<Record<SignId, number>> {
  return procedureProfile(name)?.signs ?? {};
}
