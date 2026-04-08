import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@skinner/db";
import { fetchProducts } from "@/lib/integrations/nuvemshop";

// Strip HTML tags from a string
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

// Extract pt-BR (or first available) value from a Nuvemshop multilingual field
function ptBr(field: Record<string, string> | string | null | undefined): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field["pt"] ?? field["pt-BR"] ?? Object.values(field)[0] ?? "";
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.tenantId) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }
  const tenantId: string = user.tenantId;

  const integration = await db.integration.findUnique({
    where: { tenantId_platform: { tenantId, platform: "nuvemshop" } },
  });

  if (!integration || integration.status !== "active" || !integration.storeId || !integration.accessToken) {
    return NextResponse.json(
      { error: "Integracao com Nuvemshop nao configurada ou inativa" },
      { status: 400 }
    );
  }

  let rawProducts: any[];
  try {
    rawProducts = await fetchProducts(integration.storeId, integration.accessToken);
  } catch (err: any) {
    console.error("Nuvemshop sync: fetch products failed", err);
    await db.integration.update({
      where: { tenantId_platform: { tenantId, platform: "nuvemshop" } },
      data: { status: "error" },
    });
    return NextResponse.json({ error: "Falha ao buscar produtos da Nuvemshop" }, { status: 502 });
  }

  let synced = 0;
  const errors: string[] = [];

  for (const p of rawProducts) {
    try {
      const name = ptBr(p.name);
      if (!name) continue;

      const variant = Array.isArray(p.variants) ? p.variants[0] : null;
      const sku: string = variant?.sku || String(p.id);
      const price: number | undefined =
        variant?.price != null ? parseFloat(variant.price) : undefined;
      const imageUrl: string | undefined =
        Array.isArray(p.images) && p.images[0]?.src ? p.images[0].src : undefined;
      const ecommerceLink: string | undefined = p.permalink ?? undefined;
      const rawDesc = ptBr(p.description);
      const description: string | undefined = rawDesc ? stripHtml(rawDesc) : undefined;

      await db.product.upsert({
        where: { tenantId_sku: { tenantId, sku } },
        create: {
          tenantId,
          sku,
          name,
          description,
          imageUrl,
          price,
          ecommerceLink,
          concernTags: "[]",
          skinTypeTags: "[]",
          objectiveTags: "[]",
          isActive: true,
        },
        update: {
          name,
          description,
          imageUrl,
          price,
          ecommerceLink,
          isActive: true,
        },
      });
      synced++;
    } catch (err: any) {
      errors.push(`Produto ${p.id}: ${err.message}`);
    }
  }

  await db.integration.update({
    where: { tenantId_platform: { tenantId, platform: "nuvemshop" } },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({ synced, errors });
}
