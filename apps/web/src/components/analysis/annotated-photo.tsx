"use client";

import { useState } from "react";
import type { ZoneAnnotation, FaceZone, ZoneStatus } from "@/lib/sae/types";

// Positions calibrated for a centered selfie (face occupies ~50-60% of frame center).
// Percentages are relative to the full image. The face center is roughly at 50% horizontal
// and 35% vertical (people tend to appear upper-center in selfies).
const ZONE_POSITIONS: Record<FaceZone, { top: string; left: string }> = {
  forehead:    { top: "22%", left: "50%" },
  under_eyes:  { top: "36%", left: "50%" },
  nose:        { top: "42%", left: "50%" },
  // Mirror-corrected: subject's left cheek appears on viewer's right
  left_cheek:  { top: "42%", left: "62%" },
  right_cheek: { top: "42%", left: "38%" },
  chin:        { top: "56%", left: "50%" },
  jawline:     { top: "50%", left: "36%" },
};

const ZONE_LABELS: Record<FaceZone, string> = {
  forehead: "Testa",
  under_eyes: "Area periorbital",
  nose: "Nariz",
  left_cheek: "Bochecha esquerda",
  right_cheek: "Bochecha direita",
  chin: "Queixo",
  jawline: "Mandibula",
};

const STATUS_COLORS: Record<ZoneStatus, string> = {
  good:      "#4A7C59",
  attention: "#C8A951",
  concern:   "#A65D57",
};

const STATUS_LABELS: Record<ZoneStatus, string> = {
  good:      "Saudavel",
  attention: "Atencao",
  concern:   "Cuidado",
};

export function AnnotatedPhoto({
  photoBase64,
  annotations,
}: {
  photoBase64: string;
  annotations: ZoneAnnotation[];
}) {
  const [activeZone, setActiveZone] = useState<FaceZone | null>(null);

  function handleMarkerClick(zone: FaceZone) {
    setActiveZone((prev) => (prev === zone ? null : zone));
  }

  const activeAnnotation = annotations.find((a) => a.zone === activeZone) ?? null;

  return (
    <div className="w-full">
      {/* Photo container */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "3/4" }}>
        {/* Base photo */}
        <img
          src={photoBase64}
          alt="Foto facial para analise"
          className="w-full h-full object-cover"
          style={{ display: "block" }}
        />

        {/* Subtle dark overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(28, 25, 23, 0.15)" }}
        />

        {/* Zone markers */}
        {annotations.map((annotation) => {
          const pos = ZONE_POSITIONS[annotation.zone];
          if (!pos) return null;
          const color = STATUS_COLORS[annotation.status];
          const isActive = activeZone === annotation.zone;

          return (
            <button
              key={annotation.zone}
              onClick={(e) => { e.stopPropagation(); handleMarkerClick(annotation.zone); }}
              aria-label={`${ZONE_LABELS[annotation.zone]}: ${annotation.title}`}
              className="absolute"
              style={{
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, -50%)",
                zIndex: isActive ? 20 : 10,
                outline: "none",
              }}
            >
              {/* Pulse ring for active marker */}
              {isActive && (
                <span
                  className="absolute inset-0 animate-ping"
                  style={{
                    borderRadius: "50%",
                    backgroundColor: `${color}40`,
                    width: "28px",
                    height: "28px",
                    margin: "-3px",
                  }}
                />
              )}
              <span
                style={{
                  display: "block",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: `2px solid ${isActive ? "#F7F3EE" : "rgba(247,243,238,0.7)"}`,
                  boxShadow: isActive
                    ? `0 0 0 3px ${color}44, 0 2px 10px rgba(0,0,0,0.4)`
                    : "0 1px 6px rgba(0,0,0,0.35)",
                  transition: "all 0.15s ease",
                }}
              />
            </button>
          );
        })}

        {/* Dismiss overlay */}
        {activeZone && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 5 }}
            onClick={() => setActiveZone(null)}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Detail panel below photo */}
      {activeAnnotation && (
        <div
          className="p-5 border border-sable/30 mt-px"
          style={{ backgroundColor: "#1C1917" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Zone name + status */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  style={{
                    display: "inline-block",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: STATUS_COLORS[activeAnnotation.status],
                  }}
                />
                <span className="text-[10px] uppercase tracking-wider font-light" style={{ color: "#7C7269" }}>
                  {ZONE_LABELS[activeAnnotation.zone]}
                </span>
                <span className="text-[10px]" style={{ color: "#7C7269" }}>·</span>
                <span
                  className="text-[10px] uppercase tracking-wider font-light"
                  style={{ color: STATUS_COLORS[activeAnnotation.status] }}
                >
                  {STATUS_LABELS[activeAnnotation.status]}
                </span>
              </div>
              {/* Title */}
              <p className="text-sm text-blanc-casse leading-snug">
                {activeAnnotation.title}
              </p>
              {/* Detailed observation */}
              <p className="text-xs font-light mt-2 leading-relaxed" style={{ color: "#C8BAA9" }}>
                {activeAnnotation.observation}
              </p>
              {/* Related conditions */}
              {activeAnnotation.related_conditions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {activeAnnotation.related_conditions.map((cond) => (
                    <span
                      key={cond}
                      className="text-[10px] uppercase tracking-wider font-light px-2 py-0.5 border border-sable/20"
                      style={{ color: "#7C7269" }}
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setActiveZone(null)}
              className="flex-shrink-0 text-pierre hover:text-blanc-casse transition-colors"
              aria-label="Fechar"
            >
              <span className="text-sm font-light">×</span>
            </button>
          </div>
        </div>
      )}

      {/* Instruction text when no marker selected */}
      {!activeAnnotation && (
        <p className="text-xs text-pierre font-light mt-3 text-center">
          Toque nos marcadores para ver detalhes de cada zona
        </p>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
        {(["good", "attention", "concern"] as ZoneStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: STATUS_COLORS[status],
              }}
            />
            <span className="text-[10px] text-pierre uppercase tracking-wider font-light">
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
