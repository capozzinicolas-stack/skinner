import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { db } from "@skinner/db";
import { SkinReport } from "@/lib/pdf/report-template";

export async function GET(
  req: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    const analysis = await db.analysis.findUnique({
      where: { id: params.analysisId },
      include: {
        results: true,
        recommendations: {
          include: { product: true },
          orderBy: { rank: "asc" },
        },
        tenant: true,
      },
    });

    if (!analysis || !analysis.results) {
      return NextResponse.json(
        { error: "Analise nao encontrada" },
        { status: 404 }
      );
    }

    const conditions = safeParseJson(analysis.conditions, []);
    const rawResponse = safeParseJson(analysis.rawResponse, {});

    const reportData = {
      tenantName: analysis.tenant.name,
      clientName: analysis.clientName ?? undefined,
      date: new Date(analysis.createdAt).toLocaleDateString("pt-BR"),
      disclaimer: analysis.tenant.disclaimer ?? undefined,
      analysis: {
        skin_type: analysis.skinType ?? "normal",
        conditions,
        barrier_status: analysis.barrierStatus ?? "healthy",
        summary: analysis.results.summary,
        action_plan: safeParseJson(analysis.results.actionPlan, {
          phase1: "",
          phase2: "",
          phase3: "",
        }),
        alert_signs: safeParseJson(analysis.results.alertSigns, []),
        timeline: safeParseJson(analysis.results.timelineExpected, {
          weeks4: "",
          weeks8: "",
          weeks12: "",
        }),
      },
      recommendations: analysis.recommendations.map((rec) => ({
        name: rec.product.name,
        sku: rec.product.sku,
        price: rec.product.price,
        stepRoutine: rec.product.stepRoutine,
        matchScore: rec.matchScore,
        reason: rec.reason,
        howToUse: rec.howToUse ?? "",
      })),
    };

    const buffer = await renderToBuffer(
      React.createElement(SkinReport, { data: reportData }) as any
    );

    // Save report record if not exists
    const existingReport = await db.report.findUnique({
      where: { analysisId: analysis.id },
    });
    if (!existingReport) {
      await db.report.create({
        data: {
          analysisId: analysis.id,
          channel: "download",
        },
      });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="skinners-report-${analysis.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatorio" },
      { status: 500 }
    );
  }
}

function safeParseJson<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
