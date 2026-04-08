"use client";

import { useState } from "react";
import type { ZoneAnnotation, FaceZone, ZoneStatus } from "@/lib/sae/types";

// Fixed percentage positions per facial zone.
// Note: left/right are from the viewer's perspective, so left_cheek appears on the right
// side of the image (since the camera captures a mirrored view of the subject).
const ZONE_POSITIONS: Record<FaceZone, { top: string; left: string }> = {
  forehead:    { top: "15%", left: "50%" },
  under_eyes:  { top: "38%", left: "50%" },
  nose:        { top: "45%", left: "50%" },
  // Mirror-corrected: subject's left cheek appears on viewer's right
  left_cheek:  { top: "50%", left: "75%" },
  right_cheek: { top: "50%", left: "25%" },
  chin:        { top: "78%", left: "50%" },
  jawline:     { top: "70%", left: "30%" },
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
      <div className="relative w-full" style={{ aspectRatio: "3/4" }}>
        {/* Base photo */}
        <img
          src={photoBase64}
          alt="Foto facial para analise"
          className="w-full h-full object-cover"
          style={{ display: "block" }}
        />

        {/* Subtle dark overlay to improve marker visibility */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(28, 25, 23, 0.18)" }}
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
              onClick={() => handleMarkerClick(annotation.zone)}
              aria-label={`Zona ${annotation.zone}: ${annotation.title}`}
              style={{
                position: "absolute",
                top: pos.top,
                left: pos.left,
                transform: "translate(-50%, -50%)",
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                backgroundColor: color,
                border: isActive ? "2px solid #F7F3EE" : "2px solid rgba(247,243,238,0.6)",
                boxShadow: isActive
                  ? `0 0 0 3px ${color}55, 0 2px 8px rgba(0,0,0,0.35)`
                  : "0 1px 4px rgba(0,0,0,0.30)",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                zIndex: isActive ? 20 : 10,
                outline: "none",
              }}
            />
          );
        })}

        {/* Dismiss overlay when clicking outside markers */}
        {activeZone && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 5 }}
            onClick={() => setActiveZone(null)}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Tooltip panel — rendered below the photo, not absolutely positioned */}
      <div
        style={{
          minHeight: "90px",
          transition: "opacity 0.2s ease",
          opacity: activeAnnotation ? 1 : 0,
          pointerEvents: activeAnnotation ? "auto" : "none",
        }}
      >
        {activeAnnotation && (
          <div
            className="p-4 border border-sable/30"
            style={{ backgroundColor: "#1C1917" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: STATUS_COLORS[activeAnnotation.status],
                      flexShrink: 0,
                    }}
                  />
                  <span
                    className="text-[10px] uppercase tracking-wider font-light"
                    style={{ color: STATUS_COLORS[activeAnnotation.status] }}
                  >
                    {STATUS_LABELS[activeAnnotation.status]}
                  </span>
                </div>
                <p className="text-sm font-light text-blanc-casse leading-snug">
                  {activeAnnotation.title}
                </p>
                <p className="text-xs font-light mt-1 leading-relaxed" style={{ color: "#C8BAA9" }}>
                  {activeAnnotation.observation}
                </p>
                {activeAnnotation.related_conditions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
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
                style={{ lineHeight: 1, paddingTop: "2px" }}
              >
                <span className="text-xs font-light">×</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-1">
        {(["good", "attention", "concern"] as ZoneStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: STATUS_COLORS[status],
                flexShrink: 0,
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
