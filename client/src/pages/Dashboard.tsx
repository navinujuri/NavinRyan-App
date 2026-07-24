import { useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import {
  programState,
  ryanReynoldsProgress,
  sortedMeasurements,
  workoutStreak,
  type WorkoutStreak,
} from '../lib/calculations';
import { Flame } from '../components/ui/Flame';
import { fmt, fmtDateFull, fmtSigned } from '../lib/format';
import { CHART } from '../theme/chart';
import { Card, CardTitle, Delta, PageHeader, Pill, ProgressBar, StatTile } from '../components/ui/primitives';
import { Ring } from '../components/ui/Ring';
import { TrendChart } from '../components/charts/TrendChart';
import { ProfileModal } from '../components/ProfileModal';
import {
  IconCalendar,
  IconEdit,
  IconFlame,
  IconRuler,
  IconTarget,
  IconTrend,
  IconWeight,
} from '../components/ui/icons';

function goalProgress(start: number, current: number, goal: number): number {
  if (start === goal) return current <= goal ? 100 : 0;
  return Math.max(0, Math.min(100, ((start - current) / (start - goal)) * 100));
}

function GoalCard({
  title,
  icon,
  start,
  current,
  goal,
  unit,
}: {
  title: string;
  icon: React.ReactNode;
  start: number;
  current: number;
  goal: number;
  unit: string;
}) {
  const pct = goalProgress(start, current, goal);
  const remaining = current - goal;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-fg-faint">
          <span className="text-accent-soft">{icon}</span>
          {title}
        </span>
        <Delta value={current - start} suffix={unit} invert />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold tabular-nums text-fg">{fmt(current)}</span>
          <span className="ml-1 text-sm text-fg-muted">{unit}</span>
        </div>
        <div className="text-right text-xs text-fg-faint">
          <div>Goal <span className="font-semibold text-fg-muted">{fmt(goal)}{unit}</span></div>
          <div>Start {fmt(start)}{unit}</div>
        </div>
      </div>
      <div className="mt-3">
        <ProgressBar value={pct} />
        <div className="mt-1.5 flex justify-between text-[11px] text-fg-faint">
          <span>{Math.round(pct)}% to goal</span>
          <span>{remaining > 0 ? `${fmt(remaining)}${unit} to go` : 'Goal reached 🎉'}</span>
        </div>
      </div>
    </Card>
  );
}

function StreakTile({ streak, hint }: { streak: WorkoutStreak; hint: string }) {
  const lit = streak.current > 0;
  return (
    <div className={`card relative p-4 ${lit ? 'ring-1 ring-accent/40' : ''}`}>
      {/* Warm ember wash rising from the base when the streak is alive. */}
      {lit && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-2xl bg-gradient-to-t from-accent/15 to-transparent" />
      )}
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-fg-faint">Workout Streak</span>
        <Flame size={26} lit={lit} />
      </div>
      <div className="relative mt-2 flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold tabular-nums ${lit ? 'text-fg' : 'text-fg-muted'}`}>
          {streak.current}
        </span>
        <span className="text-sm text-fg-muted">{streak.current === 1 ? 'session' : 'sessions'}</span>
      </div>
      <div className="relative mt-1">
        <span className="text-xs text-fg-faint">{hint}</span>
      </div>
    </div>
  );
}

function RRBreakdownRow({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-fg-muted">
          {label} <span className="text-fg-faint">· {Math.round(weight * 100)}% weight</span>
        </span>
        <span className="font-semibold tabular-nums text-fg">{Math.round(value * 100)}%</span>
      </div>
      <ProgressBar value={value * 100} height="h-1.5" />
    </div>
  );
}

export function Dashboard() {
  const { profile, config, workouts, measurements, physique, restLogs } = useData();
  const [editOpen, setEditOpen] = useState(false);

  const derived = useMemo(() => {
    if (!profile || !config) return null;
    const state = programState(profile, config.program);
    const rr = ryanReynoldsProgress(workouts, measurements, physique, profile, config);
    const ms = sortedMeasurements(measurements);
    const streak = workoutStreak(workouts, restLogs);
    return { state, rr, ms, streak };
  }, [profile, config, workouts, measurements, physique, restLogs]);

  if (!profile || !config || !derived) return null;
  const { state, rr, ms, streak } = derived;

  const streakHint = streak.lastDate
    ? streak.current > 0
      ? `best ${streak.longest} · ${streak.isActiveToday ? 'trained today' : `${streak.daysSinceLast}d ago`}`
      : `broken · last ${streak.daysSinceLast}d ago`
    : 'log a workout to start';

  const startW = ms[0]?.weight ?? profile.currentWeight;
  const curW = ms.at(-1)?.weight ?? profile.currentWeight;
  const startWaist = ms[0]?.waist ?? profile.currentWaist;
  const curWaist = ms.at(-1)?.waist ?? profile.currentWaist;
  const startBF = ms[0]?.bodyFat ?? profile.bodyFat;
  const curBF = ms.at(-1)?.bodyFat ?? profile.bodyFat;

  const weightSeries = ms.map((m) => ({ label: m.date, value: m.weight }));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${profile.name}`}
        subtitle={`${config.program.name} · chasing the lean, wide-shouldered Ryan Reynolds look.`}
        actions={
          <button className="btn-ghost" onClick={() => setEditOpen(true)}>
            <IconEdit width={16} height={16} /> Edit profile
          </button>
        }
      />

      {/* Hero — My Progress % (Section 12) */}
      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
          <div className="flex items-center gap-6">
            <Ring value={rr.total} size={148}>
              <div>
                <div className="text-3xl font-extrabold tabular-nums text-fg">{Math.round(rr.total)}%</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-accent-soft">Score</div>
              </div>
            </Ring>
            <div className="hidden sm:block">
              <p className="flex items-center gap-2 text-sm font-semibold text-fg">
                My Progress
              </p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-fg-faint">
                A single composite score: 40% body-fat reduction, 30% strength gains, 30% physique
                ratings — 0% at the start line, 100% at peak condition.
              </p>
              <div className="mt-3">
                <Pill tone="accent">
                  <IconTarget width={13} height={13} /> {state.phase} · {state.phaseHint}
                </Pill>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3 border-t border-hair pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <RRBreakdownRow label="Body-fat reduction" value={rr.bodyFat} weight={0.4} />
            <RRBreakdownRow label="Strength progress" value={rr.strength} weight={0.3} />
            <RRBreakdownRow label="Physique ratings" value={rr.physique} weight={0.3} />
          </div>
        </div>
      </Card>

      {/* Program state (Section 1) */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StreakTile streak={streak} hint={streakHint} />
        <StatTile label="Days Completed" value={state.daysCompleted} unit={`/ ${state.totalDays}`} icon={<IconCalendar width={18} height={18} />} />
        <StatTile label="Days Remaining" value={state.daysRemaining} icon={<IconCalendar width={18} height={18} />} hint={`ends ${fmtDateFull(profile.targetDate)}`} />
        <StatTile label="Timeline Progress" value={`${Math.round(state.progressPct)}%`} icon={<IconTrend width={18} height={18} />} hint={`week ${state.currentWeek} of ${state.totalWeeks}`} />
        <StatTile label="Current Phase" value={state.phase} icon={<IconFlame width={18} height={18} />} accent hint={state.isDeload ? 'Deload week' : undefined} />
      </div>

      {/* Timeline bar */}
      <Card className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs text-fg-muted">
          <span>{fmtDateFull(profile.startDate)}</span>
          <span className="font-semibold text-fg">Week {state.currentWeek} / {state.totalWeeks}</span>
          <span>{fmtDateFull(profile.targetDate)}</span>
        </div>
        <ProgressBar value={state.progressPct} height="h-3" />
      </Card>

      {/* Goal cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <GoalCard title="Weight" icon={<IconWeight width={16} height={16} />} start={startW} current={curW} goal={profile.goalWeight} unit=" kg" />
        <GoalCard title="Waist" icon={<IconRuler width={16} height={16} />} start={startWaist} current={curWaist} goal={profile.goalWaist} unit=" cm" />
        <GoalCard title="Body Fat" icon={<IconTarget width={16} height={16} />} start={startBF} current={curBF} goal={profile.goalBodyFat} unit=" %" />
      </div>

      {/* Weight trend + profile facts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle
            title="Weight Trend"
            subtitle={`Down ${fmt(startW - curW)} kg since start`}
            icon={<IconTrend width={16} height={16} />}
            right={<Delta value={curW - startW} suffix=" kg" invert />}
          />
          <TrendChart data={weightSeries} color={CHART.weight} unit=" kg" goal={profile.goalWeight} height={240} />
        </Card>

        <Card>
          <CardTitle title="Athlete Profile" icon={<IconTarget width={16} height={16} />} />
          <dl className="space-y-2.5 text-sm">
            {[
              ['Name', profile.name],
              ['Age', `${profile.age} yrs`],
              ['Height', `${profile.height} cm`],
              ['Weight change', fmtSigned(curW - startW, 1, ' kg')],
              ['Started', fmtDateFull(profile.startDate)],
              ['Target', fmtDateFull(profile.targetDate)],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between border-b border-hair pb-2 last:border-0">
                <dt className="text-fg-faint">{k}</dt>
                <dd className="font-semibold text-fg">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-fg-faint">Non-negotiables</p>
            <div className="flex flex-wrap gap-1.5">
              {config.program.nonNegotiables.map((n) => (
                <span key={n} className="chip">{n}</span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <ProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
