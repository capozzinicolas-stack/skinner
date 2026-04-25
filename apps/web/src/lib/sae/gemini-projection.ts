import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@skinner/db";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type ProjectionProduct = {
  name: string;
  activeIngredients: string[];
  stepRoutine: string | null;
};

export type ProjectionInput = {
  photoBase64: string;
  conditions: { name: string; severity: number }[];
  primaryObjective: string;
  products?: ProjectionProduct[];
};

export type ProjectionResult = {
  week8: string;  // base64 data URL image — 50% improvement
  week12: string; // base64 data URL image — 80% improvement
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

function buildConditionEdits(
  conditions: { name: string; severity: number }[],
  reductionPct: number
): string {
  return conditions.map((c) => {
    const intensity = reductionPct;
    switch (c.name) {
      case "acne":
        return `Reduce visible acne lesions, pimples, and blemishes by approximately ${intensity}% (fade redness, smooth papules, clear skin)`;
      case "hyperpigmentation":
        return `Lighten dark spots, melasma, and hyperpigmentation by approximately ${intensity}% (significantly more even tone)`;
      case "aging":
        return `Soften fine lines and wrinkles by approximately ${intensity}% (noticeably smoother, firmer skin)`;
      case "dehydration":
        return `Increase skin hydration and plumpness by approximately ${intensity}% (visibly hydrated, dewy appearance)`;
      case "sensitivity":
        return `Reduce visible redness and irritation by approximately ${intensity}% (calmer, even-toned skin)`;
      case "rosacea":
        return `Reduce facial redness and visible capillaries by approximately ${intensity}% (significantly calmer complexion)`;
      case "pores":
        return `Minimize visible pore size by approximately ${intensity}% (refined, smooth texture)`;
      case "dullness":
        return `Increase skin luminosity and radiance by approximately ${intensity}% (visibly brighter, healthy glow)`;
      case "dark_circles":
        return `Lighten under-eye dark circles by approximately ${intensity}% (refreshed, rested appearance)`;
      case "oiliness":
        return `Reduce visible oily shine by approximately ${intensity}% (balanced, matte finish)`;
      default:
        return `Improve ${c.name} by approximately ${intensity}%`;
    }
  }).join(".\n");
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
  products?: ProjectionProduct[]
): string {
  const reductionPct = weeks === 8 ? 50 : 80;
  const intensityLabel = weeks === 8
    ? "moderate but clearly visible improvement"
    : "significant and dramatic improvement";

  const conditionEdits = buildConditionEdits(conditions, reductionPct);
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

  const [week8, week12] = await Promise.all([
    generateProjection(
      input.photoBase64,
      buildPrompt(template, 8, input.conditions, input.primaryObjective, input.products)
    ),
    generateProjection(
      input.photoBase64,
      buildPrompt(template, 12, input.conditions, input.primaryObjective, input.products)
    ),
  ]);

  return { week8, week12 };
}

// Export default template for admin preview
export const PROJECTION_DEFAULT_TEMPLATE = DEFAULT_PROMPT_TEMPLATE;
