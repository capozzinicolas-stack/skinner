import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function generateFilename(originalName: string): string {
  // Simple unique ID: timestamp + random hex, no external dependency needed
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  return `${timestamp}-${random}${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato inválido. Use JPEG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Validate file size
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo permitido: 5 MB." },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "products");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filename = generateFilename(file.name);
    const filePath = path.join(uploadsDir, filename);

    await writeFile(filePath, Buffer.from(arrayBuffer));

    const publicUrl = `/uploads/products/${filename}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[upload] erro ao salvar arquivo:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar o upload." },
      { status: 500 }
    );
  }
}
