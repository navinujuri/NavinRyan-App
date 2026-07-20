import { useState } from 'react';

/**
 * Custom SVG muscle map (front + back) where each of the 12 tracked muscle
 * groups is its OWN region — including side delts, rear delts, upper chest and
 * lats, which off-the-shelf libraries collapse. Each region's fill intensity is
 * driven by a 0–1 value (e.g. normalized weekly training volume), and hovering
 * a region shows a tooltip naming the muscle + its stat.
 *
 * Stylized/diagrammatic (not medical-grade) so the regions read clearly and
 * match the app's dark theme.
 */

export interface MuscleDatum {
  intensity: number; // 0..1
  label: string; // tooltip detail, e.g. "3.3k volume"
}

type Shape =
  | { t: 'e'; cx: number; cy: number; rx: number; ry: number; rot?: number }
  | { t: 'p'; d: string };

interface Region {
  muscle: string;
  shapes: Shape[];
}

// Mirror an x coordinate around the figure centre (cx = 100).
const mx = (x: number) => 200 - x;
const e = (cx: number, cy: number, rx: number, ry: number, rot?: number): Shape => ({ t: 'e', cx, cy, rx, ry, rot });
const pair = (cx: number, cy: number, rx: number, ry: number, rot = 0): Shape[] => [
  e(cx, cy, rx, ry, rot),
  e(mx(cx), cy, rx, ry, -rot),
];

// Cohesive body silhouette (drawn behind the muscle regions so they read as
// highlighted muscles ON a body rather than floating blobs). Same outline for
// both views; head is a separate circle.
const SILHOUETTE =
  'M90 62 L64 92 Q40 100 40 118 L36 165 L33 250 L47 252 L52 175 Q64 150 70 165 ' +
  'L74 258 L70 305 L64 380 L70 470 L76 508 L92 508 L96 330 L100 322 L104 330 ' +
  'L108 508 L124 508 L130 470 L136 380 L130 305 L126 258 L130 165 Q136 150 148 175 ' +
  'L153 252 L167 250 L164 165 L160 118 Q160 100 136 92 L110 62 Z';
const BASE: Shape[] = [
  { t: 'p', d: SILHOUETTE },
  e(100, 40, 20, 22), // head
];

// ── Tracked muscle regions ──────────────────────────────────────────────────
const FRONT: Region[] = [
  { muscle: 'Side Delts', shapes: pair(60, 108, 20, 22) },
  {
    muscle: 'Upper Chest',
    shapes: [
      { t: 'p', d: 'M100 92 L74 98 Q64 118 82 134 L100 124 Z' },
      { t: 'p', d: 'M100 92 L126 98 Q136 118 118 134 L100 124 Z' },
    ],
  },
  { muscle: 'Biceps', shapes: pair(49, 162, 13, 30) },
  { muscle: 'Abs', shapes: [{ t: 'p', d: 'M84 140 h32 v96 q-16 12 -32 0 Z' }] },
  { muscle: 'Quads', shapes: pair(80, 322, 21, 60) },
];

const BACK: Region[] = [
  { muscle: 'Traps', shapes: [{ t: 'p', d: 'M100 66 L130 92 L100 150 L70 92 Z' }] },
  { muscle: 'Rear Delts', shapes: pair(60, 110, 19, 21) },
  { muscle: 'Triceps', shapes: pair(49, 162, 13, 30) },
  {
    muscle: 'Lats',
    shapes: [
      { t: 'p', d: 'M74 122 L96 128 L98 194 L82 202 Q64 168 74 122 Z' },
      { t: 'p', d: 'M126 122 L104 128 L102 194 L118 202 Q136 168 126 122 Z' },
    ],
  },
  { muscle: 'Glutes', shapes: pair(84, 268, 21, 24) },
  { muscle: 'Hamstrings', shapes: pair(80, 352, 21, 54) },
  { muscle: 'Calves', shapes: pair(82, 452, 15, 42) },
];

function heat(t: number): string {
  if (!Number.isFinite(t) || t <= 0) return '#242730'; // no data
  const lo = [0x33, 0x37, 0x42];
  const hi = [0xf4, 0x3f, 0x5e]; // brand accent
  const k = Math.min(1, t);
  const c = lo.map((b, i) => Math.round(b + (hi[i] - b) * k));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function ShapeEl({ s, fill, ...rest }: { s: Shape; fill: string } & React.SVGProps<SVGElement>) {
  const common = { fill, stroke: 'rgba(255,255,255,0.10)', strokeWidth: 1, ...(rest as object) };
  if (s.t === 'e') {
    return <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} transform={s.rot ? `rotate(${s.rot} ${s.cx} ${s.cy})` : undefined} {...common} />;
  }
  return <path d={s.d} {...common} />;
}

function Figure({
  title,
  regions,
  data,
  onHover,
  onLeave,
}: {
  title: string;
  regions: Region[];
  data: Record<string, MuscleDatum>;
  onHover: (muscle: string, d: MuscleDatum | undefined, ev: React.MouseEvent) => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 520" className="h-[380px] w-auto max-w-full">
        {BASE.map((s, i) => (
          <ShapeEl key={`b${i}`} s={s} fill="#1b1d23" />
        ))}
        {regions.map((r) =>
          r.shapes.map((s, i) => (
            <ShapeEl
              key={`${r.muscle}${i}`}
              s={s}
              fill={heat(data[r.muscle]?.intensity ?? 0)}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(ev: React.MouseEvent) => onHover(r.muscle, data[r.muscle], ev)}
              onMouseMove={(ev: React.MouseEvent) => onHover(r.muscle, data[r.muscle], ev)}
              onMouseLeave={onLeave}
            />
          )),
        )}
      </svg>
      <span className="mt-1 text-xs font-medium text-fg-faint">{title}</span>
    </div>
  );
}

export function MuscleMap({ data }: { data: Record<string, MuscleDatum> }) {
  const [tip, setTip] = useState<{ muscle: string; label: string; x: number; y: number } | null>(null);

  const onHover = (muscle: string, d: MuscleDatum | undefined, ev: React.MouseEvent) => {
    const host = (ev.currentTarget as SVGElement).closest('[data-musclemap]') as HTMLElement | null;
    const rect = host?.getBoundingClientRect();
    setTip({
      muscle,
      label: d?.label ?? 'No data',
      x: ev.clientX - (rect?.left ?? 0),
      y: ev.clientY - (rect?.top ?? 0),
    });
  };

  return (
    <div className="relative" data-musclemap>
      <div className="grid grid-cols-2 gap-4">
        <Figure title="Front" regions={FRONT} data={data} onHover={onHover} onLeave={() => setTip(null)} />
        <Figure title="Back" regions={BACK} data={data} onHover={onHover} onLeave={() => setTip(null)} />
      </div>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-hair2 bg-ink-800/95 px-2.5 py-1.5 shadow-card backdrop-blur"
          style={{ left: tip.x, top: tip.y - 8 }}
        >
          <div className="text-xs font-semibold text-fg">{tip.muscle}</div>
          <div className="text-[11px] text-fg-muted">{tip.label}</div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-fg-faint">
        <span>Less volume</span>
        <span className="h-2 w-24 rounded-full" style={{ background: 'linear-gradient(90deg, #333742, #f43f5e)' }} />
        <span>More</span>
      </div>
    </div>
  );
}
