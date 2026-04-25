import { NextRequest, NextResponse } from "next/server";
import { generateProjections } from "@/lib/sae/gemini-projection";
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
            "Muitas projecoes solicitadas. Aguarde alguns minutos antes de tentar novamente.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados de entrada invalidos" },
        { status: 400 }
      );
    }

    const { photoBase64, conditions, primaryObjective, products } = parsed.data;

    // Photo is only held in memory during this request — never persisted to disk or DB
    const result = await generateProjections({
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
    return NextResponse.json(
      { error: `Nao foi possivel gerar a projecao: ${message}` },
      { status: 500 }
    );
  }
}
