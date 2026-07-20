import { useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import { allProgressions, dedupeByMovement, type ExerciseProgression } from '../lib/calculations';
import { fmt, fmtDate, fmtDateFull, fmtVolume } from '../lib/format';
import { CHART } from '../theme/chart';
import { Card, CardTitle, Delta, Empty, PageHeader, Pill, Segmented } from '../components/ui/primitives';
import { Sparkline } from '../components/charts/Sparkline';
import { TrendChart } from '../components/charts/TrendChart';
import { IconTrend } from '../components/ui/icons';
import type { DayKey } from '../types';

type Metric = 'volume' | 'weight';
type DayFilter = DayKey | 'all';

function DirBadge({ p }: { p: ExerciseProgression }) {
  if (p.direction === 'new') return <Pill tone="accent">New PR baseline</Pill>;
  if (p.direction === 'none') return <Pill>No data</Pill>;
  const tone = p.direction === 'up' ? 'good' : p.direction === 'down' ? 'bad' : 'default';
  return (
    <Pill tone={tone}>
      {p.improvementPct > 0 ? '+' : ''}
      {fmt(p.improvementPct, 1)}%
    </Pill>
  );
}

export function Progression() {
  const { config, workouts } = useData();
  const [selectedId, setSelectedId] = useState<string>('');
  const [metric, setMetric] = useState<Metric>('volume');
  const [day, setDay] = useState<DayFilter>('all');

  const progressions = useMemo(
    () => (config ? allProgressions(workouts, config.exercises) : []),
    [config, workouts],
  );

  if (!config) return null;

  const dayOptions = [
    { key: 'all' as DayFilter, label: 'All Days', focus: 'Every logged lift' },
    ...config.schedule
      .filter((s) => s.type === 'train' && s.dayKey)
      .map((s) => ({ key: s.dayKey as DayFilter, label: `Day ${s.day}`, focus: s.title })),
  ];
  const activeDay = dayOptions.find((d) => d.key === day)!;

  // Scope to the selected training day, then collapse repeated movements to a
  // single row (each carries the unified cross-day history).
  const dayProgs = dedupeByMovement(
    day === 'all' ? progressions : progressions.filter((p) => p.exercise.day === day),
  );

  const selected = dayProgs.find((p) => p.exercise.id === selectedId) ?? dayProgs[0] ?? null;

  const chartData =
    selected?.sessions.map((s) => ({ label: s.date, value: metric === 'volume' ? s.volume : s.weight })) ?? [];

  // Full session log for the selected exercise (newest first, with Δ vs prior).
  const sessionLog = selected
    ? selected.sessions
        .map((s, i, arr) => ({ ...s, prevVolume: i > 0 ? arr[i - 1].volume : null }))
        .reverse()
    : [];

  const improved = dayProgs.filter((p) => p.direction === 'up').length;
  const declined = dayProgs.filter((p) => p.direction === 'down').length;

  return (
    <>
      <PageHeader
        title="Progression History"
        subtitle="Pick a training day to see every lift in that routine — full session logs and strength-trend graphs, exercise by exercise."
        actions={
          <div className="flex gap-2">
            <Pill tone="good">{improved} improving</Pill>
            <Pill tone="bad">{declined} down</Pill>
          </div>
        }
      />

      {progressions.length === 0 ? (
        <Empty icon={<IconTrend width={28} height={28} />} title="No workout history yet" hint="Log a few sessions in the Workout Tracker to unlock progression tracking." />
      ) : (
        <>
          {/* Training-day filter */}
          <div className="mb-5 flex flex-wrap gap-2">
            {dayOptions.map((d) => (
              <button
                key={d.key}
                onClick={() => setDay(d.key)}
                className={`flex flex-col items-start rounded-xl border px-4 py-2.5 text-left transition ${
                  d.key === day
                    ? 'border-accent/40 bg-accent/10 text-fg'
                    : 'border-hair bg-ink-850 text-fg-muted hover:border-hair2 hover:text-fg'
                }`}
              >
                <span className="text-sm font-semibold">{d.label}</span>
                <span className="text-[11px] text-fg-faint">{d.focus}</span>
              </button>
            ))}
          </div>

          {dayProgs.length === 0 ? (
            <Empty
              icon={<IconTrend width={28} height={28} />}
              title={`No sessions logged for ${activeDay.label} yet`}
              hint={`Log a ${activeDay.focus} session in the Workout Tracker to start tracking this routine.`}
            />
          ) : (
            <>
              {/* Detail chart (Exercise Strength Trend) */}
              <Card className="mb-6">
                <CardTitle
                  title={selected ? selected.exercise.name : 'Exercise'}
                  subtitle={selected ? `${selected.sessions.length} logged sessions · ${activeDay.label}` : 'Strength trend'}
                  icon={<IconTrend width={16} height={16} />}
                  right={
                    <div className="flex items-center gap-2">
                      <select
                        className="field !w-auto"
                        value={selected?.exercise.id ?? ''}
                        onChange={(e) => setSelectedId(e.target.value)}
                      >
                        {dayProgs.map((p) => (
                          <option key={p.exercise.id} value={p.exercise.id}>{p.exercise.name}</option>
                        ))}
                      </select>
                      <Segmented
                        value={metric}
                        onChange={setMetric}
                        options={[
                          { value: 'volume', label: 'Volume' },
                          { value: 'weight', label: 'Weight' },
                        ]}
                      />
                    </div>
                  }
                />
                {selected && (
                  <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MiniStat label="Current" value={selected.current ? `${selected.current.weight}kg × ${selected.current.reps}` : '—'} />
                    <MiniStat label="Δ Weight" value={<Delta value={selected.weightDelta} suffix="kg" />} />
                    <MiniStat label="Δ Reps" value={<Delta value={selected.repDelta} />} />
                    <MiniStat label="Δ Volume" value={<Delta value={selected.volumeDelta} />} />
                  </div>
                )}
                <TrendChart
                  data={chartData}
                  color={metric === 'volume' ? CHART.volume : CHART.strength}
                  unit={metric === 'volume' ? '' : ' kg'}
                  height={240}
                />
              </Card>

              {/* Complete session log for the selected exercise */}
              <Card className="mb-6" padded={false}>
                <div className="border-b border-hair px-5 py-4">
                  <CardTitle title={`Session Log — ${selected?.exercise.name ?? ''}`} subtitle="Every logged session, newest first" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-hair text-left text-xs uppercase tracking-wide text-fg-faint">
                        <th className="px-5 py-3 font-medium">Date</th>
                        <th className="px-3 py-3 font-medium">Weight</th>
                        <th className="px-3 py-3 font-medium">Reps</th>
                        <th className="px-3 py-3 font-medium">Sets</th>
                        <th className="px-3 py-3 font-medium">Volume</th>
                        <th className="px-5 py-3 text-right font-medium">Δ vs prev</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionLog.map((s) => (
                        <tr key={s.date} className="border-b border-hair/60 hover:bg-ink-800/40">
                          <td className="whitespace-nowrap px-5 py-3 font-medium text-fg">{fmtDateFull(s.date)}</td>
                          <td className="px-3 py-3 tabular-nums text-fg">{s.weight} kg</td>
                          <td className="px-3 py-3 tabular-nums text-fg-muted">{s.reps}</td>
                          <td className="px-3 py-3 tabular-nums text-fg-muted">{s.sets}</td>
                          <td className="px-3 py-3 tabular-nums font-semibold text-fg">{fmtVolume(s.volume)}</td>
                          <td className="px-5 py-3 text-right">
                            {s.prevVolume === null ? (
                              <span className="text-xs text-fg-faint">first</span>
                            ) : (
                              <Delta value={s.volume - s.prevVolume} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Per-exercise summary for the whole routine */}
              <Card padded={false}>
                <div className="border-b border-hair px-5 py-4">
                  <CardTitle
                    title={day === 'all' ? 'All Exercises' : `${activeDay.label} — Routine`}
                    subtitle="Latest session vs the one before it — tap a row to chart it"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-hair text-left text-xs uppercase tracking-wide text-fg-faint">
                        <th className="px-5 py-3 font-medium">Exercise</th>
                        <th className="px-3 py-3 font-medium">Previous</th>
                        <th className="px-3 py-3 font-medium">Current</th>
                        <th className="px-3 py-3 font-medium">Δ Weight</th>
                        <th className="px-3 py-3 font-medium">Δ Reps</th>
                        <th className="px-3 py-3 font-medium">Δ Volume</th>
                        <th className="px-3 py-3 font-medium">Trend</th>
                        <th className="px-5 py-3 text-right font-medium">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayProgs.map((p) => (
                        <tr
                          key={p.exercise.id}
                          onClick={() => setSelectedId(p.exercise.id)}
                          className={`cursor-pointer border-b border-hair/60 transition hover:bg-ink-800/50 ${
                            selected?.exercise.id === p.exercise.id ? 'bg-ink-800/40' : ''
                          }`}
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-fg">{p.exercise.name}</div>
                            <div className="text-xs text-fg-faint">{p.exercise.primaryMuscle} · {p.sessions.length} sessions</div>
                          </td>
                          <td className="px-3 py-3 text-fg-muted">
                            {p.previous ? `${p.previous.weight}kg × ${p.previous.reps}` : '—'}
                            {p.previous && <div className="text-xs text-fg-faint">{fmtDate(p.previous.date)}</div>}
                          </td>
                          <td className="px-3 py-3 text-fg">
                            {p.current ? `${p.current.weight}kg × ${p.current.reps}` : '—'}
                            {p.current && <div className="text-xs text-fg-faint">{fmtDate(p.current.date)}</div>}
                          </td>
                          <td className="px-3 py-3"><Delta value={p.weightDelta} suffix="kg" /></td>
                          <td className="px-3 py-3"><Delta value={p.repDelta} /></td>
                          <td className="px-3 py-3"><span className="text-fg-muted">{fmtVolume(p.volumeDelta)}</span></td>
                          <td className="px-3 py-3">
                            <Sparkline
                              values={p.sessions.map((s) => s.volume)}
                              color={p.direction === 'down' ? CHART.bad : CHART.good}
                            />
                          </td>
                          <td className="px-5 py-3 text-right"><DirBadge p={p} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hair bg-ink-900/40 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-fg-faint">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-fg">{value}</div>
    </div>
  );
}
