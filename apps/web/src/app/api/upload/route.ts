import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET_NAME = "product-images";

// Server-side Supabase client using the anon key.
// The bucket is public so the anon key is sufficient to upload + read.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://xveputgkwmxjitcxwmya.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  if (!supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

function generateFilename(originalName: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 9);
  const lastDot = originalName.lastIndexOf(".");
  const ext = lastDot >= 0 ? originalName.slice(lastDot).toLowerCase() : ".jpg";
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

    const filename = generateFilename(file.name);

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        {
          error:
            "Armazenamento de imagens não configurado. Contate o administrador.",
        },
        { status: 500 }
      );
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, arrayBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload] supabase error:", uploadError);
      return NextResponse.json(
        { error: "Erro ao salvar imagem. Tente novamente." },
        { status: 500 }
      );
    }

    // Get public URL
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error("[upload] erro ao processar upload:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar o upload." },
      { status: 500 }
    );
  }
}
