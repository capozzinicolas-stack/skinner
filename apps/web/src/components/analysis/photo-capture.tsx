"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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
      <p className="text-sm text-pierre text-center mb-6 font-light">
        Para uma analise precisa, tire uma foto com boa iluminacao, sem
        maquiagem e de frente.
      </p>

      {error && (
        <div className="mb-4 p-3 text-sm text-terre bg-ivoire border border-sable/30 font-light">
          {error}
        </div>
      )}

      {mode === "choose" && (
        <div className="space-y-4">
          <div className="relative w-64 h-80 mx-auto bg-ivoire flex items-center justify-center">
            <div className="w-48 h-60 border border-dashed border-sable flex items-center justify-center">
              <p className="text-sm text-pierre text-center px-4 font-light">
                Posicione seu rosto aqui
              </p>
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

          <div className="mt-6 space-y-2">
            <p className="text-xs text-pierre uppercase tracking-wider font-light">
              Dicas para melhor resultado
            </p>
            <ul className="text-xs text-pierre/70 space-y-1 font-light">
              <li>Boa iluminacao natural, sem sombras fortes</li>
              <li>Sem maquiagem ou filtros</li>
              <li>Rosto de frente, olhando para a camera</li>
              <li>Cabelo preso para mostrar a testa</li>
            </ul>
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
            {/* Face oval guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border border-white/40 rounded-[50%]" />
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
