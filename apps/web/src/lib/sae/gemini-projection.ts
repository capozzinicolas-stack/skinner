import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export type ProjectionInput = {
  photoBase64: string;
  conditions: { name: string; severity: number }[];
  primaryObjective: string;
};

export type ProjectionResult = {
  week4: string;  // base64 data URL image
  week8: string;  // base64 data URL image
  week12: string; // base64 data URL image
};

function buildPrompt(
  weeks: 4 | 8 | 12,
  conditions: { name: string; severity: number }[],
  objective: string
): string {
  const reductionPct = weeks === 4 ? 15 : weeks === 8 ? 30 : 50;
  const intensityLabel =
    weeks === 4 ? "subtle early improvement" :
    weeks === 8 ? "moderate visible improvement" :
    "significant consolidated improvement";

  // Translate conditions to specific visual edits
  const conditionEdits = conditions.map((c) => {
    const intensity = reductionPct;
    switch (c.name) {
      case "acne":
        return `Reduce visible acne lesions, pimples, and blemishes by approximately ${intensity}% (fade redness, smooth papules)`;
      case "hyperpigmentation":
        return `Lighten dark spots, melasma, and hyperpigmentation by approximately ${intensity}% (more even tone)`;
      case "aging":
        return `Soften fine lines and wrinkles by approximately ${intensity}% (smoother skin texture)`;
      case "dehydration":
        return `Increase skin hydration and plumpness by approximately ${intensity}% (less dry/flaky appearance)`;
      case "sensitivity":
        return `Reduce visible redness and irritation by approximately ${intensity}%`;
      case "rosacea":
        return `Reduce facial redness and visible capillaries by approximately ${intensity}%`;
      case "pores":
        return `Minimize visible pore size by approximately ${intensity}% (smoother texture)`;
      case "dullness":
        return `Increase skin luminosity and radiance by approximately ${intensity}% (brighter, healthier glow)`;
      case "dark_circles":
        return `Lighten under-eye dark circles by approximately ${intensity}%`;
      case "oiliness":
        return `Reduce visible oily shine by approximately ${intensity}% (more balanced matte finish)`;
      default:
        return `Improve ${c.name} by approximately ${intensity}%`;
    }
  }).join(". ");

  return `Edit this facial photo to show a photorealistic ${intensityLabel} after ${weeks} weeks of professional dermocosmetic treatment focused on: ${objective}.

SPECIFIC IMPROVEMENTS TO APPLY VISIBLY:
${conditionEdits}.

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
- The improvements should be clearly visible but still believable
- Maintain the original photo composition and framing

The improvements should be noticeable enough to see a clear difference compared to the original, but never dramatic to the point of looking fake or like a different person.

Return only the edited image.`;
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
  // Find the image in the response
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
  const [week4, week8, week12] = await Promise.all([
    generateProjection(
      input.photoBase64,
      buildPrompt(4, input.conditions, input.primaryObjective)
    ),
    generateProjection(
      input.photoBase64,
      buildPrompt(8, input.conditions, input.primaryObjective)
    ),
    generateProjection(
      input.photoBase64,
      buildPrompt(12, input.conditions, input.primaryObjective)
    ),
  ]);

  return { week4, week8, week12 };
}
