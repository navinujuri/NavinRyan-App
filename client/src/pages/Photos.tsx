import { useMemo, useRef, useState } from 'react';
import { useData } from '../state/DataContext';
import { todayISO } from '../lib/format';
import { Card, CardTitle, PageHeader, Pill, Segmented } from '../components/ui/primitives';
import { IconCamera, IconPlus, IconTrash } from '../components/ui/icons';
import type { Photo } from '../types';

const MONTHS = [1, 2, 3, 4];
const VIEWS: Photo['view'][] = ['front', 'side', 'back'];

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PhotoTile({ month, view }: { month: number; view: Photo['view'] }) {
  const { photos, addPhoto, deletePhoto } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const existing = photos.find((p) => p.month === month && p.view === view);

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      if (existing) await deletePhoto(existing.id);
      await addPhoto({ month, view, date: todayISO(), dataUrl, caption: `Month ${month} — ${view}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-hair bg-ink-900">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {existing ? (
        <>
          <img src={existing.dataUrl} alt={existing.caption} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
            <button className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-white backdrop-blur hover:bg-white/20" onClick={() => inputRef.current?.click()}>
              Replace
            </button>
            <button className="rounded-md bg-bad/80 p-1.5 text-white hover:bg-bad" onClick={() => deletePhoto(existing.id)} title="Delete">
              <IconTrash width={14} height={14} />
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-fg-faint transition hover:bg-ink-850 hover:text-fg-muted"
        >
          <IconPlus width={22} height={22} />
          <span className="text-xs font-medium">{busy ? 'Uploading…' : 'Upload'}</span>
        </button>
      )}
      <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
        {view}
      </span>
    </div>
  );
}

export function Photos() {
  const { photos } = useData();
  const [view, setView] = useState<Photo['view']>('front');

  const filled = photos.length;
  const byMonthView = useMemo(() => {
    const map = new Map<string, Photo>();
    for (const p of photos) map.set(`${p.month}-${p.view}`, p);
    return map;
  }, [photos]);

  return (
    <>
      <PageHeader
        title="Photo Tracker"
        subtitle="Monthly progress photos — the transformation you can actually see."
        actions={<Pill tone={filled ? 'accent' : 'default'}><IconCamera width={13} height={13} /> {filled} photos stored</Pill>}
      />

      {/* Comparison gallery */}
      <Card className="mb-6">
        <CardTitle
          title="Comparison Gallery"
          subtitle="Same angle, month over month"
          icon={<IconCamera width={16} height={16} />}
          right={
            <Segmented
              value={view}
              onChange={setView}
              options={VIEWS.map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))}
            />
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MONTHS.map((month) => {
            const photo = byMonthView.get(`${month}-${view}`);
            return (
              <div key={month}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-fg">Month {month}</span>
                  {photo && <span className="text-[10px] text-fg-faint">{photo.date}</span>}
                </div>
                <div className="aspect-[3/4] overflow-hidden rounded-xl border border-hair bg-ink-900">
                  {photo ? (
                    <img src={photo.dataUrl} alt={photo.caption} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-fg-faint">Not uploaded</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upload manager */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {MONTHS.map((month) => (
          <Card key={month}>
            <CardTitle title={`Month ${month}`} subtitle="Front · Side · Back" />
            <div className="grid grid-cols-3 gap-3">
              {VIEWS.map((v) => (
                <PhotoTile key={v} month={month} view={v} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
