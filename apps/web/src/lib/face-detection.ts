// Utility to detect face landmarks and map facial zone positions.
// Runs entirely client-side using face-api.js with tiny models served from /public/models.
// All positions are returned as percentages relative to the image dimensions.

import * as faceapi from "face-api.js";

let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

/**
 * Load the TinyFaceDetector and FaceLandmark68 models from /models.
 * Safe to call multiple times — loads only once and deduplicates concurrent calls.
 */
export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelsLoading) return modelsLoading;

  modelsLoading = (async () => {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    modelsLoaded = true;
  })();

  return modelsLoading;
}

export type FaceZonePositions = Record<string, { top: number; left: number }>;

// 68-point landmark index reference:
//   Jaw:            0–16
//   Right eyebrow: 17–21
//   Left eyebrow:  22–26
//   Nose bridge:   27–30   Nose base: 31–35
//   Right eye:     36–41
//   Left eye:      42–47
//   Outer mouth:   48–59   Inner mouth: 60–67

/**
 * Detect the face in an HTMLImageElement and return the key zone positions
 * (forehead, under_eyes, nose, left_cheek, right_cheek, chin, jawline) as
 * percentages of the image dimensions.
 *
 * Returns null if no face is detected or the models fail to load.
 *
 * Mirror note: camera previews in photo-capture.tsx are rendered with
 * `transform: scaleX(-1)` for the live view, but the canvas capture calls
 * `ctx.drawImage(video, 0, 0)` WITHOUT flipping — so the stored base64 image
 * is in the original (non-mirrored) orientation. Landmark coordinates
 * therefore already correspond to the correct screen position and no extra
 * horizontal flip is needed here.
 */
export async function detectFaceZones(
  imageElement: HTMLImageElement
): Promise<FaceZonePositions | null> {
  try {
    await loadModels();
  } catch {
    // Model loading failed (offline, 404, etc.) — caller should fall back
    return null;
  }

  try {
    // Use a smaller input size and lower threshold to detect faces in more
    // photo conditions (distant, angled, low contrast).
    const detection = await faceapi
      .detectSingleFace(
        imageElement,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.3,
        })
      )
      .withFaceLandmarks();

    if (!detection) return null;

    const pts = detection.landmarks.positions;
    const imgW = imageElement.naturalWidth || imageElement.width;
    const imgH = imageElement.naturalHeight || imageElement.height;

    if (imgW === 0 || imgH === 0) return null;

    // ── Forehead ──────────────────────────────────────────────────────────────
    // Midpoint between the two eyebrow centers, lifted by 40% of the
    // nose-tip-to-chin distance (a proxy for face height above the nose).
    const browMidX = (pts[19].x + pts[24].x) / 2;
    const browMidY = (pts[19].y + pts[24].y) / 2;
    const liftAmount = (pts[8].y - pts[27].y) * 0.4;
    const foreheadY = browMidY - liftAmount;

    // ── Under-eyes ────────────────────────────────────────────────────────────
    // Centre between the two eyes, shifted 10 px below the eye midline.
    const rightEyeMidX = (pts[36].x + pts[39].x) / 2;
    const rightEyeMidY = (pts[37].y + pts[41].y) / 2;
    const leftEyeMidX = (pts[42].x + pts[45].x) / 2;
    const leftEyeMidY = (pts[43].y + pts[47].y) / 2;
    const underEyesX = (rightEyeMidX + leftEyeMidX) / 2;
    const underEyesY = (rightEyeMidY + leftEyeMidY) / 2 + 10;

    // ── Nose ──────────────────────────────────────────────────────────────────
    // Tip of nose = landmark 30.
    const noseX = pts[30].x;
    const noseY = pts[30].y;

    // ── Left cheek (subject's anatomical left = viewer's right) ───────────────
    // Blend from the outer corner of the left eye toward the left jaw edge.
    const leftCheekX = pts[45].x + (pts[15].x - pts[45].x) * 0.3;
    const leftCheekY = (pts[45].y + pts[30].y) / 2;

    // ── Right cheek (subject's anatomical right = viewer's left) ─────────────
    const rightCheekX = pts[36].x - (pts[36].x - pts[1].x) * 0.3;
    const rightCheekY = (pts[36].y + pts[30].y) / 2;

    // ── Chin ──────────────────────────────────────────────────────────────────
    // Landmark 8 is the very tip of the chin; pull up slightly so the marker
    // sits on the chin area rather than below it.
    const chinX = pts[8].x;
    const chinY = pts[8].y - 5;

    // ── Jawline ───────────────────────────────────────────────────────────────
    // Use landmark 4 (right side of jaw, viewer's perspective) as the
    // canonical jawline marker position.
    const jawlineX = pts[4].x;
    const jawlineY = pts[4].y;

    const pct = (px: number, dim: number) =>
      Math.max(2, Math.min(98, (px / dim) * 100));

    return {
      forehead:   { top: pct(foreheadY, imgH),   left: pct(browMidX, imgW)   },
      under_eyes: { top: pct(underEyesY, imgH),  left: pct(underEyesX, imgW) },
      nose:       { top: pct(noseY, imgH),        left: pct(noseX, imgW)      },
      left_cheek: { top: pct(leftCheekY, imgH),  left: pct(leftCheekX, imgW) },
      right_cheek:{ top: pct(rightCheekY, imgH), left: pct(rightCheekX, imgW)},
      chin:       { top: pct(chinY, imgH),        left: pct(chinX, imgW)      },
      jawline:    { top: pct(jawlineY, imgH),     left: pct(jawlineX, imgW)   },
    };
  } catch {
    return null;
  }
}
