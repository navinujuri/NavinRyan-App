import { useMemo, useState } from 'react';
import Model, { type IExerciseData, type IMuscleStats, type Muscle } from 'react-body-highlighter';

/**
 * Anatomical muscle-map heatmap (front + back) built on react-body-highlighter
 * (MIT) — MuscleWiki-style artwork. Each muscle's fill intensity is driven by a
 * 0–1 value (normalized training volume); tapping/clicking a muscle names it and
 * shows its volume (tap works on touch devices, where hover doesn't).
 *
 * The library uses generic anatomical regions, so our 12 groups map on as:
 *   Side Delts→front-deltoids · Rear Delts→back-deltoids · Upper Chest→chest ·
 *   Lats→upper-back  (the rest map 1:1). This matches the granularity of
 *   references like MuscleWiki, which also don't split those finer.
 */
export interface MuscleDatum {
  intensity: number; // 0..1
  label: string; // e.g. "3.3k volume"
}

const MUSCLE_TO_SLUG: Record<string, Muscle> = {
  'Side Delts': 'front-deltoids',
  'Rear Delts': 'back-deltoids',
  'Upper Chest': 'chest',
  Lats: 'upper-back',
  Traps: 'trapezius',
  Biceps: 'biceps',
  Triceps: 'triceps',
  Abs: 'abs',
  Quads: 'quadriceps',
  Hamstrings: 'hamstring',
  Glutes: 'gluteal',
  Calves: 'calves',
};
const SLUG_TO_MUSCLE: Record<string, string> = Object.fromEntries(
  Object.entries(MUSCLE_TO_SLUG).map(([m, s]) => [s, m]),
);

// Intensity ramp: index = frequency − 1 (muted → brand accent).
const RAMP = ['#4a2f34', '#742f3a', '#a03340', '#cc3a49', '#ef4444', '#ff6168'];
const BODY_COLOR = '#242730';
const bucket = (intensity: number) => Math.min(RAMP.length, Math.max(1, Math.ceil(intensity * RAMP.length)));

export function MuscleMap({ data }: { data: Record<string, MuscleDatum> }) {
  const [selected, setSelected] = useState<{ muscle: string; label: string } | null>(null);

  // One data entry per trained muscle → frequency bucket drives its color.
  const exerciseData = useMemo<IExerciseData[]>(
    () =>
      Object.entries(data)
        .filter(([muscle, d]) => MUSCLE_TO_SLUG[muscle] && d.intensity > 0)
        .map(([muscle, d]) => ({ name: muscle, muscles: [MUSCLE_TO_SLUG[muscle]], frequency: bucket(d.intensity) })),
    [data],
  );

  const onClick = (stats: IMuscleStats) => {
    const muscle = SLUG_TO_MUSCLE[stats.muscle];
    if (muscle) setSelected({ muscle, label: data[muscle]?.label ?? 'No volume yet' });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {(['anterior', 'posterior'] as const).map((view) => (
          <div key={view} className="flex flex-col items-center">
            <div className="w-full max-w-[210px]">
              <Model
                type={view}
                data={exerciseData}
                highlightedColors={RAMP}
                bodyColor={BODY_COLOR}
                onClick={onClick}
                style={{ width: '100%' }}
              />
            </div>
            <span className="mt-1 text-xs font-medium text-fg-faint">{view === 'anterior' ? 'Front' : 'Back'}</span>
          </div>
        ))}
      </div>

      {/* Tapped-muscle readout + legend */}
      <div className="mt-3 flex flex-col items-center gap-2">
        <div className="min-h-[24px] text-sm">
          {selected ? (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft">
              {selected.muscle} · {selected.label}
            </span>
          ) : (
            <span className="text-xs text-fg-faint">Tap a muscle to see its volume</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-fg-faint">
          <span>Less volume</span>
          <span className="h-2 w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${RAMP[0]}, ${RAMP[RAMP.length - 1]})` }} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
