"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { loadModels } from "@/lib/face-detection";
import { useI18n } from "@/lib/i18n/client";

export function PhotoCapture({
  onCapture,
}: {
  onCapture: (base64: string) => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"choose" | "camera" | "preview">("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-load face-api.js models in the background so they are warm by the time
  // the user reaches the results screen. Errors are silently ignored — the
  // annotated photo component will fall back to fixed zone positions.
  useEffect(() => {
    loadModels().catch(() => {});
  }, []);

  // Attach stream to video element once camera mode is active and video is in DOM
  useEffect(() => {
    if (mode === "camera" && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => {
        video.play().then(() => setCameraReady(true)).catch(() => {
          setError(t.patient.photo_error_camera_start);
          setMode("choose");
        });
      };
    }
  }, [mode, t]);

  const startCamera = useCallback(async () => {
    setError("");
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
      });
      streamRef.current = stream;
      // Switch to camera mode - the useEffect above will attach the stream
      setMode("camera");
    } catch {
      setError(t.patient.photo_error_camera);
    }
  }, [t]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }

  function takePhoto() {
    if (!videoRef.current || !cameraReady) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw without flipping — the live preview is mirrored via CSS (scaleX(-1))
    // but we store the unmirrored frame so landmark coordinates are consistent.
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    setPreview(base64);
    setMode("preview");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t.patient.photo_error_file_type);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(t.patient.photo_error_file_size);
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setPreview(base64);
      setMode("preview");
    };
    reader.readAsDataURL(file);
  }

  function confirm() {
    if (preview) onCapture(preview);
  }

  function retry() {
    setPreview(null);
    setMode("choose");
  }

  return (
    <div className="w-full max-w-lg mx-auto px-4">
      <h2 className="font-serif text-xl text-carbone mb-2 text-center">
        {t.patient.photo_title}
      </h2>
      <p className="text-sm text-pierre text-center mb-6 font-light leading-relaxed">
        {t.patient.photo_instruction}
      </p>

      {error && (
        <div className="mb-4 p-3 text-sm text-terre bg-ivoire border border-sable/30 font-light">
          {error}
        </div>
      )}

      {mode === "choose" && (
        <div className="space-y-4">
          {/* Face positioning guide */}
          <div className="relative w-72 h-96 mx-auto bg-ivoire flex items-center justify-center overflow-hidden">
            {/* Oval guide */}
            <div className="relative w-52 h-72 border-2 border-dashed border-sable/60 rounded-[50%] flex items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
                  {t.patient.photo_position_face}
                </span>
                <span className="text-[10px] text-pierre/50 font-light">
                  {t.patient.photo_oval_label}
                </span>
              </div>
            </div>
            {/* Top guide label */}
            <div className="absolute top-2 left-0 right-0 flex justify-center">
              <span className="text-[9px] text-pierre/60 uppercase tracking-wider font-light px-2 py-1 bg-ivoire">
                {t.patient.photo_top_hint}
              </span>
            </div>
            {/* Bottom guide label */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <span className="text-[9px] text-pierre/60 uppercase tracking-wider font-light px-2 py-1 bg-ivoire">
                {t.patient.photo_bottom_hint}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={startCamera}
              className="px-4 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
            >
              {t.patient.photo_take}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3 border border-sable/40 text-terre text-sm font-light hover:bg-ivoire transition-colors"
            >
              {t.patient.photo_upload}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="mt-6 p-4 bg-white border border-sable/20 space-y-3">
            <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
              {t.patient.photo_tips_title}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-carbone font-light">
                  {t.patient.photo_tip_lighting_title}
                </p>
                <p className="text-[11px] text-pierre/70 font-light leading-relaxed">
                  {t.patient.photo_tip_lighting_text}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-carbone font-light">
                  {t.patient.photo_tip_position_title}
                </p>
                <p className="text-[11px] text-pierre/70 font-light leading-relaxed">
                  {t.patient.photo_tip_position_text}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-carbone font-light">
                  {t.patient.photo_tip_prep_title}
                </p>
                <p className="text-[11px] text-pierre/70 font-light leading-relaxed">
                  {t.patient.photo_tip_prep_text}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-carbone font-light">
                  {t.patient.photo_tip_frame_title}
                </p>
                <p className="text-[11px] text-pierre/70 font-light leading-relaxed">
                  {t.patient.photo_tip_frame_text}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "camera" && (
        <div className="space-y-4">
          <div className="relative overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[3/4] object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {/* Face oval guide with labels anchored to oval edges */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-72">
                {/* Oval border */}
                <div className="absolute inset-0 border-2 border-white/50 rounded-[50%]" />
                {/* Corner tick marks for precision */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px bg-white/60" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-px bg-white/60" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-white/60" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-white/60" />
                {/* Top label — anchored to top of oval */}
                <div className="absolute -top-7 left-0 right-0 flex justify-center">
                  <span
                    className="text-[10px] uppercase tracking-wider font-light px-3 py-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}
                  >
                    {t.patient.photo_forehead_label}
                  </span>
                </div>
                {/* Bottom label — anchored to bottom of oval */}
                <div className="absolute -bottom-7 left-0 right-0 flex justify-center">
                  <span
                    className="text-[10px] uppercase tracking-wider font-light px-3 py-1"
                    style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}
                  >
                    {t.patient.photo_chin_label}
                  </span>
                </div>
              </div>
            </div>
            {/* Loading indicator while camera initializes */}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <p className="text-sm text-white/60 font-light">
                  {t.patient.photo_camera_initializing}
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-pierre font-light text-center">
            {t.patient.photo_align_text}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                stopCamera();
                setMode("choose");
              }}
              className="flex-1 px-4 py-3 border border-sable/40 text-terre text-sm font-light hover:bg-ivoire"
            >
              {t.patient.photo_cancel}
            </button>
            <button
              onClick={takePhoto}
              disabled={!cameraReady}
              className="flex-1 px-4 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-40"
            >
              {cameraReady ? t.patient.photo_capture : t.patient.photo_wait}
            </button>
          </div>
        </div>
      )}

      {mode === "preview" && preview && (
        <div className="space-y-4">
          <div className="overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full aspect-[3/4] object-cover"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="flex-1 px-4 py-3 border border-sable/40 text-terre text-sm font-light hover:bg-ivoire"
            >
              {t.patient.photo_retry}
            </button>
            <button
              onClick={confirm}
              className="flex-1 px-4 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre"
            >
              {t.patient.photo_use}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
