import { useEffect, useMemo, useRef, useState } from 'react';
import { BodyChart, MUSCLE_MAP, ViewSide, type BodyState, type MuscleId } from 'body-muscles';
import type { MuscleDatum } from './MuscleMap';

// Simple gym names for every library region, replacing its scientific labels
// (e.g. "Left Trapezius (Upper)" → "Upper Traps", "Gluteus Maximus" → "Glutes").
// Keyed by the region base (id minus the trailing -left/-right).
const FRIENDLY: Record<string, string> = {
  'shoulder-front': 'Front Delts', 'shoulder-side': 'Side Delts', 'deltoid-rear': 'Rear Delts',
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
  'Side Delts': ['shoulder-side-left', 'shoulder-side-right'],
  'Front Delts': ['shoulder-front-left', 'shoulder-front-right'],
  'Rear Delts': ['deltoid-rear-left', 'deltoid-rear-right'],
  'External Rotators': ['deltoid-rear-left', 'deltoid-rear-right'], // no rotator-cuff shape → nearest
  // Chest
  'Upper Chest': ['chest-upper-left', 'chest-upper-right'],
  'Mid Chest': ['chest-lower-left', 'chest-lower-right'],
  Chest: ['chest-upper-left', 'chest-upper-right', 'chest-lower-left', 'chest-lower-right'],
  // Back / traps
  Lats: ['lats-upper-left', 'lats-mid-left', 'lats-lower-left', 'lats-upper-right', 'lats-mid-right', 'lats-lower-right'],
  'Mid Back': ['traps-mid-left', 'traps-mid-right', 'lats-mid-left', 'lats-mid-right'],
  Traps: ['traps-upper-left', 'traps-mid-left', 'traps-lower-left', 'traps-upper-right', 'traps-mid-right', 'traps-lower-right'],
  'Upper Traps': ['traps-upper-left', 'traps-upper-right'],
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

// First muscle that claims each slug — used for the tap readout.
const SLUG_TO_MUSCLE: Record<string, string> = {};
for (const [muscle, slugs] of Object.entries(MUSCLE_TO_SLUGS)) {
  for (const s of slugs) if (!(s in SLUG_TO_MUSCLE)) SLUG_TO_MUSCLE[s] = muscle;
}

// data intensity is 0..1; body-muscles wants 0..10. Keep any trained muscle ≥1.
function buildBodyState(data: Record<string, MuscleDatum>): BodyState {
  const state: BodyState = {};
  for (const [muscle, d] of Object.entries(data)) {
    const slugs = MUSCLE_TO_SLUGS[muscle];
    if (!slugs || !d.intensity) continue;
    const intensity = Math.max(1, Math.round(d.intensity * 10));
    for (const s of slugs) {
      const prev = state[s]?.intensity ?? 0;
      state[s] = { intensity: Math.max(prev, intensity), selected: false };
    }
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
    const tracked = SLUG_TO_MUSCLE[id];
    const label = tracked ? (data[tracked]?.label ?? 'No volume yet') : 'Not tracked';
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
