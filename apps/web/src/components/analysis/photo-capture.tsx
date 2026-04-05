"use client";

import { useState, useRef, useCallback } from "react";

export function PhotoCapture({
  onCapture,
}: {
  onCapture: (base64: string) => void;
}) {
  const [mode, setMode] = useState<"choose" | "camera" | "preview">("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMode("camera");
    } catch {
      setError("Não foi possível acessar a câmera. Tente fazer upload de uma foto.");
    }
  }, []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function takePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
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
      setError("Imagem muito grande. Máximo 10MB.");
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
      <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        Fotografe seu rosto
      </h2>
      <p className="text-sm text-gray-500 text-center mb-6">
        Para uma análise precisa, tire uma foto com boa iluminação, sem maquiagem e de frente.
      </p>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Choose mode */}
      {mode === "choose" && (
        <div className="space-y-4">
          {/* Guide overlay */}
          <div className="relative w-64 h-80 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
            <div className="w-48 h-60 border-2 border-dashed border-brand-400 rounded-[50%] flex items-center justify-center">
              <p className="text-sm text-brand-500 text-center px-4">
                Posicione seu rosto aqui
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={startCamera}
              className="px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Tirar foto
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Fazer upload
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Tips */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase">Dicas para melhor resultado</p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>- Boa iluminação natural, sem sombras fortes</li>
              <li>- Sem maquiagem ou filtros</li>
              <li>- Rosto de frente, olhando para a câmera</li>
              <li>- Cabelo preso para mostrar a testa</li>
            </ul>
          </div>
        </div>
      )}

      {/* Camera */}
      {mode === "camera" && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full aspect-[3/4] object-cover mirror"
              style={{ transform: "scaleX(-1)" }}
            />
            {/* Face oval guide */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-60 border-2 border-white/50 rounded-[50%]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { stopCamera(); setMode("choose"); }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={takePhoto}
              className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700"
            >
              Capturar
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {mode === "preview" && preview && (
        <div className="space-y-4">
          <div className="rounded-2xl overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full aspect-[3/4] object-cover"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={retry}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Tirar outra
            </button>
            <button
              onClick={confirm}
              className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700"
            >
              Usar esta foto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
