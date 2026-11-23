// Clinic projection guide image (Nov-2026). Draws magenta outlines around
// the target areas of each visible sign on a copy of the patient photo, so
// the image model knows WHERE on this face to edit ("the jowl" alone was
// not enough — the model retouched the whole face and left the jowl as is).
// Runs in the browser: face-api landmarks are only available client-side.
// Any failure returns null and the projection runs without a guide.

import { detectLandmarks } from "@/lib/face-detection";
import {
  BILATERAL_SIGNS,
  type SignId,
  type SignSide,
  type SignZone,
  type VisibleSign,
} from "@/lib/sae/visible-signs";

type Pt = { x: number; y: number };
type Ellipse = { cx: number; cy: number; rx: number; ry: number; rot: number };

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Ellipse along the segment a→b with half-width w. */
function along(a: Pt, b: Pt, w: number): Ellipse {
  const c = mid(a, b);
  return { cx: c.x, cy: c.y, rx: dist(a, b) / 2 + w * 0.4, ry: w, rot: Math.atan2(b.y - a.y, b.x - a.x) };
}

/**
 * Regions per sign. Landmarks follow the 68-point scheme; index 0 is on the
 * image-left jaw edge, so "image_left" uses the lower-index side.
 */
function regions(p: Pt[], sign: SignId, side: SignSide): Ellipse[] {
  const eyeL = mid(p[36], p[39]); // image-left eye
  const eyeR = mid(p[42], p[45]);
  const u = dist(eyeL, eyeR); // interocular unit
  const sides: ("L" | "R")[] =
    !BILATERAL_SIGNS.has(sign) || side === "both" || side === "center"
      ? ["L", "R"]
      : side === "image_left"
        ? ["L"]
        : ["R"];
  const per = (f: (s: "L" | "R") => Ellipse) => sides.map(f);
  const brow = mid(p[21], p[22]);

  switch (sign) {
    case "glabellar_lines":
      return [{ cx: brow.x, cy: brow.y - 0.12 * u, rx: 0.3 * u, ry: 0.32 * u, rot: 0 }];
    case "forehead_lines":
      return [{ cx: brow.x, cy: brow.y - 0.75 * u, rx: 1.1 * u, ry: 0.38 * u, rot: 0 }];
    case "crows_feet":
      return per((s) => {
        const c = s === "L" ? p[36] : p[45];
        return { cx: c.x + (s === "L" ? -0.28 : 0.28) * u, cy: c.y, rx: 0.22 * u, ry: 0.3 * u, rot: 0 };
      });
    case "upper_eyelid_hooding":
      return per((s) => {
        const e = s === "L" ? eyeL : eyeR;
        return { cx: e.x, cy: e.y - 0.18 * u, rx: 0.38 * u, ry: 0.13 * u, rot: 0 };
      });
    case "tear_trough":
      return per((s) => {
        const e = s === "L" ? eyeL : eyeR;
        return { cx: e.x, cy: e.y + 0.3 * u, rx: 0.36 * u, ry: 0.15 * u, rot: 0 };
      });
    case "midface_volume_loss":
      return per((s) => {
        const c = s === "L" ? lerp(p[36], p[2], 0.45) : lerp(p[45], p[14], 0.45);
        return { cx: c.x, cy: c.y + 0.25 * u, rx: 0.35 * u, ry: 0.3 * u, rot: 0 };
      });
    case "nasolabial_fold":
      return per((s) =>
        s === "L"
          ? along({ x: p[31].x - 0.12 * u, y: p[31].y }, p[48], 0.13 * u)
          : along({ x: p[35].x + 0.12 * u, y: p[35].y }, p[54], 0.13 * u)
      );
    case "marionette_lines":
      return per((s) => (s === "L" ? along(p[48], lerp(p[48], p[6], 0.75), 0.12 * u) : along(p[54], lerp(p[54], p[10], 0.75), 0.12 * u)));
    case "perioral_lines":
      return [{ cx: mid(p[48], p[54]).x, cy: mid(p[48], p[54]).y, rx: 0.6 * u, ry: 0.35 * u, rot: 0 }];
    case "jowls":
      return per((s) => {
        const c = s === "L" ? lerp(p[5], p[48], 0.25) : lerp(p[11], p[54], 0.25);
        return { cx: c.x, cy: c.y, rx: 0.33 * u, ry: 0.3 * u, rot: 0 };
      });
    case "submental_fullness":
      return [{ cx: p[8].x, cy: p[8].y + 0.3 * u, rx: 0.6 * u, ry: 0.25 * u, rot: 0 }];
    case "neck_bands":
      return [{ cx: p[8].x, cy: p[8].y + 0.8 * u, rx: 0.65 * u, ry: 0.4 * u, rot: 0 }];
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Guide image plus the normalized zone of each sign (the server crops and
 * blends each area from them). Null when no face is found.
 */
export async function buildProjectionGuide(
  photoBase64: string,
  signs: VisibleSign[]
): Promise<{ guide: string; zones: SignZone[] } | null> {
  if (signs.length === 0 || typeof document === "undefined") return null;
  try {
    const img = await loadImage(photoBase64);
    const pts = await detectLandmarks(img);
    if (!pts) return null;

    const canvas = document.createElement("canvas");
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = "#FF00FF";
    ctx.lineWidth = Math.max(3, Math.round(canvas.width / 200));
    const zones: SignZone[] = [];
    for (const s of signs) {
      const ellipses = regions(pts, s.sign, s.side);
      for (const e of ellipses) {
        ctx.beginPath();
        ctx.ellipse(e.cx, e.cy, Math.max(e.rx, 4), Math.max(e.ry, 4), e.rot, 0, Math.PI * 2);
        ctx.stroke();
      }
      zones.push({
        sign: s.sign,
        ellipses: ellipses.map((e) => ({ cx: e.cx / W, cy: e.cy / H, rx: e.rx / W, ry: e.ry / H, rot: e.rot })),
      });
    }
    return { guide: canvas.toDataURL("image/jpeg", 0.85), zones };
  } catch {
    return null;
  }
}
