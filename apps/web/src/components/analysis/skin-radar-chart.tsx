"use client";

import type { ZoneAnnotation, ZoneStatus } from "@/lib/sae/types";

// Map status to a score: good=90, attention=55, concern=25
function statusToScore(status: ZoneStatus): number {
  return status === "good" ? 90 : status === "attention" ? 55 : 25;
}

const LABELS: Record<string, string> = {
  forehead: "Testa",
  left_cheek: "Boch. Esq.",
  right_cheek: "Boch. Dir.",
  nose: "Nariz",
  chin: "Queixo",
  under_eyes: "Olheiras",
  jawline: "Mandibula",
};

const STATUS_COLORS: Record<ZoneStatus, string> = {
  good: "#4A7C59",
  attention: "#C8A951",
  concern: "#A65D57",
};

type RadarPoint = {
  label: string;
  score: number;
  status: ZoneStatus;
  zone: string;
};

export function SkinRadarChart({
  annotations,
}: {
  annotations: ZoneAnnotation[];
}) {
  if (annotations.length === 0) return null;

  const points: RadarPoint[] = annotations.map((a) => ({
    label: LABELS[a.zone] ?? a.zone,
    score: statusToScore(a.status),
    status: a.status,
    zone: a.zone,
  }));

  const n = points.length;
  const cx = 150;
  const cy = 150;
  const maxR = 110;

  // Calculate polygon points
  function getPoint(index: number, value: number): [number, number] {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / 100) * maxR;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // Background grid rings
  const rings = [25, 50, 75, 100];

  // Data polygon
  const dataPath = points
    .map((p, i) => {
      const [x, y] = getPoint(i, p.score);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ") + "Z";

  // Calculate overall skin health score
  const overallScore = Math.round(points.reduce((sum, p) => sum + p.score, 0) / points.length);
  const overallLabel = overallScore >= 75 ? "Boa saude" : overallScore >= 50 ? "Atencao" : "Cuidado";
  const overallColor = overallScore >= 75 ? "#4A7C59" : overallScore >= 50 ? "#C8A951" : "#A65D57";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-pierre uppercase tracking-wider font-light">
            Radar da Pele
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-serif text-carbone">{overallScore}</span>
          <span className="text-xs text-pierre font-light ml-1">/100</span>
          <p className="text-[10px] uppercase tracking-wider font-light" style={{ color: overallColor }}>
            {overallLabel}
          </p>
        </div>
      </div>

      <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
        {/* Grid rings */}
        {rings.map((ring) => {
          const ringPath = Array.from({ length: n }, (_, i) => {
            const [x, y] = getPoint(i, ring);
            return `${i === 0 ? "M" : "L"}${x},${y}`;
          }).join(" ") + "Z";
          return (
            <path
              key={ring}
              d={ringPath}
              fill="none"
              stroke="#C8BAA9"
              strokeWidth="0.5"
              opacity="0.3"
            />
          );
        })}

        {/* Axis lines */}
        {points.map((_, i) => {
          const [x, y] = getPoint(i, 100);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="#C8BAA9"
              strokeWidth="0.5"
              opacity="0.3"
            />
          );
        })}

        {/* Data polygon fill */}
        <path
          d={dataPath}
          fill="#1C1917"
          fillOpacity="0.08"
          stroke="#1C1917"
          strokeWidth="1.5"
        />

        {/* Data points */}
        {points.map((p, i) => {
          const [x, y] = getPoint(i, p.score);
          return (
            <circle
              key={`point-${i}`}
              cx={x}
              cy={y}
              r="4"
              fill={STATUS_COLORS[p.status]}
              stroke="#F7F3EE"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Labels */}
        {points.map((p, i) => {
          const [x, y] = getPoint(i, 115);
          const textAnchor = x < cx - 10 ? "end" : x > cx + 10 ? "start" : "middle";
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="text-[9px] font-light"
              fill="#7C7269"
            >
              {p.label}
            </text>
          );
        })}
      </svg>

      {/* Zone scores list */}
      <div className="mt-4 space-y-1.5">
        {points.map((p) => (
          <div key={p.zone} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS[p.status],
                }}
              />
              <span className="text-xs text-pierre font-light">{p.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 bg-sable/20">
                <div
                  className="h-full"
                  style={{ width: `${p.score}%`, backgroundColor: STATUS_COLORS[p.status] }}
                />
              </div>
              <span className="text-xs text-carbone font-light w-6 text-right">{p.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
