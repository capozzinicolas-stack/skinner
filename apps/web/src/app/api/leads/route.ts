import { NextRequest, NextResponse } from "next/server";
import { db } from "@skinner/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, segment, message } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e e-mail obrigatorios" }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        name,
        email,
        company: company || null,
        segment: segment || null,
        message: message || null,
        source: "website",
      },
    });

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (error) {
    console.error("Lead creation error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
