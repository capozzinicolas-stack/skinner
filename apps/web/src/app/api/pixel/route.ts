import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";

/**
 * Conversion pixel — accepts a `ref` that is the recommendation.trackingRef
 * (a unique CUID generated when the recommendation is created). This matches
 * the value the install snippet reads from `?skr_ref=` (see lib/billing/pixel.ts
 * and the kit page links). Looking up by `trackingRef` (a @unique field) instead
 * of `productId` ensures (a) the lookup matches the intended recommendation
 * exactly, (b) tenant attribution is implicit via the recommendation→analysis
 * chain, and (c) trackingRef is high-cardinality so guessing one to forge a
 * conversion is impractical.
 *
 * Defense in depth: tenant ID flows from analysis.tenantId, so even if a
 * trackingRef were leaked, the conversion is recorded against the correct
 * tenant — never against the requester or a guessed one.
 */
async function findRecommendationByRef(ref: string) {
  return db.recommendation.findUnique({
    where: { trackingRef: ref },
    include: {
      analysis: { select: { tenantId: true } },
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ref, value } = body;

    if (!ref || typeof ref !== "string") {
      return NextResponse.json({ error: "Missing ref" }, { status: 400 });
    }

    const recommendation = await findRecommendationByRef(ref);

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
    const recommendation = await findRecommendationByRef(ref);

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
