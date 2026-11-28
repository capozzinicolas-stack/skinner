// Identity lock for the clinic projection (Nov-2026).
//
// Even the best image model re-renders the whole photo: eyes, brows, lips,
// hair and the overall color drift slightly, and the patient reads it as
// "this is not me". The procedures only act on known areas, so after the
// edit only those areas are taken from the result; every other pixel is the
// input photo's. Steps:
//   1. align the result to the input (the model may shift it a few pixels),
//   2. undo its global color drift, measured on the area that must not change,
//   3. blend the result back through a soft mask: the sign zones of this
//      stage (plus the face skin when there are skin-quality effects), minus
//      eyes, brows, nose and lips.
// Any failure returns the result unchanged.
//
// Server only (sharp). Zones and face map come from the browser landmarks.

import sharp from "sharp";
import type { FaceMap, ZoneEllipse } from "./visible-signs";

// Sign zones are tight around the sign; the edit spreads a little further.
const ZONE_GROW = 1.35;
// Alignment search on a downscaled copy: ±MAX_SHIFT px at ALIGN_WIDTH.
const ALIGN_WIDTH = 256;
const MAX_SHIFT = 8;

function dataUrlToBuffer(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.replace(/^data:image\/[\w+.-]+;base64,/, ""), "base64");
}

function polygon(pts: { x: number; y: number }[], W: number, H: number, fill: string): string {
  return `<polygon points="${pts.map((p) => `${p.x * W},${p.y * H}`).join(" ")}" fill="${fill}"/>`;
}

/** Soft alpha mask (1 channel, W×H): white where the edit is kept. */
async function buildMask(W: number, H: number, zones: ZoneEllipse[], face: FaceMap | undefined, wholeFace: boolean): Promise<Buffer> {
  const ellipses = zones
    .map((e) => {
      const cx = e.cx * W, cy = e.cy * H;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${Math.max(e.rx * W * ZONE_GROW, 6)}" ry="${Math.max(e.ry * H * ZONE_GROW, 6)}" transform="rotate(${(e.rot * 180) / Math.PI} ${cx} ${cy})" fill="white"/>`;
    })
    .join("");
  const skin = wholeFace && face ? polygon(face.outline, W, H, "white") : "";
  const protect = (face?.protect ?? []).map((p) => polygon(p, W, H, "black")).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="black"/>${skin}${ellipses}${protect}</svg>`;
  const feather = Math.max(Math.round(Math.min(W, H) * 0.025), 2);
  return sharp(Buffer.from(svg)).blur(feather).greyscale().extractChannel(0).raw().toBuffer();
}

/** Offset (in full-size px) where `edited` best matches `base`. */
async function findShift(base: Buffer, edited: Buffer, W: number, H: number): Promise<{ dx: number; dy: number }> {
  const w = ALIGN_WIDTH;
  const h = Math.round((H / W) * w);
  const grey = (b: Buffer) => sharp(b).resize(w, h, { fit: "fill" }).greyscale().raw().toBuffer();
  const [a, b] = await Promise.all([grey(base), grey(edited)]);
  let best = { dx: 0, dy: 0, err: Infinity };
  const m = MAX_SHIFT;
  for (let dy = -m; dy <= m; dy++) {
    for (let dx = -m; dx <= m; dx++) {
      let err = 0;
      // Every second pixel is enough to rank the offsets.
      for (let y = m; y < h - m; y += 2) {
        for (let x = m; x < w - m; x += 2) {
          err += Math.abs(a[y * w + x] - b[(y + dy) * w + (x + dx)]);
        }
      }
      if (err < best.err) best = { dx, dy, err };
    }
  }
  return { dx: Math.round((best.dx * W) / w), dy: Math.round((best.dy * H) / h) };
}

/**
 * Keeps `edited` only inside the treated areas and `base` everywhere else.
 * `zones` are this stage's sign zones; `wholeFace` adds the face skin
 * (skin-quality effects such as redness or spots act on all of it).
 */
export async function lockIdentity(
  base: string,
  edited: string,
  zones: ZoneEllipse[],
  face: FaceMap | undefined,
  wholeFace: boolean
): Promise<string> {
  // Nothing to change at this stage: the input stays as it is.
  if (zones.length === 0 && !(wholeFace && face)) return base;
  try {
    const baseBuf = dataUrlToBuffer(base);
    const meta = await sharp(baseBuf).metadata();
    const W = meta.width ?? 0;
    const H = meta.height ?? 0;
    if (!W || !H) return edited;
    const editedBuf = await sharp(dataUrlToBuffer(edited)).resize(W, H, { fit: "fill" }).removeAlpha().jpeg({ quality: 95 }).toBuffer();

    // 1. Alignment.
    const { dx, dy } = await findShift(baseBuf, editedBuf, W, H);
    const pad = Math.max(Math.abs(dx), Math.abs(dy));
    const aligned = pad === 0
      ? editedBuf
      : await sharp(
          // Separate pipelines: sharp runs extract before extend otherwise.
          await sharp(editedBuf).extend({ left: pad, right: pad, top: pad, bottom: pad, extendWith: "mirror" }).toBuffer()
        )
          .extract({ left: pad + dx, top: pad + dy, width: W, height: H })
          .toBuffer();

    // 2. Color drift, measured where nothing should change (mask ≈ 0).
    const mask = await buildMask(W, H, zones, face, wholeFace);
    const [b, e] = await Promise.all([
      sharp(baseBuf).removeAlpha().toColourspace("srgb").raw().toBuffer(),
      sharp(aligned).removeAlpha().toColourspace("srgb").raw().toBuffer(),
    ]);
    const sumB = [0, 0, 0], sumE = [0, 0, 0];
    let n = 0;
    for (let i = 0; i < W * H; i += 3) {
      if (mask[i] > 8) continue;
      for (let c = 0; c < 3; c++) {
        sumB[c] += b[i * 3 + c];
        sumE[c] += e[i * 3 + c];
      }
      n++;
    }
    const gain = sumB.map((s, c) => (n > 0 && sumE[c] > 0 ? Math.min(Math.max(s / sumE[c], 0.85), 1.15) : 1));

    // 3. Blend through the mask.
    const corrected = await sharp(e, { raw: { width: W, height: H, channels: 3 } }).linear(gain, [0, 0, 0]).raw().toBuffer();
    const rgba = await sharp(corrected, { raw: { width: W, height: H, channels: 3 } })
      .joinChannel(mask, { raw: { width: W, height: H, channels: 1 } })
      .png()
      .toBuffer();
    const out = await sharp(baseBuf).removeAlpha().composite([{ input: rgba, left: 0, top: 0 }]).jpeg({ quality: 93 }).toBuffer();
    return `data:image/jpeg;base64,${out.toString("base64")}`;
  } catch (err) {
    console.error("[projection] identity lock skipped:", err instanceof Error ? err.message : err);
    return edited;
  }
}
