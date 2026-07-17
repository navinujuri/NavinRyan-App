import { useEffect, useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import { avgRating, sortedPhysique } from '../lib/calculations';
import { fmt, fmtDateFull, todayISO } from '../lib/format';
import { CHART } from '../theme/chart';
import { Card, CardTitle, Delta, Empty, PageHeader, Pill } from '../components/ui/primitives';
import { PhysiqueRadar, type RadarSeries } from '../components/charts/PhysiqueRadar';
import { Ring } from '../components/ui/Ring';
import { IconRadar, IconTrash } from '../components/ui/icons';
import type { MuscleGroup } from '../types';

export function Physique() {
  const { config, physique, savePhysique, deletePhysique } = useData();
  const muscles = (config?.physiqueMuscles ?? []) as MuscleGroup[];

  const sorted = useMemo(() => sortedPhysique(physique), [physique]);
  const latest = sorted.at(-1);
  const first = sorted[0];

  const [draft, setDraft] = useState<Record<string, number>>({});

  useEffect(() => {
    const base: Record<string, number> = {};
    for (const m of muscles) base[m] = latest?.ratings[m] ?? 5;
    setDraft(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest, config]);

  if (!config) return null;

  const series: RadarSeries[] = [];
  if (sorted.length >= 2 && first) {
    series.push({ name: 'Start', color: CHART.axis, values: first.ratings as Record<string, number> });
  }
  if (latest) {
    series.push({ name: 'Current', color: CHART.physique, values: latest.ratings as Record<string, number> });
  }
  // Live preview from the editor.
  const previewSeries: RadarSeries[] = [
    ...(sorted.length >= 1 && first ? [{ name: 'Start', color: CHART.axis, values: (first?.ratings ?? {}) as Record<string, number> }] : []),
    { name: 'Editing', color: CHART.physique, values: draft },
  ];

  const draftAvg = muscles.reduce((s, m) => s + (draft[m] || 0), 0) / (muscles.length || 1);
  const latestAvg = avgRating(latest, muscles);
  const firstAvg = avgRating(first, muscles);

  const save = async () => {
    const today = todayISO();
    const todaySnap = sorted.find((s) => s.date === today);
    await savePhysique({ date: today, ratings: { ...draft } }, todaySnap?.id);
  };

  return (
    <>
      <PageHeader
        title="Physique Score"
        subtitle="Rate the 8 aesthetic muscles 1–10. Watch the radar fill out as you dial in the Ryan Reynolds look."
        actions={<Pill tone="accent"><IconRadar width={13} height={13} /> {sorted.length} assessments</Pill>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Radar */}
        <Card className="lg:col-span-3">
          <CardTitle
            title="Physique Radar"
            subtitle="Live preview of your current edits vs your starting point"
            icon={<IconRadar width={16} height={16} />}
            right={
              <div className="flex items-center gap-3">
                <Ring value={draftAvg * 10} size={56} stroke={6}>
                  <span className="text-xs font-bold tabular-nums text-fg">{fmt(draftAvg, 1)}</span>
                </Ring>
              </div>
            }
          />
          <PhysiqueRadar axes={muscles} series={previewSeries.length ? previewSeries : series} height={360} />
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-fg-muted">
            <span>Overall now <span className="font-semibold text-fg">{fmt(latestAvg, 1)}/10</span></span>
            {sorted.length >= 2 && (
              <span className="flex items-center gap-1">Since start <Delta value={latestAvg - firstAvg} /></span>
            )}
          </div>
        </Card>

        {/* Editor */}
        <Card className="lg:col-span-2">
          <CardTitle title="Rate Your Physique" subtitle={`Today · ${fmtDateFull(todayISO())}`} />
          <div className="space-y-3.5">
            {muscles.map((m) => (
              <div key={m}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-fg">{m}</span>
                  <span className="tabular-nums font-semibold text-accent-soft">{draft[m] ?? 0}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={draft[m] ?? 5}
                  onChange={(e) => setDraft({ ...draft, [m]: Number(e.target.value) })}
                  className="w-full accent-accent"
                />
              </div>
            ))}
          </div>
          <button className="btn-primary mt-5 w-full" onClick={save}>Save assessment</button>
        </Card>
      </div>

      {/* History */}
      <Card className="mt-6" padded={false}>
        <div className="border-b border-hair px-5 py-4">
          <CardTitle title="Assessment History" subtitle={`${sorted.length} snapshots`} />
        </div>
        {sorted.length === 0 ? (
          <div className="p-5"><Empty title="No assessments yet" hint="Rate your physique above to create your first snapshot." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-hair text-left text-xs uppercase tracking-wide text-fg-faint">
                  <th className="px-5 py-3 font-medium">Date</th>
                  {muscles.map((m) => <th key={m} className="px-2 py-3 font-medium">{m.split(' ').map((w) => w[0]).join('')}</th>)}
                  <th className="px-3 py-3 font-medium">Avg</th>
                  <th className="px-5 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {[...sorted].reverse().map((s) => (
                  <tr key={s.id} className="border-b border-hair/60 hover:bg-ink-800/40">
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-fg">{fmtDateFull(s.date)}</td>
                    {muscles.map((m) => <td key={m} className="px-2 py-3 tabular-nums text-fg-muted">{s.ratings[m] ?? '—'}</td>)}
                    <td className="px-3 py-3 font-semibold text-fg">{fmt(avgRating(s, muscles), 1)}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="rounded-lg p-1.5 text-fg-faint hover:bg-bad/15 hover:text-bad" onClick={() => deletePhysique(s.id)} title="Delete"><IconTrash width={15} height={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="px-5 py-3 text-[11px] text-fg-faint">Column headers are muscle initials — hover a radar point for full names.</p>
      </Card>
    </>
  );
}
