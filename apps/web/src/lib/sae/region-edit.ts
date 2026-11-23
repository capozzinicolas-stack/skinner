// Region edit for the clinic projection (Nov-2026).
//
// Gemini barely edits a full-face selfie: in the Nov-2026 test the same
// grade targets produced almost no visible change, even with stronger
// wording. Sent an enlarged crop of one area (forehead and eyes, or the
// lower face), it edits that area much more. This module crops the area
// around the given zones, lets the caller edit the crop, and blends the
// result back through a soft mask drawn on the treated zones only, so the
// crop border (where the model may shift or recolor slightly) never shows.
//
// Server only (sharp). Zones come from the browser's face landmarks.

import sharp from "sharp";
import type { ZoneEllipse } from "./visible-signs";

type Box = { left: number; top: number; width: number; height: number };

// Aspect ratios Gemini returns without reframing.
const RATIOS = [1, 4 / 3, 3 / 4, 3 / 2, 2 / 3, 16 / 9];
// Ellipses are grown so the blend covers the surrounding skin too.
const GROW = 1.7;
const MIN_EDIT_SIDE = 1024;

function dataUrlToBuffer(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.replace(/^data:image\/[\w+.-]+;base64,/, ""), "base64");
}

function bufferToDataUrl(buf: Buffer): string {
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

/** Ellipses in pixels, grown by GROW. */
function toPixels(ellipses: ZoneEllipse[], W: number, H: number): ZoneEllipse[] {
  return ellipses.map((e) => ({
    cx: e.cx * W,
    cy: e.cy * H,
    rx: Math.max(e.rx * W * GROW, 8),
    ry: Math.max(e.ry * H * GROW, 8),
    rot: e.rot,
  }));
}

/** Crop box around the ellipses plus the feather, at a Gemini-friendly ratio. */
function cropBox(ellipses: ZoneEllipse[], feather: number, W: number, H: number): Box {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of ellipses) {
    const r = Math.max(e.rx, e.ry);
    x0 = Math.min(x0, e.cx - r);
    y0 = Math.min(y0, e.cy - r);
    x1 = Math.max(x1, e.cx + r);
    y1 = Math.max(y1, e.cy + r);
  }
  x0 -= feather; y0 -= feather; x1 += feather; y1 += feather;
  let w = x1 - x0;
  let h = y1 - y0;
  const ratio = RATIOS.reduce((best, r) => (Math.abs(Math.log(w / h / r)) < Math.abs(Math.log(w / h / best)) ? r : best));
  if (w / h < ratio) w = h * ratio;
  else h = w / ratio;
  w = Math.min(w, W);
  h = Math.min(h, H);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const left = Math.round(Math.min(Math.max(cx - w / 2, 0), W - w));
  const top = Math.round(Math.min(Math.max(cy - h / 2, 0), H - h));
  return { left, top, width: Math.round(w), height: Math.round(h) };
}

/** White filled ellipses, blurred into a soft alpha mask the size of the box. */
async function softMask(ellipses: ZoneEllipse[], box: Box, feather: number): Promise<Buffer> {
  const shapes = ellipses
    .map(
      (e) =>
        `<ellipse cx="${e.cx - box.left}" cy="${e.cy - box.top}" rx="${e.rx}" ry="${e.ry}" ` +
        `transform="rotate(${(e.rot * 180) / Math.PI} ${e.cx - box.left} ${e.cy - box.top})" fill="white"/>`
    )
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}"><rect width="100%" height="100%" fill="black"/>${shapes}</svg>`;
  return sharp(Buffer.from(svg)).blur(Math.max(feather / 2, 1)).greyscale().extractChannel(0).raw().toBuffer();
}

/**
 * Crops `photo` around `ellipses`, passes the enlarged crop to `edit` and
 * blends the edited crop back over the treated zones. Returns the photo
 * unchanged (and logs) when the edit fails, so one area never blocks the
 * projection.
 */
export async function editRegion(
  photo: string,
  ellipses: ZoneEllipse[],
  edit: (crop: string) => Promise<string>
): Promise<string> {
  const base = dataUrlToBuffer(photo);
  const meta = await sharp(base).metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  if (!W || !H || ellipses.length === 0) return photo;

  const px = toPixels(ellipses, W, H);
  const feather = Math.round(Math.min(W, H) * 0.06);
  const box = cropBox(px, feather, W, H);
  if (box.width < 32 || box.height < 32) return photo;

  try {
    const scale = Math.max(1, MIN_EDIT_SIDE / Math.max(box.width, box.height));
    const crop = await sharp(base)
      .extract(box)
      .resize(Math.round(box.width * scale), Math.round(box.height * scale))
      .jpeg({ quality: 95 })
      .toBuffer();
    const edited = dataUrlToBuffer(await edit(bufferToDataUrl(crop)));

    const back = await sharp(edited)
      .resize(box.width, box.height, { fit: "fill" })
      .removeAlpha()
      .toColourspace("srgb")
      .raw()
      .toBuffer();
    const mask = await softMask(px, box, feather);
    const rgba = await sharp(back, { raw: { width: box.width, height: box.height, channels: 3 } })
      .joinChannel(mask, { raw: { width: box.width, height: box.height, channels: 1 } })
      .png()
      .toBuffer();
    const out = await sharp(base)
      .composite([{ input: rgba, left: box.left, top: box.top }])
      .jpeg({ quality: 93 })
      .toBuffer();
    return bufferToDataUrl(out);
  } catch (err) {
    console.error("[projection] region edit skipped:", err instanceof Error ? err.message : err);
    return photo;
  }
}
