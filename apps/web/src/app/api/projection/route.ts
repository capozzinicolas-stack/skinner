import { NextRequest, NextResponse } from "next/server";
import { generateProjections, generateClinicProjections } from "@/lib/sae/gemini-projection";
import { projectionLimiter, getClientIp } from "@/lib/rate-limit";
import { z } from "zod/v4";

const RequestSchema = z.object({
  photoBase64: z.string().min(100),
  conditions: z.array(
    z.object({
      name: z.string(),
      severity: z.number().int().min(1).max(3),
    })
  ),
  primaryObjective: z.string().min(1),
  products: z.array(
    z.object({
      name: z.string(),
      activeIngredients: z.array(z.string()),
      stepRoutine: z.string().nullable(),
    })
  ).optional(),
  // Procedure-clinic projection (Oct-2026). Optional — absent = dermo mode.
  mode: z.enum(["dermo", "clinic"]).optional(),
  procedures: z.array(
    z.object({
      name: z.string(),
      concernTags: z.array(z.string()),
      onsetWeeks: z.number().int().min(0).max(104).nullable(),
      peakWeeks: z.number().int().min(0).max(104).nullable(),
      improvementPct: z.number().int().min(0).max(100).nullable(),
    })
  ).max(10).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit by client IP — projection is expensive (~$0.12 per call)
    const ip = getClientIp(req.headers);
    const rl = await projectionLimiter.limit(ip);
    if (!rl.success) {
      return NextResponse.json(
        {
          error:
            "Muitas projeções solicitadas. Aguarde alguns minutos antes de tentar novamente.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Não foi possível gerar a projeção com estes dados." },
        { status: 400 }
      );
    }

    const { photoBase64, conditions, primaryObjective, products, mode, procedures } = parsed.data;

    // Photo is only held in memory during this request — never persisted to disk or DB
    const result =
      mode === "clinic"
        ? await generateClinicProjections({
            photoBase64,
            conditions,
            primaryObjective,
            products,
            mode,
            procedures,
          })
        : await generateProjections({
            photoBase64,
            conditions,
            primaryObjective,
            products,
          });

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido ao gerar projecao";
    console.error("[projection] Gemini error:", message);
    // The provider error is logged, never shown: it is technical and in
    // English. The patient always gets a Portuguese message.
    return NextResponse.json(
      { error: "Não foi possível gerar a projeção agora. Tente novamente em alguns instantes." },
      { status: 500 }
    );
  }
}
