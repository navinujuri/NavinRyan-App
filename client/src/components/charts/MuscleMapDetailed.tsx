import { useEffect, useMemo, useRef, useState } from 'react';
import { BodyChart, MUSCLE_MAP, ViewSide, type BodyState, type MuscleId } from 'body-muscles';
import type { MuscleDatum } from './MuscleMap';
import { fmtVolume } from '../../lib/format';

// Simple gym names for every library region, replacing its scientific labels
// (e.g. "Left Trapezius (Upper)" → "Upper Traps", "Gluteus Maximus" → "Glutes").
// Keyed by the region base (id minus the trailing -left/-right).
const FRIENDLY: Record<string, string> = {
  // Front view: the outer round cap (`shoulder-side`) is one shape for the whole
  // visible deltoid (front + side can't be separated here); the strip beside the
  // neck (`shoulder-front`) is really the front-view upper trap, not a delt.
  'shoulder-front': 'Upper Traps', 'shoulder-side': 'Side + Front Delts', 'deltoid-rear': 'Rear Delts',
  'chest-upper': 'Upper Chest', 'chest-lower': 'Lower Chest',
  'traps-upper': 'Upper Traps', 'traps-mid': 'Mid Traps', 'traps-lower': 'Lower Traps',
  'lats-upper': 'Upper Lats', 'lats-mid': 'Mid Lats', 'lats-lower': 'Lower Lats',
  biceps: 'Biceps', 'triceps-long': 'Triceps', 'triceps-lateral': 'Triceps',
  forearm: 'Forearms', 'forearm-flexors': 'Forearms', 'forearm-extensors': 'Forearms',
  'abs-upper': 'Upper Abs', 'abs-lower': 'Lower Abs', obliques: 'Obliques', 'serratus-anterior': 'Serratus',
  'hip-flexor': 'Hip Flexors', quads: 'Quads', adductors: 'Inner Thighs',
  'hamstrings-medial': 'Hamstrings', 'hamstrings-lateral': 'Hamstrings',
  'gluteus-maximus': 'Glutes', 'gluteus-medius': 'Glutes',
  'calves-gastroc-medial': 'Calves', 'calves-gastroc-lateral': 'Calves', 'calves-soleus': 'Calves',
  'tibialis-anterior': 'Shins', knee: 'Knee', 'knee-back': 'Knee', elbow: 'Elbow',
  hand: 'Hand', 'hand-back': 'Hand', foot: 'Foot', 'foot-back': 'Foot',
  neck: 'Neck', nape: 'Neck', head: 'Head', 'head-back': 'Head', face: 'Face',
  spine: 'Spine', 'lower-back-erectors': 'Lower Back', 'lower-back-ql': 'Lower Back',
};

function friendlyName(id: string): string {
  const base = id.replace(/-(left|right)$/, '');
  return FRIENDLY[base] ?? base.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Rewrite the library's built-in names (used for its native <title> tooltips and
// click payloads) to the simple names above. MUSCLE_MAP entries are shared by
// reference with the per-view arrays the chart renders, so this affects both.
for (const def of MUSCLE_MAP) (def as { name: string }).name = friendlyName(def.id);

/**
 * PROTOTYPE — detailed anatomical muscle map on the `body-muscles` library
 * (89 regions, left/right + sub-heads). Rendered behind a toggle next to the
 * classic react-body-highlighter map so we can compare with real data before
 * committing. This maps our per-muscle volume (name → 0..1 intensity) onto the
 * library's fine-grained slugs, spreading each muscle across both sides.
 */

// Our muscle groups (12 built-in + custom) → body-muscles slug ids.
const MUSCLE_TO_SLUGS: Record<string, MuscleId[]> = {
  // Shoulders
  // The figure's outer shoulder cap is a single deltoid shape, so both front and
  // side delts light it (they can't be separated); the strip by the neck is the
  // front-view upper trap (see Traps / Upper Traps below), not the front delt.
  'Side Delts': ['shoulder-side-left', 'shoulder-side-right'],
  'Front Delts': ['shoulder-side-left', 'shoulder-side-right'],
  'Rear Delts': ['deltoid-rear-left', 'deltoid-rear-right'],
  'External Rotators': ['deltoid-rear-left', 'deltoid-rear-right'], // no rotator-cuff shape → nearest
  // Chest
  'Upper Chest': ['chest-upper-left', 'chest-upper-right'],
  'Mid Chest': ['chest-lower-left', 'chest-lower-right'],
  Chest: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  // Back / traps
  Lats: ['lats-upper-left', 'lats-mid-left', 'lats-lower-left', 'lats-upper-right', 'lats-mid-right', 'lats-lower-right'],
  'Mid Back': ['traps-mid-left', 'traps-mid-right', 'lats-mid-left', 'lats-mid-right'],
  Traps: ['traps-upper-left', 'traps-mid-left', 'traps-lower-left', 'traps-upper-right', 'traps-mid-right', 'traps-lower-right', 'shoulder-front-left', 'shoulder-front-right'],
  'Upper Traps': ['traps-upper-left', 'traps-upper-right', 'shoulder-front-left', 'shoulder-front-right'], // incl. front-view trap beside the neck
  'Middle Traps': ['traps-mid-left', 'traps-mid-right'],
  'Lower Traps': ['traps-lower-left', 'traps-lower-right'],
  'Levator Scapulae': ['nape'], // no dedicated shape → nape
  'Lower Back (Erector Spinae)': ['lower-back-erectors-left', 'lower-back-erectors-right', 'spine'],
  // Arms
  Biceps: ['biceps-left', 'biceps-right'],
  Brachialis: ['biceps-left', 'biceps-right'], // no dedicated shape → biceps
  Triceps: ['triceps-long-left', 'triceps-lateral-left', 'triceps-long-right', 'triceps-lateral-right'],
  Forearms: ['forearm-left', 'forearm-right', 'forearm-flexors-left', 'forearm-extensors-left', 'forearm-flexors-right', 'forearm-extensors-right'],
  Brachioradialis: ['forearm-left', 'forearm-right', 'forearm-flexors-left', 'forearm-flexors-right'],
  // Core
  Abs: ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right'],
  Core: ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right', 'obliques-left', 'obliques-right'],
  // Legs
  Quads: ['quads-left', 'quads-right'],
  Hamstrings: ['hamstrings-medial-left', 'hamstrings-lateral-left', 'hamstrings-medial-right', 'hamstrings-lateral-right'],
  Glutes: ['gluteus-maximus-left', 'gluteus-medius-left', 'gluteus-maximus-right', 'gluteus-medius-right'],
  Calves: ['calves-gastroc-medial-left', 'calves-gastroc-lateral-left', 'calves-soleus-left', 'calves-gastroc-medial-right', 'calves-gastroc-lateral-right', 'calves-soleus-right'],
};

// Every muscle that maps to each slug — so the tap readout can sum the full
// combined volume of a shared region (e.g. Side + Front delts on the cap).
const SLUG_TO_MUSCLES: Record<string, string[]> = {};
for (const [muscle, slugs] of Object.entries(MUSCLE_TO_SLUGS)) {
  for (const s of slugs) (SLUG_TO_MUSCLES[s] ??= []).push(muscle);
}

// data intensity is 0..1; body-muscles wants 0..10. Muscles that share a region
// (e.g. Rear Delts + External Rotators) SUM so overlapping volume adds up, then
// we scale to 0..10 (min 1 for any trained region, capped at 10).
function buildBodyState(data: Record<string, MuscleDatum>): BodyState {
  const raw: Record<string, number> = {};
  for (const [muscle, d] of Object.entries(data)) {
    const slugs = MUSCLE_TO_SLUGS[muscle];
    if (!slugs || !d.intensity) continue;
    for (const s of slugs) raw[s] = (raw[s] ?? 0) + d.intensity;
  }
  const state: BodyState = {};
  for (const [s, v] of Object.entries(raw)) {
    state[s] = { intensity: Math.min(10, Math.max(1, Math.round(v * 10))), selected: false };
  }
  return state;
}

function ChartView({
  view,
  bodyState,
  onPick,
}: {
  view: ViewSide;
  bodyState: BodyState;
  onPick: (id: MuscleId) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<BodyChart | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  // Mount once; the library owns the DOM inside `hostRef`.
  useEffect(() => {
    if (!hostRef.current) return;
    const chart = new BodyChart(hostRef.current, {
      view,
      bodyState,
      onMuscleClick: (id) => onPickRef.current(id),
    });
    chartRef.current = chart;
    return () => { chart.destroy(); chartRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { chartRef.current?.update({ bodyState }); }, [bodyState]);
  useEffect(() => { chartRef.current?.update({ view }); }, [view]);

  return <div ref={hostRef} className="w-full max-w-[210px]" />;
}

export function MuscleMapDetailed({ data }: { data: Record<string, MuscleDatum> }) {
  const bodyState = useMemo(() => buildBodyState(data), [data]);
  const [selected, setSelected] = useState<{ muscle: string; label: string } | null>(null);

  const onPick = (id: MuscleId) => {
    const muscles = SLUG_TO_MUSCLES[id] ?? [];
    const total = muscles.reduce((sum, m) => sum + (data[m]?.value ?? 0), 0);
    const label = !muscles.length ? 'Not tracked' : total > 0 ? `${fmtVolume(total)} volume` : 'No volume yet';
    setSelected({ muscle: friendlyName(id), label });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {[ViewSide.FRONT, ViewSide.BACK].map((view) => (
          <div key={view} className="flex flex-col items-center">
            <ChartView view={view} bodyState={bodyState} onPick={onPick} />
            <span className="mt-1 text-xs font-medium text-fg-faint">{view === ViewSide.FRONT ? 'Front' : 'Back'}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col items-center gap-2">
        <div className="min-h-[24px] text-sm">
          {selected ? (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft">
              {selected.muscle} · {selected.label}
            </span>
          ) : (
            <span className="text-xs text-fg-faint">Tap a muscle to see its volume · {Object.keys(bodyState).length} regions lit</span>
          )}
        </div>
      </div>
    </div>
  );
}
