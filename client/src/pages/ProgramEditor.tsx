import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useData } from '../state/DataContext';
import { api } from '../api/client';
import { Card, CardTitle, Empty, PageHeader, Pill, Segmented } from '../components/ui/primitives';
import { Modal } from '../components/ui/Modal';
import {
  IconCalendar,
  IconChevronDown,
  IconCheck,
  IconCopy,
  IconDumbbell,
  IconEdit,
  IconExport,
  IconMuscle,
  IconPlus,
  IconTrash,
} from '../components/ui/icons';
import { downloadFile } from '../lib/report';
import type { AppConfig, ExerciseTemplate, ScheduleEntry } from '../types';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'program';

function ExportModal({ open, onClose, json, name }: { open: boolean; onClose: () => void; json: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      downloadFile(`${slugify(name)}.json`, json, 'application/json');
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export current phase"
      wide
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Close</button>
          <button className="btn-ghost" onClick={() => downloadFile(`${slugify(name)}.json`, json, 'application/json')}>
            <IconExport width={15} height={15} /> Download .json
          </button>
          <button className={copied ? 'btn bg-good/20 text-good' : 'btn-primary'} onClick={copy}>
            {copied ? <><IconCheck width={15} height={15} /> Copied</> : <><IconCopy width={15} height={15} /> Copy JSON</>}
          </button>
        </>
      }
    >
      <p className="mb-2 text-sm text-fg-muted">
        Your active phase in the import format — copy or download it, tweak it, and import it back as a new phase (or keep it as a backup / share it).
      </p>
      <textarea readOnly className="field min-h-[340px] font-mono text-[11px] leading-relaxed" value={json} spellCheck={false} />
    </Modal>
  );
}

// Serialize the active phase into the import JSON format (round-trippable).
function currentPhaseToJson(config: AppConfig): string {
  return JSON.stringify(
    {
      name: config.program.name,
      durationWeeks: config.program.durationWeeks,
      deloadWeek: config.program.deloadWeek,
      priorities: config.program.priorities,
      nonNegotiables: config.program.nonNegotiables,
      days: config.schedule.map((d) => ({
        title: d.title,
        focus: d.focus,
        type: d.type,
        exercises: config.exercises
          .filter((e) => e.day === d.dayKey && e.active !== false)
          .sort((a, b) => a.order - b.order)
          .map((e) => ({
            name: e.name,
            primaryMuscle: e.primaryMuscle,
            secondaryMuscles: e.secondaryMuscles,
            sets: e.targetSets,
            reps: `${e.repRange[0]}-${e.repRange[1]}`,
            ...(e.cue ? { cue: e.cue } : {}),
          })),
      })),
    },
    null,
    2,
  );
}

const IMPORT_EXAMPLE = `{
  "name": "My Phase 2",
  "durationWeeks": 16,
  "deloadWeek": 9,
  "priorities": ["Side Delts", "Upper Chest"],
  "nonNegotiables": ["Protein 180g+", "Sleep 8h"],
  "days": [
    {
      "title": "Pull",
      "focus": "V-Taper Day",
      "type": "train",
      "exercises": [
        { "name": "Assisted Pull-Up", "primaryMuscle": "Lats", "secondaryMuscles": ["Biceps"], "sets": 4, "reps": "8-12", "cue": "Neutral handles" },
        { "name": "Chest Supported Row", "primaryMuscle": "Lats", "sets": 4, "reps": "8-12" }
      ]
    },
    { "title": "Rest", "type": "rest", "focus": "Walk + mobility" }
  ]
}`;

function ImportModal({
  open,
  onClose,
  currentJson,
}: {
  open: boolean;
  onClose: () => void;
  currentJson: () => string;
}) {
  const { reload } = useData();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setText(''); setError(null); } }, [open]);

  const doImport = async () => {
    setError(null);
    let spec: unknown;
    try {
      spec = JSON.parse(text);
    } catch {
      setError('That’s not valid JSON — check for missing commas, quotes, or brackets.');
      return;
    }
    if (!spec || typeof spec !== 'object' || !Array.isArray((spec as { days?: unknown }).days)) {
      setError('JSON must be an object with a "days" array.');
      return;
    }
    setBusy(true);
    try {
      await api.importProgram(spec);
      await reload(true);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import phase from JSON"
      wide
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={doImport} disabled={busy || !text.trim()}>
            {busy ? 'Importing…' : 'Import as new phase'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-fg-muted">
          Paste a phase definition to build all its days and exercises at once. It’s added as a new phase and made active.
          Any muscle you reference that doesn’t exist yet is added as a custom muscle automatically.
        </p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => setText(currentJson())}>Use current phase as template</button>
          <button className="btn-ghost" onClick={() => setText(IMPORT_EXAMPLE)}>Load example</button>
        </div>
        <textarea
          className="field min-h-[300px] font-mono text-[11px] leading-relaxed"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={IMPORT_EXAMPLE}
          spellCheck={false}
        />
        {error && <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-xs font-medium text-bad">{error}</p>}
        <p className="text-[11px] text-fg-faint">
          Day <b>type</b> defaults to <code>"train"</code>. Exercise <b>sets</b> defaults to 3; <b>reps</b> accepts
          <code> "8-12"</code> or a number (or use <code>repMin</code>/<code>repMax</code>). Muscles are optional.
        </p>
      </div>
    </Modal>
  );
}

// ── Exercise add/edit modal ──────────────────────────────────────────────────
function ExerciseModal({
  open,
  onClose,
  onSave,
  initial,
  muscleOptions,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (v: {
    name: string;
    primaryMuscle: string;
    secondaryMuscles: string[];
    targetSets: number;
    repMin: number;
    repMax: number;
    cue: string;
  }) => Promise<void>;
  initial: ExerciseTemplate | null;
  muscleOptions: string[];
}) {
  const [name, setName] = useState('');
  const [primary, setPrimary] = useState(muscleOptions[0] || '');
  const [secondary, setSecondary] = useState<string[]>([]);
  const [sets, setSets] = useState('3');
  const [repMin, setRepMin] = useState('8');
  const [repMax, setRepMax] = useState('12');
  const [cue, setCue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setPrimary(initial?.primaryMuscle ?? muscleOptions[0] ?? '');
    setSecondary(initial?.secondaryMuscles ?? []);
    setSets(String(initial?.targetSets ?? 3));
    setRepMin(String(initial?.repRange?.[0] ?? 8));
    setRepMax(String(initial?.repRange?.[1] ?? 12));
    setCue(initial?.cue ?? '');
  }, [open, initial, muscleOptions]);

  const toggleSecondary = (m: string) =>
    setSecondary((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        name: name.trim() || 'Untitled',
        primaryMuscle: primary,
        secondaryMuscles: secondary.filter((m) => m !== primary),
        targetSets: Number(sets) || 0,
        repMin: Number(repMin) || 0,
        repMax: Number(repMax) || 0,
        cue: cue.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Exercise' : 'Add Exercise'}
      wide
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : initial ? 'Save' : 'Add exercise'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Exercise name</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Incline DB Press" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="label">Sets</label>
            <input className="field" type="number" value={sets} onChange={(e) => setSets(e.target.value)} />
          </div>
          <div>
            <label className="label">Reps min</label>
            <input className="field" type="number" value={repMin} onChange={(e) => setRepMin(e.target.value)} />
          </div>
          <div>
            <label className="label">Reps max</label>
            <input className="field" type="number" value={repMax} onChange={(e) => setRepMax(e.target.value)} />
          </div>
          <div>
            <label className="label">Primary muscle</label>
            <select className="field" value={primary} onChange={(e) => setPrimary(e.target.value)}>
              {muscleOptions.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Secondary muscles</label>
          <div className="flex flex-wrap gap-1.5">
            {muscleOptions.filter((m) => m !== primary).map((m) => {
              const on = secondary.includes(m);
              return (
                <button key={m} type="button" onClick={() => toggleSecondary(m)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition ${on ? 'bg-accent/20 text-accent-soft ring-1 ring-accent/40' : 'bg-ink-750 text-fg-faint hover:text-fg-muted'}`}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="label">Cue / note (optional)</label>
          <input className="field" value={cue} onChange={(e) => setCue(e.target.value)} placeholder="e.g. 30° bench, slow eccentric" />
        </div>
      </div>
    </Modal>
  );
}

// ── Day add/edit modal ───────────────────────────────────────────────────────
function DayModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (v: { title: string; focus: string; type: 'train' | 'rest' }) => Promise<void>;
  initial: ScheduleEntry | null;
}) {
  const [title, setTitle] = useState('');
  const [focus, setFocus] = useState('');
  const [type, setType] = useState<'train' | 'rest'>('train');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setFocus(initial?.focus ?? '');
    setType(initial?.type ?? 'train');
  }, [open, initial]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({ title: title.trim() || 'New Day', focus: focus.trim(), type });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Day' : 'Add Day'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Type</label>
          <Segmented value={type} onChange={setType} options={[{ value: 'train', label: 'Training' }, { value: 'rest', label: 'Rest' }]} />
        </div>
        <div>
          <label className="label">Title</label>
          <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pull, Push, Rest" autoFocus />
        </div>
        <div>
          <label className="label">Focus</label>
          <input className="field" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. V-Taper Day / walk + mobility" />
        </div>
      </div>
    </Modal>
  );
}

// ── Program meta editor ──────────────────────────────────────────────────────
function ProgramMetaForm({ programId, initial }: { programId: string; initial: { name: string; durationWeeks: number; deloadWeek: number; priorities: string[]; nonNegotiables: string[] } }) {
  const { reload } = useData();
  const [name, setName] = useState(initial.name);
  const [weeks, setWeeks] = useState(String(initial.durationWeeks));
  const [deload, setDeload] = useState(String(initial.deloadWeek));
  const [priorities, setPriorities] = useState(initial.priorities.join(', '));
  const [nonNeg, setNonNeg] = useState(initial.nonNegotiables.join('\n'));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.updateProgram(programId, {
        name: name.trim(),
        durationWeeks: Number(weeks) || 16,
        deloadWeek: Number(deload) || 9,
        priorities: priorities.split(',').map((s) => s.trim()).filter(Boolean),
        nonNegotiables: nonNeg.split('\n').map((s) => s.trim()).filter(Boolean),
      });
      await reload(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 1400);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardTitle title="Phase details" subtitle="Name, length, deload week & focus for the active phase" icon={<IconEdit width={16} height={16} />} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Phase name</label>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Duration (weeks)</label>
            <input className="field" type="number" value={weeks} onChange={(e) => setWeeks(e.target.value)} />
          </div>
          <div>
            <label className="label">Deload week</label>
            <input className="field" type="number" value={deload} onChange={(e) => setDeload(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Priorities (comma-separated)</label>
          <input className="field" value={priorities} onChange={(e) => setPriorities(e.target.value)} placeholder="Side Delts, Upper Chest, Lats" />
        </div>
        <div>
          <label className="label">Non-negotiables (one per line)</label>
          <textarea className="field min-h-[76px]" value={nonNeg} onChange={(e) => setNonNeg(e.target.value)} placeholder="Protein 160g+&#10;Sleep 7.5–8h" />
        </div>
      </div>
      <div className="mt-4">
        <button className={saved ? 'btn bg-good/20 text-good' : 'btn-primary'} onClick={save} disabled={saving}>
          {saved ? <><IconCheck width={16} height={16} /> Saved</> : saving ? 'Saving…' : 'Save phase details'}
        </button>
      </div>
    </Card>
  );
}

// ── "New phase" dropdown menu ─────────────────────────────────────────────────
// Collapses the four "create a phase" actions into one menu so the Phases bar
// stays uncluttered. Closes on outside-click or Escape.
function NewPhaseMenu({
  busy,
  onBlank,
  onCloneRR,
  onClonePhase0,
  onImport,
}: {
  busy: boolean;
  onBlank: () => void;
  onCloneRR: () => void;
  onClonePhase0: () => void;
  onImport: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const Item = ({ label, hint, icon, onClick }: { label: string; hint: string; icon: ReactNode; onClick: () => void }) => (
    <button
      role="menuitem"
      className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-ink-750"
      onClick={() => { setOpen(false); onClick(); }}
    >
      <span className="mt-0.5 text-fg-faint">{icon}</span>
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        <span className="block text-xs text-fg-faint">{hint}</span>
      </span>
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn-primary"
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <IconPlus width={15} height={15} /> New phase
        <IconChevronDown width={14} height={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 z-30 mt-1.5 w-64 animate-fade-in rounded-xl border border-hair2 bg-ink-850 p-1.5 shadow-card">
          <Item label="Blank phase" hint="Start from scratch" icon={<IconPlus width={16} height={16} />} onClick={onBlank} />
          <Item label="Copy RR template" hint="Phase 1 — the full RR program" icon={<IconCopy width={16} height={16} />} onClick={onCloneRR} />
          <Item label="Copy Phase 0 template" hint="8-week beginner on-ramp" icon={<IconCopy width={16} height={16} />} onClick={onClonePhase0} />
          <Item label="Import from JSON…" hint="Paste a phase definition" icon={<IconEdit width={16} height={16} />} onClick={onImport} />
        </div>
      )}
    </div>
  );
}

// ── Main editor ──────────────────────────────────────────────────────────────
export function ProgramEditor() {
  const { config, programs, activeProgramId, reload } = useData();
  const [custom, setCustom] = useState<{ id: string; name: string }[]>([]);
  const [newMuscle, setNewMuscle] = useState('');
  const [busy, setBusy] = useState(false);
  const [dayModal, setDayModal] = useState<{ open: boolean; day: ScheduleEntry | null }>({ open: false, day: null });
  const [exModal, setExModal] = useState<{ open: boolean; dayKey: string; ex: ExerciseTemplate | null }>({ open: false, dayKey: '', ex: null });
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const loadCustom = () => api.getMuscles().then((m) => setCustom(m.custom)).catch(() => {});
  useEffect(() => { loadCustom(); }, []);

  const active = useMemo(() => programs.find((p) => p.id === activeProgramId) || null, [programs, activeProgramId]);

  if (!config) return null;
  const muscleOptions = config.muscleGroups;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); await reload(true); } finally { setBusy(false); }
  };

  const exercisesForDay = (dayKey: string) =>
    config.exercises.filter((e) => e.day === dayKey && e.active !== false).sort((a, b) => a.order - b.order);

  return (
    <>
      <PageHeader
        title="Program Editor"
        subtitle="Build your own routine — add phases, days, and exercises, and set your own targets."
      />

      {/* Phase switcher */}
      <Card className="mb-6">
        <CardTitle title="Phases" subtitle="Each phase is its own routine. The active one drives the whole app." icon={<IconDumbbell width={16} height={16} />} />
        <div className="flex flex-wrap gap-2">
          {programs.map((p) => {
            const isActive = p.id === activeProgramId;
            return (
              <div key={p.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isActive ? 'border-accent/40 bg-accent/10' : 'border-hair bg-ink-850'}`}>
                <button className="text-sm font-semibold text-fg disabled:cursor-default" disabled={isActive || busy} onClick={() => run(() => api.activateProgram(p.id))} title={isActive ? 'Active' : 'Switch to this phase'}>
                  {p.name}
                </button>
                {isActive ? <Pill tone="accent">Active</Pill> : <span className="text-[11px] text-fg-faint">tap to edit</span>}
                {programs.length > 1 && (
                  <button className="text-fg-faint hover:text-bad" title="Delete phase"
                    onClick={() => { if (confirm(`Delete phase "${p.name}"? Logged workouts stay, but this routine is removed.`)) run(() => api.deleteProgram(p.id)); }}>
                    <IconTrash width={14} height={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <NewPhaseMenu
            busy={busy}
            onBlank={() => run(async () => { const p = await api.createProgram({ name: 'New Phase' }); await api.activateProgram((p as { id: string }).id); })}
            onCloneRR={() => run(async () => { const p = await api.createProgram({ name: 'Copy of template', clone: true }); await api.activateProgram((p as { id: string }).id); })}
            onClonePhase0={() => run(async () => { const p = await api.createProgram({ template: 'phase0' }); await api.activateProgram((p as { id: string }).id); })}
            onImport={() => setImportOpen(true)}
          />
          <button className="btn-ghost" disabled={busy || !active} onClick={() => setExportOpen(true)}>
            <IconExport width={15} height={15} /> Export phase
          </button>
        </div>
      </Card>

      {active && (
        <ProgramMetaForm
          key={active.id}
          programId={active.id}
          initial={{ name: config.program.name, durationWeeks: config.program.durationWeeks, deloadWeek: config.program.deloadWeek, priorities: config.program.priorities, nonNegotiables: config.program.nonNegotiables }}
        />
      )}

      {/* Days + exercises */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">Schedule</h2>
        <button className="btn-ghost" disabled={busy || !active} onClick={() => setDayModal({ open: true, day: null })}>
          <IconPlus width={15} height={15} /> Add day
        </button>
      </div>

      {!active || config.schedule.length === 0 ? (
        <Empty icon={<IconCalendar width={28} height={28} />} title="No days yet" hint="Add your first training day to start building the routine." />
      ) : (
        <div className="space-y-4">
          {config.schedule.map((day) => (
            <Card key={day.dayKey ?? day.day}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${day.type === 'rest' ? 'bg-ink-800 text-fg-faint' : 'bg-accent-grad text-white'}`}>
                    {day.type === 'rest' ? <IconCalendar width={16} height={16} /> : <IconDumbbell width={16} height={16} />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-fg">Day {day.day} · {day.title} {day.type === 'rest' && <Pill>Rest</Pill>}</p>
                    <p className="text-xs text-fg-faint">{day.focus || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button className="rounded-lg p-1.5 text-fg-faint hover:bg-ink-750 hover:text-fg" title="Edit day" onClick={() => setDayModal({ open: true, day })}><IconEdit width={15} height={15} /></button>
                  <button className="rounded-lg p-1.5 text-fg-faint hover:bg-bad/15 hover:text-bad" title="Delete day"
                    onClick={() => { if (day.dayKey && confirm(`Delete "${day.title}"? Its exercises are removed (logged ones are kept for history).`)) run(() => api.deleteDay(active.id, day.dayKey as string)); }}>
                    <IconTrash width={15} height={15} />
                  </button>
                </div>
              </div>

              {day.type === 'train' && day.dayKey && (
                <>
                  <div className="space-y-2">
                    {exercisesForDay(day.dayKey).map((ex) => (
                      <div key={ex.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-hair bg-ink-900/40 px-3 py-2">
                        <div>
                          <span className="text-sm font-medium text-fg">{ex.name}</span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-fg-faint">
                            <span className="chip">{ex.primaryMuscle}</span>
                            {ex.secondaryMuscles.map((m) => <span key={m} className="chip opacity-60">{m}</span>)}
                            <span>· {ex.targetSets} × {ex.repRange[0]}–{ex.repRange[1]}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button className="rounded-lg p-1.5 text-fg-faint hover:bg-ink-750 hover:text-fg" title="Edit" onClick={() => setExModal({ open: true, dayKey: day.dayKey as string, ex })}><IconEdit width={15} height={15} /></button>
                          <button className="rounded-lg p-1.5 text-fg-faint hover:bg-bad/15 hover:text-bad" title="Delete" onClick={() => run(() => api.deleteExercise(ex.id))}><IconTrash width={15} height={15} /></button>
                        </div>
                      </div>
                    ))}
                    {exercisesForDay(day.dayKey).length === 0 && <p className="text-xs text-fg-faint">No exercises yet.</p>}
                  </div>
                  <button className="btn-ghost mt-3" disabled={busy} onClick={() => setExModal({ open: true, dayKey: day.dayKey as string, ex: null })}>
                    <IconPlus width={15} height={15} /> Add exercise
                  </button>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Custom muscles */}
      <Card className="mt-6">
        <CardTitle title="Custom muscles" subtitle="Add your own muscle groups (on top of the built-in 12)" icon={<IconMuscle width={16} height={16} />} />
        <div className="mb-3 flex flex-wrap gap-1.5">
          {config.muscleGroups.map((m) => {
            const c = custom.find((x) => x.name === m);
            return (
              <span key={m} className={`chip ${c ? 'border-accent/30 text-accent-soft' : ''}`}>
                {m}
                {c && <button className="ml-1 text-fg-faint hover:text-bad" title="Remove custom muscle" onClick={() => run(async () => { await api.deleteCustomMuscle(c.id); loadCustom(); })}>×</button>}
              </span>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input className="field !w-auto flex-1 sm:flex-none sm:min-w-[220px]" value={newMuscle} onChange={(e) => setNewMuscle(e.target.value)} placeholder="e.g. Forearms, Neck" />
          <button className="btn-primary" disabled={busy || !newMuscle.trim()}
            onClick={() => run(async () => { await api.addCustomMuscle(newMuscle.trim()); setNewMuscle(''); loadCustom(); })}>
            <IconPlus width={15} height={15} /> Add
          </button>
        </div>
      </Card>

      {/* Modals */}
      <DayModal
        open={dayModal.open}
        onClose={() => setDayModal({ open: false, day: null })}
        initial={dayModal.day}
        onSave={async (v) => {
          if (!active) return;
          if (dayModal.day?.dayKey) await run(() => api.updateDay(active.id, dayModal.day!.dayKey as string, v));
          else await run(() => api.addDay(active.id, v));
        }}
      />
      <ExerciseModal
        open={exModal.open}
        onClose={() => setExModal({ open: false, dayKey: '', ex: null })}
        initial={exModal.ex}
        muscleOptions={muscleOptions}
        onSave={async (v) => {
          if (!active) return;
          if (exModal.ex) await run(() => api.updateExercise(exModal.ex!.id, v));
          else await run(() => api.addExercise(active.id, { ...v, scheduleDayId: exModal.dayKey }));
        }}
      />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} currentJson={() => currentPhaseToJson(config)} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} json={currentPhaseToJson(config)} name={config.program.name} />

      <p className="mt-6 text-center text-[11px] text-fg-faint">
        Changes apply to the active phase and update the whole app. Deleting an exercise you've already logged keeps its history in Progression.
      </p>
    </>
  );
}
