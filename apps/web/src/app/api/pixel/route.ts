import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ref, value } = body;

    if (!ref || typeof ref !== "string") {
      return NextResponse.json({ error: "Missing ref" }, { status: 400 });
    }

    // Find recommendation by tracking ref (productId used as ref)
    const recommendation = await db.recommendation.findFirst({
      where: { productId: ref },
      include: {
        analysis: { select: { tenantId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!recommendation) {
      return NextResponse.json({ error: "Invalid ref" }, { status: 404 });
    }

    const saleValue = typeof value === "number" && value > 0 ? value : 0;

    // Get tenant commission rate
    const tenant = await db.tenant.findUniqueOrThrow({
      where: { id: recommendation.analysis.tenantId },
    });

    const commission = saleValue * tenant.commissionRate;

    // Record conversion
    await db.conversion.create({
      data: {
        recommendationId: recommendation.id,
        type: saleValue > 0 ? "purchase" : "click",
        saleValue: saleValue > 0 ? saleValue : null,
        commission: commission > 0 ? commission : null,
      },
    });

    // Log usage event for commission
    if (commission > 0) {
      await db.usageEvent.create({
        data: {
          tenantId: recommendation.analysis.tenantId,
          type: "commission",
          quantity: 1,
          unitPrice: saleValue,
          total: commission,
          metadata: JSON.stringify({
            recommendationId: recommendation.id,
            saleValue,
            commissionRate: tenant.commissionRate,
          }),
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Pixel error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Also handle GET for click tracking (image pixel fallback)
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get("ref");
  if (ref) {
    const recommendation = await db.recommendation.findFirst({
      where: { productId: ref },
      orderBy: { createdAt: "desc" },
    });

    if (recommendation) {
      await db.conversion.create({
        data: {
          recommendationId: recommendation.id,
          type: "click",
        },
      });
    }
  }

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );
  return new NextResponse(pixel, {
    headers: { "Content-Type": "image/gif", "Cache-Control": "no-store" },
  });
}
