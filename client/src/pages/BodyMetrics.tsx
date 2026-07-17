import { useEffect, useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import { sortedMeasurements } from '../lib/calculations';
import { fmt, fmtDateFull, todayISO } from '../lib/format';
import { CHART } from '../theme/chart';
import { Card, CardTitle, Delta, Empty, PageHeader, StatTile } from '../components/ui/primitives';
import { TrendChart } from '../components/charts/TrendChart';
import { Modal } from '../components/ui/Modal';
import { IconEdit, IconPlus, IconRuler, IconTrash } from '../components/ui/icons';
import type { Measurement } from '../types';

const METRICS: { key: keyof Omit<Measurement, 'id' | 'date'>; label: string; unit: string; invert: boolean }[] = [
  { key: 'weight', label: 'Weight', unit: 'kg', invert: true },
  { key: 'waist', label: 'Waist', unit: 'cm', invert: true },
  { key: 'bodyFat', label: 'Body Fat', unit: '%', invert: true },
  { key: 'neck', label: 'Neck', unit: 'cm', invert: false },
  { key: 'chest', label: 'Chest', unit: 'cm', invert: false },
  { key: 'arms', label: 'Arms', unit: 'cm', invert: false },
  { key: 'thighs', label: 'Thighs', unit: 'cm', invert: false },
];

const EMPTY: Omit<Measurement, 'id'> = {
  date: todayISO(), weight: 0, waist: 0, neck: 0, chest: 0, arms: 0, thighs: 0, bodyFat: 0,
};

function MeasurementModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Measurement | null;
}) {
  const { addMeasurement, updateMeasurement } = useData();
  const [form, setForm] = useState<Omit<Measurement, 'id'>>(EMPTY);

  useEffect(() => {
    if (open) setForm(editing ? { ...editing } : { ...EMPTY, date: todayISO() });
  }, [open, editing]);

  const save = async () => {
    if (editing) await updateMeasurement(editing.id, form);
    else await addMeasurement(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit Measurement' : 'Add Measurement'}
      wide
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save}>{editing ? 'Save' : 'Add entry'}</button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="col-span-2">
          <label className="label">Date</label>
          <input className="field" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        {METRICS.map((m) => (
          <div key={m.key}>
            <label className="label">{m.label} ({m.unit})</label>
            <input
              className="field"
              type="number"
              step="0.1"
              value={form[m.key] || ''}
              onChange={(e) => setForm({ ...form, [m.key]: Number(e.target.value) })}
            />
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function BodyMetrics() {
  const { measurements, deleteMeasurement } = useData();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Measurement | null>(null);

  const ms = useMemo(() => sortedMeasurements(measurements), [measurements]);
  const latest = ms.at(-1);
  const prev = ms.at(-2);

  const series = (key: keyof Measurement) => ms.map((m) => ({ label: m.date, value: Number(m[key]) }));

  const openAdd = () => { setEditing(null); setOpen(true); };
  const openEdit = (m: Measurement) => { setEditing(m); setOpen(true); };

  return (
    <>
      <PageHeader
        title="Body Metrics"
        subtitle="Weekly measurements — the objective proof of the cut."
        actions={<button className="btn-primary" onClick={openAdd}><IconPlus width={16} height={16} /> Add measurement</button>}
      />

      {ms.length === 0 ? (
        <Empty icon={<IconRuler width={28} height={28} />} title="No measurements yet" hint="Add your first weekly measurement to start tracking trends." />
      ) : (
        <>
          {/* Latest snapshot */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {METRICS.map((m) => (
              <StatTile
                key={m.key}
                label={m.label}
                value={fmt(Number(latest?.[m.key]))}
                unit={m.unit}
                delta={prev ? <Delta value={Number(latest?.[m.key]) - Number(prev[m.key])} suffix={m.unit} invert={m.invert} /> : undefined}
              />
            ))}
          </div>

          {/* Required trend charts (Sections 5 & 11) */}
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardTitle title="Weight Trend" subtitle="kg" />
              <TrendChart data={series('weight')} color={CHART.weight} unit=" kg" height={220} />
            </Card>
            <Card>
              <CardTitle title="Waist Trend" subtitle="cm" />
              <TrendChart data={series('waist')} color={CHART.waist} unit=" cm" height={220} />
            </Card>
            <Card>
              <CardTitle title="Body Fat Trend" subtitle="%" />
              <TrendChart data={series('bodyFat')} color={CHART.bodyFat} unit=" %" height={220} />
            </Card>
          </div>

          {/* History table */}
          <Card padded={false}>
            <div className="border-b border-hair px-5 py-4">
              <CardTitle title="Measurement History" subtitle={`${ms.length} entries`} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-hair text-left text-xs uppercase tracking-wide text-fg-faint">
                    <th className="px-5 py-3 font-medium">Date</th>
                    {METRICS.map((m) => <th key={m.key} className="px-3 py-3 font-medium">{m.label}</th>)}
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...ms].reverse().map((m) => (
                    <tr key={m.id} className="border-b border-hair/60 hover:bg-ink-800/40">
                      <td className="whitespace-nowrap px-5 py-3 font-medium text-fg">{fmtDateFull(m.date)}</td>
                      {METRICS.map((met) => (
                        <td key={met.key} className="px-3 py-3 tabular-nums text-fg-muted">{fmt(Number(m[met.key]))}</td>
                      ))}
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button className="rounded-lg p-1.5 text-fg-faint hover:bg-ink-750 hover:text-fg" onClick={() => openEdit(m)} title="Edit"><IconEdit width={15} height={15} /></button>
                          <button className="rounded-lg p-1.5 text-fg-faint hover:bg-bad/15 hover:text-bad" onClick={() => deleteMeasurement(m.id)} title="Delete"><IconTrash width={15} height={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <MeasurementModal open={open} onClose={() => setOpen(false)} editing={editing} />
    </>
  );
}
