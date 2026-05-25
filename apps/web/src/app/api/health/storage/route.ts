import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createClient } from "@supabase/supabase-js";

/**
 * Admin-only diagnostic endpoint for the image upload pipeline.
 *
 * Returns whether the Supabase Storage env vars are populated AND whether
 * the configured bucket is actually reachable with the configured key.
 * Lets the operator confirm production env wiring from a logged-in browser
 * session without opening the Vercel dashboard.
 *
 * Does NOT leak the actual key values — only boolean flags + masked URL
 * (host portion only). Safe to keep around.
 *
 * Usage: GET https://app.skinner.lat/api/health/storage (logged in as
 * skinner_admin on admin.skinner.lat first).
 *
 * Wired here on app.* on purpose: the upload endpoint that fails lives on
 * app.*, so hitting health/storage on the SAME host validates the same
 * serverless function environment.
 */
export const dynamic = "force-dynamic";

const BUCKET_NAME = "product-images";

export async function GET(req: NextRequest) {
  // Gate to skinner_admin so this isn't a probe surface for the public.
  const jwt = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!jwt || jwt.role !== "skinner_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // Strip trailing slashes for the same reason as api/upload/route.ts.
  const url = rawUrl.replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const trailingSlashStripped = rawUrl !== url;

  // Mask URL — show only the host so the operator can sanity-check they're
  // pointing at the right Supabase project without leaking the full URL into
  // logs / screenshots.
  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = "invalid-url";
  }

  const baseResult = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? "set" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? "set" : "MISSING",
    },
    urlHost,
    urlPath: (() => {
      try {
        return url ? new URL(url).pathname : null;
      } catch {
        return null;
      }
    })(),
    trailingSlashStripped,
    bucket: BUCKET_NAME,
  };

  if (!url || !key) {
    return NextResponse.json({
      ok: false,
      reason: "missing_env_vars",
      ...baseResult,
    });
  }

  // Validate the bucket is actually reachable with the configured key. A
  // missing/renamed bucket or a rotated key would manifest here.
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
    if (error) {
      return NextResponse.json({
        ok: false,
        reason: "bucket_error",
        message: error.message,
        ...baseResult,
      });
    }
    return NextResponse.json({
      ok: true,
      ...baseResult,
      bucketPublic: data?.public ?? null,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      reason: "client_error",
      message: err instanceof Error ? err.message : String(err),
      ...baseResult,
    });
  }
}
