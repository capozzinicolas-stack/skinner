"use client";

import { useRef, useState, useCallback } from "react";

interface ImageUploadProps {
  /** Current image URL — populated in edit mode or after a successful upload */
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

const ACCEPTED = "image/jpeg,image/png,image/webp";
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Formato inválido. Use JPEG, PNG ou WebP.");
        return;
      }

      if (file.size > MAX_BYTES) {
        setError(`Arquivo muito grande. Máximo permitido: ${MAX_MB} MB.`);
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Erro ao enviar imagem.");
          return;
        }

        onChange(json.url as string);
      } catch {
        setError("Erro ao enviar imagem. Tente novamente.");
      } finally {
        setUploading(false);
      }
    },
    [onChange]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // If we already have an image URL, show preview with remove button
  if (value) {
    return (
      <div className="border border-sable/40 bg-blanc-casse">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Imagem do produto"
          className="w-full h-40 object-contain bg-ivoire"
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-sable/20">
          <span className="text-[10px] text-pierre uppercase tracking-wider font-light truncate max-w-[200px]">
            {value.split("/").pop()}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="text-[10px] text-pierre uppercase tracking-wider font-light hover:text-carbone transition-colors"
            >
              Remover
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Área de upload de imagem"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "flex flex-col items-center justify-center gap-2 px-4 py-8",
          "border border-dashed transition-colors",
          disabled
            ? "cursor-not-allowed border-sable/20 bg-ivoire"
            : dragging
            ? "cursor-copy border-pierre bg-ivoire"
            : "cursor-pointer border-sable/40 bg-blanc-casse hover:border-pierre hover:bg-ivoire",
        ].join(" ")}
      >
        {uploading ? (
          <>
            <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
              Enviando...
            </span>
            {/* Thin progress indicator */}
            <div className="w-24 h-px bg-sable/40 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-1/2 bg-pierre animate-pulse" />
            </div>
          </>
        ) : (
          <>
            {/* Upload icon — inline SVG to avoid any extra dependency */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-pierre"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="text-[10px] text-pierre uppercase tracking-wider font-light text-center">
              Arraste uma imagem ou clique para selecionar
            </span>
            <span className="text-[10px] text-sable font-light">
              JPEG, PNG ou WebP — máx. {MAX_MB} MB
            </span>
          </>
        )}
      </div>

      {error && (
        <p className="mt-1 text-[10px] text-red-700 font-light tracking-wide">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
