import { useMemo, type ReactNode } from 'react';
import { useData } from '../state/DataContext';
import { allProgressions, analytics, muscleSummaries } from '../lib/calculations';
import { fmt, fmtDateFull } from '../lib/format';
import { Card, CardTitle, Empty, PageHeader } from '../components/ui/primitives';
import { BarRank } from '../components/charts/BarRank';
import {
  IconCalendar,
  IconChart,
  IconFlame,
  IconMuscle,
  IconTarget,
  IconTrend,
  IconWeight,
} from '../components/ui/icons';

function InsightCard({
  icon,
  label,
  value,
  detail,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'accent' | 'good' | 'bad';
}) {
  const ring: Record<string, string> = {
    default: 'ring-hair',
    accent: 'ring-accent/30',
    good: 'ring-good/30',
    bad: 'ring-bad/30',
  };
  const iconTone: Record<string, string> = {
    default: 'bg-ink-800 text-fg-muted',
    accent: 'bg-accent/15 text-accent-soft',
    good: 'bg-good/15 text-good',
    bad: 'bg-bad/15 text-bad',
  };
  return (
    <div className={`card p-5 ring-1 ${ring[tone]}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconTone[tone]}`}>{icon}</span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-fg-faint">{label}</p>
          <p className="mt-1 truncate text-lg font-bold text-fg" title={value}>{value}</p>
          {detail && <p className="text-xs text-fg-muted">{detail}</p>}
        </div>
      </div>
    </div>
  );
}

export function Analytics() {
  const { config, workouts, measurements, profile } = useData();

  const a = useMemo(
    () => (config && profile ? analytics(workouts, measurements, profile, config) : null),
    [config, workouts, measurements, profile],
  );

  const topImproved = useMemo(() => {
    if (!config) return [];
    return allProgressions(workouts, config.exercises)
      .filter((p) => p.sessions.length >= 2 && p.sessions[0].volume > 0)
      .map((p) => ({
        label: p.exercise.name,
        value: ((p.sessions.at(-1)!.volume - p.sessions[0].volume) / p.sessions[0].volume) * 100,
      }))
      .sort((x, y) => y.value - x.value)
      .slice(0, 8);
  }, [config, workouts]);

  const muscleBalance = useMemo(() => {
    if (!config) return [];
    return muscleSummaries(workouts, config)
      .filter((s) => s.total > 0)
      .map((s) => ({ label: s.muscle, value: s.total }));
  }, [config, workouts]);

  if (!config || !profile || !a) return null;

  const hasData = workouts.length > 0;

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle="The story your data tells — what’s working, what’s lagging, and when you’ll hit goal."
      />

      {!hasData ? (
        <Empty icon={<IconChart width={28} height={28} />} title="Not enough data yet" hint="Log workouts and measurements to generate insights." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InsightCard tone="accent" icon={<IconFlame width={20} height={20} />} label="Strongest Exercise" value={a.strongest?.name ?? '—'} detail={a.strongest?.detail} />
            <InsightCard tone="good" icon={<IconTrend width={20} height={20} />} label="Most Improved" value={a.mostImproved?.name ?? '—'} detail={a.mostImproved?.detail} />
            <InsightCard icon={<IconMuscle width={20} height={20} />} label="Most Trained Muscle" value={a.mostTrained?.name ?? '—'} detail={a.mostTrained?.detail} />
            <InsightCard tone="bad" icon={<IconTarget width={20} height={20} />} label="Lagging Muscle" value={a.lagging?.name ?? '—'} detail={`${a.lagging?.detail ?? ''} · give it extra sets`} />
            <InsightCard tone="good" icon={<IconWeight width={20} height={20} />} label="Current Weight Loss" value={`${fmt(a.weightLoss)} kg`} detail={a.weeklyLossRate > 0 ? `${fmt(a.weeklyLossRate, 2)} kg / week` : 'holding steady'} />
            <InsightCard icon={<IconCalendar width={20} height={20} />} label="Estimated Goal Date" value={a.estimatedGoalDate ? fmtDateFull(a.estimatedGoalDate) : '—'} detail={a.estimatedGoalDate ? `at current rate → ${profile.goalWeight} kg` : 'need more data / rate too slow'} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardTitle title="Most Improved Exercises" subtitle="Volume gain since first logged session" icon={<IconTrend width={16} height={16} />} />
              <BarRank data={topImproved} height={320} unit="%" valueFormat={(n) => `${n > 0 ? '+' : ''}${Math.round(n)}%`} />
            </Card>
            <Card>
              <CardTitle title="Muscle Balance" subtitle="All-time volume distribution" icon={<IconMuscle width={16} height={16} />} />
              <BarRank data={muscleBalance} height={320} />
            </Card>
          </div>
        </>
      )}
    </>
  );
}
