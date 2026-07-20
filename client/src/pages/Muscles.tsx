import { useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import { muscleSummaries, muscleTrend, muscleVolumeByWeek } from '../lib/calculations';
import { fmtVolume } from '../lib/format';
import { CHART } from '../theme/chart';
import { Card, CardTitle, Delta, Empty, PageHeader, Segmented } from '../components/ui/primitives';
import { BarRank } from '../components/charts/BarRank';
import { TrendChart } from '../components/charts/TrendChart';
import { Sparkline } from '../components/charts/Sparkline';
import { MuscleMap, type MuscleDatum } from '../components/charts/MuscleMap';
import { MuscleMapDetailed } from '../components/charts/MuscleMapDetailed';
import { IconMuscle } from '../components/ui/icons';
import type { MuscleGroup } from '../types';

type Range = 'current' | 'monthly' | 'total';

export function Muscles() {
  const { config, workouts } = useData();
  const [range, setRange] = useState<Range>('monthly');
  const [muscle, setMuscle] = useState<MuscleGroup>('Side Delts');
  const [mapStyle, setMapStyle] = useState<'classic' | 'detailed'>('classic');

  const summaries = useMemo(
    () => (config ? muscleSummaries(workouts, config) : []),
    [config, workouts],
  );
  const weekly = useMemo(
    () => (config ? muscleVolumeByWeek(workouts, config) : []),
    [config, workouts],
  );

  if (!config) return null;

  const valueFor = (s: (typeof summaries)[number]) =>
    range === 'current' ? s.current : range === 'monthly' ? s.monthly : s.total;

  const rankData = summaries.map((s) => ({ label: s.muscle, value: valueFor(s) }));

  const mapMax = Math.max(1, ...summaries.map(valueFor));
  const mapData: Record<string, MuscleDatum> = {};
  for (const s of summaries) {
    const v = valueFor(s);
    mapData[s.muscle] = { intensity: v / mapMax, label: v > 0 ? `${fmtVolume(v)} volume` : 'No volume yet', value: v };
  }

  const trendData = muscleTrend(workouts, config, muscle);
  const priorities = new Set(config.program.priorities);

  const hasData = summaries.some((s) => s.total > 0);

  return (
    <>
      <PageHeader
        title="Muscle Group Dashboard"
        subtitle="Training volume attributed to each muscle (primary lifts count fully; secondary movers at 50%)."
        actions={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: 'current', label: 'This Week' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'total', label: 'All-Time' },
            ]}
          />
        }
      />

      {!hasData ? (
        <Empty icon={<IconMuscle width={28} height={28} />} title="No volume logged yet" hint="Log workouts to see muscle-group volume build up." />
      ) : (
        <>
          <Card className="mb-4">
            <CardTitle
              title="Muscle Map"
              subtitle={`Color intensity = ${range === 'current' ? "this week's" : range === 'monthly' ? 'monthly' : 'all-time'} volume · tap a muscle`}
              icon={<IconMuscle width={16} height={16} />}
              right={
                <Segmented
                  value={mapStyle}
                  onChange={setMapStyle}
                  options={[
                    { value: 'classic', label: 'Classic' },
                    { value: 'detailed', label: 'Detailed (beta)' },
                  ]}
                />
              }
            />
            {mapStyle === 'detailed' ? <MuscleMapDetailed data={mapData} /> : <MuscleMap data={mapData} />}
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle
                title="Volume by Muscle"
                subtitle={range === 'current' ? 'Current week' : range === 'monthly' ? 'Trailing 4 weeks' : 'Program to date'}
                icon={<IconMuscle width={16} height={16} />}
              />
              <BarRank data={rankData} height={380} />
            </Card>

            <Card>
              <CardTitle
                title="Muscle Volume Trend"
                subtitle="Weekly attributed volume"
                icon={<IconMuscle width={16} height={16} />}
                right={
                  <select className="field !w-auto" value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleGroup)}>
                    {config.muscleGroups.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                }
              />
              <TrendChart data={trendData} color={CHART.volume} height={300} dp={0} />
            </Card>
          </div>

          {/* Per-muscle cards */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {summaries.map((s) => {
              const series = weekly.map((w) => w.volumes[s.muscle] || 0);
              return (
                <Card key={s.muscle} className="!p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {priorities.has(s.muscle) && <span className="h-2 w-2 rounded-full bg-accent" title="Priority muscle" />}
                      <span className="text-sm font-semibold text-fg">{s.muscle}</span>
                    </div>
                    <Delta value={s.deltaPct} suffix="%" />
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-fg-faint">This week</div>
                      <div className="text-xl font-bold tabular-nums text-fg">{fmtVolume(s.current)}</div>
                    </div>
                    <Sparkline values={series} color={s.deltaPct < 0 ? CHART.bad : CHART.good} width={90} height={34} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-hair pt-2 text-xs text-fg-faint">
                    <span>Prev <span className="font-semibold text-fg-muted">{fmtVolume(s.previous)}</span></span>
                    <span>Monthly <span className="font-semibold text-fg-muted">{fmtVolume(s.monthly)}</span></span>
                    <span>Total <span className="font-semibold text-fg-muted">{fmtVolume(s.total)}</span></span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Muscle map reference */}
          <Card className="mt-6">
            <CardTitle title="Exercise → Muscle Map" subtitle="How each lift feeds your muscle volume" icon={<IconMuscle width={16} height={16} />} />
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.muscleGroups.map((m) => {
                const primary = config.exercises.filter((e) => e.primaryMuscle === m);
                const secondary = config.exercises.filter((e) => e.secondaryMuscles.includes(m));
                return (
                  <div key={m} className="rounded-lg border border-hair bg-ink-900/40 p-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      {priorities.has(m) && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                      <span className="text-sm font-semibold text-fg">{m}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {primary.map((e) => (
                        <span key={e.id} className="rounded bg-ink-750 px-1.5 py-0.5 text-[11px] text-fg-muted">{e.name}</span>
                      ))}
                      {secondary.map((e) => (
                        <span key={e.id} className="rounded px-1.5 py-0.5 text-[11px] text-fg-faint" title="Secondary">{e.name}*</span>
                      ))}
                      {primary.length === 0 && secondary.length === 0 && <span className="text-xs text-fg-faint">—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-fg-faint">* secondary mover — contributes 50% of its volume to this muscle.</p>
          </Card>
        </>
      )}
    </>
  );
}
