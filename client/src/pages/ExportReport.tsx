import { useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import { buildExport, buildReport, downloadFile, type Bundle } from '../lib/report';
import { fmtVolume } from '../lib/format';
import { Card, CardTitle, PageHeader } from '../components/ui/primitives';
import { IconCheck, IconCopy, IconExport, IconSparkle } from '../components/ui/icons';

export function ExportReport() {
  const { profile, config, workouts, measurements, physique, photos, restLogs } = useData();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const bundle = useMemo<Bundle | null>(() => {
    if (!profile || !config) return null;
    return { profile, config, workouts, measurements, physique, photos, restLogs };
  }, [profile, config, workouts, measurements, physique, photos, restLogs]);

  const report = useMemo(() => (bundle ? buildReport(bundle) : ''), [bundle]);

  if (!bundle) return null;

  const totalVolume = workouts.reduce((s, w) => s + w.volume, 0);
  const stats = [
    ['Workouts', workouts.length],
    ['Measurements', measurements.length],
    ['Physique snapshots', physique.length],
    ['Photos', photos.length],
    ['Rest days', restLogs.length],
    ['Total volume', fmtVolume(totalVolume)],
  ] as const;

  const exportJson = () => {
    const data = buildExport(bundle);
    downloadFile('ryan-reynolds-phase1-export.json', JSON.stringify(data, null, 2), 'application/json');
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1500);
  };

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. non-secure context) — fall back to a download.
      downloadFile('coaching-report.txt', report, 'text/plain');
    }
  };

  const downloadReport = () => downloadFile('ryan-reynolds-coaching-report.txt', report, 'text/plain');

  return (
    <>
      <PageHeader
        title="Export & Report"
        subtitle="Back up your data, or generate a coaching summary to paste straight into ChatGPT."
      />

      {/* Data snapshot */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="card p-4 text-center">
            <div className="text-xl font-bold tabular-nums text-fg">{value}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-wide text-fg-faint">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Section 9 — Export JSON */}
        <Card>
          <CardTitle title="Export JSON" subtitle="Full data backup — profile, workouts, metrics, muscle volumes, ratings & photos" icon={<IconExport width={16} height={16} />} />
          <p className="mb-4 text-sm text-fg-muted">
            Downloads a complete, re-importable snapshot as{' '}
            <code className="rounded bg-ink-900 px-1.5 py-0.5 text-xs text-accent-soft">ryan-reynolds-phase1-export.json</code>.
          </p>
          <div className="mb-4 rounded-lg border border-hair bg-ink-900 p-3 font-mono text-[11px] leading-relaxed text-fg-faint">
            <div>{'{'}</div>
            <div className="pl-3">profile: {'{…}'},</div>
            <div className="pl-3">measurements: [{measurements.length}],</div>
            <div className="pl-3">workouts: [{workouts.length}],</div>
            <div className="pl-3">muscleVolumes: [{bundle.config.muscleGroups.length}],</div>
            <div className="pl-3">physiqueRatings: [{physique.length}],</div>
            <div className="pl-3">photos: [{photos.length}],</div>
            <div className="pl-3">restLogs: [{restLogs.length}]</div>
            <div>{'}'}</div>
          </div>
          <button className={downloaded ? 'btn w-full bg-good/20 text-good' : 'btn-primary w-full'} onClick={exportJson}>
            {downloaded ? <><IconCheck width={16} height={16} /> Downloaded</> : <><IconExport width={16} height={16} /> Export JSON</>}
          </button>
        </Card>

        {/* Section 10 — ChatGPT Report */}
        <Card>
          <CardTitle title="ChatGPT Coaching Report" subtitle="One-click plain-text summary for AI coaching analysis" icon={<IconSparkle width={16} height={16} />} right={
            <div className="flex gap-2">
              <button className={copied ? 'btn bg-good/20 text-good' : 'btn-ghost'} onClick={copyReport}>
                {copied ? <><IconCheck width={15} height={15} /> Copied</> : <><IconCopy width={15} height={15} /> Copy</>}
              </button>
              <button className="btn-ghost" onClick={downloadReport}><IconExport width={15} height={15} /> .txt</button>
            </div>
          } />
          <textarea
            readOnly
            value={report}
            className="h-[360px] w-full resize-none rounded-lg border border-hair bg-ink-950 p-3 font-mono text-[11px] leading-relaxed text-fg-muted outline-none focus:border-accent/40"
          />
          <p className="mt-2 text-[11px] text-fg-faint">Tip: copy this, paste into ChatGPT, and ask “review my progress and adjust my plan.”</p>
        </Card>
      </div>
    </>
  );
}
