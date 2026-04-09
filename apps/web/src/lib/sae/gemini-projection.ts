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
  const conditionsList = conditions
    .map((c) => `${c.name} (severidade ${c.severity}/3)`)
    .join(", ");

  return `Edit this facial photo to subtly show how the skin could look after ${weeks} weeks of dermocosmetic treatment focused on: ${objective}.

Conditions to gradually improve by approximately ${reductionPct}%: ${conditionsList}

CRITICAL RULES:
- Preserve ALL facial features, identity, hair, eyes, mouth, expression, and pose EXACTLY as they are
- Only improve skin texture, reduce visible blemishes, and add a subtle healthy glow
- Do NOT change the person's appearance, age, gender, hair, or background
- Keep the same lighting and angle
- The improvement should be subtle and realistic, not dramatic or artificial
- Do not add makeup or filters
- Output a photorealistic edited version of the same person

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
