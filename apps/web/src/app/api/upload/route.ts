import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET_NAME = "product-images";

// Server-side Supabase client using the anon key.
// The bucket is public so the anon key is sufficient to upload + read.
// Both env vars are REQUIRED in every environment — no hardcoded fallbacks
// because (a) leaks the project ID into git, (b) a wrong-project upload would
// silently succeed against the dev bucket. Missing key → 500 with clear log.
//
// URL normalization: @supabase/supabase-js concatenates /storage/v1/... onto
// the base URL, so anything OTHER than a clean origin (protocol + host)
// breaks. Operators paste URLs in many shapes:
//   - https://xyz.supabase.co                  ✓
//   - https://xyz.supabase.co/                 ✗ trailing slash → double slash
//   - https://xyz.supabase.co/rest/v1          ✗ pasted REST endpoint
//   - https://xyz.supabase.co/rest/v1/         ✗ pasted REST endpoint
//   - https://xyz.supabase.co/storage/v1       ✗ pasted Storage endpoint
// All produce "Invalid path specified in request URL" on the first storage
// call. Reduce to origin once at the source — guarantees a clean base URL
// regardless of what was pasted in Vercel. Invalid URLs fall through as "".
function normalizeSupabaseUrl(raw: string): string {
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}
const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Server-side diagnostic log — surfaces in Vercel function logs so the
    // operator can immediately see WHICH var is missing without guessing.
    // Hit /api/health/storage from a browser session for the same info.
    console.error(
      "[upload] Supabase Storage not configured. Missing env vars:",
      {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "set" : "MISSING",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "set" : "MISSING",
      },
    );
    return null;
  }
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
      { error: "Erro interno ao processar o envio da imagem." },
      { status: 500 }
    );
  }
}
