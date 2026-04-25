"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { loadModels } from "@/lib/face-detection";

export function PhotoCapture({
  onCapture,
}: {
  onCapture: (base64: string) => void;
}) {
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
          setError("Nao foi possivel iniciar a camera.");
          setMode("choose");
        });
      };
    }
  }, [mode]);

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
      setError(
        "Nao foi possivel acessar a camera. Verifique as permissoes do navegador ou tente fazer upload de uma foto."
      );
    }
  }, []);

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
      setError("Por favor, selecione uma imagem.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Imagem muito grande. Maximo 10MB.");
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
        Fotografe seu rosto
      </h2>
      <p className="text-sm text-pierre text-center mb-6 font-light leading-relaxed">
        Para uma analise precisa, posicione seu rosto dentro da guia oval.
        Sem maquiagem, sem oculos e de frente para a camera.
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
                  Posicione seu rosto
                </span>
                <span className="text-[10px] text-pierre/50 font-light">
                  dentro da guia oval
                </span>
              </div>
            </div>
            {/* Top guide label */}
            <div className="absolute top-2 left-0 right-0 flex justify-center">
              <span className="text-[9px] text-pierre/60 uppercase tracking-wider font-light px-2 py-1 bg-ivoire">
                ↓ Topo da testa aqui ↓
              </span>
            </div>
            {/* Bottom guide label */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center">
              <span className="text-[9px] text-pierre/60 uppercase tracking-wider font-light px-2 py-1 bg-ivoire">
                ↑ Queixo aqui ↑
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={startCamera}
              className="px-4 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre transition-colors"
            >
              Tirar foto
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3 border border-sable/40 text-terre text-sm font-light hover:bg-ivoire transition-colors"
            >
              Fazer upload
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
              Para uma analise precisa
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-carbone font-light">Iluminacao</p>
                <p className="text-[11px] text-pierre/70 font-light leading-relaxed">
                  Luz natural frontal. Evite sombras no rosto e luz forte atras de voce.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-carbone font-light">Posicao</p>
                <p className="text-[11px] text-pierre/70 font-light leading-relaxed">
                  Olhe direto para a camera, rosto reto sem inclinar para os lados.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-carbone font-light">Preparacao</p>
                <p className="text-[11px] text-pierre/70 font-light leading-relaxed">
                  Sem maquiagem, sem oculos, cabelo preso mostrando a testa.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-carbone font-light">Enquadramento</p>
                <p className="text-[11px] text-pierre/70 font-light leading-relaxed">
                  Preencha o oval do topo da testa ate o queixo. So o rosto, sem corpo.
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
            {/* Face oval guide with labels */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-72">
                {/* Oval border */}
                <div className="absolute inset-0 border-2 border-white/50 rounded-[50%]" />
                {/* Corner tick marks for precision */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-px bg-white/60" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-px bg-white/60" />
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-white/60" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-6 bg-white/60" />
              </div>
            </div>
            {/* Top label */}
            <div className="absolute top-3 left-0 right-0 flex justify-center pointer-events-none">
              <span
                className="text-[10px] uppercase tracking-wider font-light px-3 py-1"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}
              >
                Testa aqui
              </span>
            </div>
            {/* Bottom label */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
              <span
                className="text-[10px] uppercase tracking-wider font-light px-3 py-1"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.8)" }}
              >
                Queixo aqui
              </span>
            </div>
            {/* Loading indicator while camera initializes */}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <p className="text-sm text-white/60 font-light">
                  Iniciando camera...
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-pierre font-light text-center">
            Alinhe o topo da testa e o queixo com a guia oval
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                stopCamera();
                setMode("choose");
              }}
              className="flex-1 px-4 py-3 border border-sable/40 text-terre text-sm font-light hover:bg-ivoire"
            >
              Cancelar
            </button>
            <button
              onClick={takePhoto}
              disabled={!cameraReady}
              className="flex-1 px-4 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre disabled:opacity-40"
            >
              {cameraReady ? "Capturar" : "Aguarde..."}
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
              Tirar outra
            </button>
            <button
              onClick={confirm}
              className="flex-1 px-4 py-3 bg-carbone text-blanc-casse text-sm font-light tracking-wide hover:bg-terre"
            >
              Usar esta foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
