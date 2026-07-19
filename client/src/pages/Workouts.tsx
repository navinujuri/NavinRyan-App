import { useEffect, useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import { sessionsFor } from '../lib/calculations';
import { daysBetween, fmtDate, fmtDateFull, fmtVolume, todayISO } from '../lib/format';
import { Card, PageHeader, Pill } from '../components/ui/primitives';
import { IconCalendar, IconCheck, IconDumbbell, IconFlame, IconTrash } from '../components/ui/icons';
import type { DayKey, ExerciseTemplate, ScheduleEntry, WorkoutLog } from '../types';

// Quick-fill suggestions for the notes field (still fully editable / custom).
const NOTE_PRESETS = ['Repeat same weight', 'Progress weight'] as const;

function ExerciseLogRow({
  exercise,
  date,
}: {
  exercise: ExerciseTemplate;
  date: string;
}) {
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useData();

  const existing = useMemo(
    () => workouts.find((w) => w.exerciseId === exercise.id && w.date === date),
    [workouts, exercise.id, date],
  );

  // Most recent session strictly before the selected date (progression hint).
  const lastSession = useMemo(() => {
    const sessions = sessionsFor(workouts, exercise.id).filter((s) => s.date < date);
    return sessions.at(-1) ?? null;
  }, [workouts, exercise.id, date]);

  const [weight, setWeight] = useState(String(existing?.weight ?? lastSession?.weight ?? ''));
  const [reps, setReps] = useState(String(existing?.reps ?? lastSession?.reps ?? exercise.repRange[1]));
  const [sets, setSets] = useState(String(existing?.sets ?? exercise.targetSets));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [justSaved, setJustSaved] = useState(false);

  const volume = (Number(weight) || 0) * (Number(reps) || 0) * (Number(sets) || 0);

  const save = async () => {
    const payload: Omit<WorkoutLog, 'id' | 'volume'> = {
      exerciseId: exercise.id,
      date,
      weight: Number(weight) || 0,
      reps: Number(reps) || 0,
      sets: Number(sets) || 0,
      notes,
    };
    if (existing) await updateWorkout(existing.id, payload);
    else await addWorkout(payload);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  };

  return (
    <div className={`rounded-xl border p-4 transition ${existing ? 'border-accent/25 bg-accent/[0.04]' : 'border-hair bg-ink-900/40'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-fg">{exercise.name}</span>
            {existing && <Pill tone="good"><IconCheck width={12} height={12} /> Logged</Pill>}
          </div>
          <p className="mt-0.5 text-xs text-fg-faint">
            {exercise.cue} · target {exercise.targetSets} × {exercise.repRange[0]}–{exercise.repRange[1]}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="chip">{exercise.primaryMuscle}</span>
          {exercise.secondaryMuscles.map((m) => (
            <span key={m} className="chip opacity-60">{m}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[repeat(3,minmax(0,1fr))_1.4fr_auto]">
        <div>
          <label className="label">Weight (kg)</label>
          <input className="field" type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">Reps</label>
          <input className="field" type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">Sets</label>
          <input className="field" type="number" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="0" />
        </div>
        <div>
          <label className="label">Notes</label>
          <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Repeat / progress / custom…" />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {NOTE_PRESETS.map((preset) => {
              const active = notes.trim() === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNotes(active ? '' : preset)}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                    active
                      ? 'bg-accent/20 text-accent-soft ring-1 ring-accent/40'
                      : 'bg-ink-750 text-fg-faint hover:text-fg-muted'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-end gap-2">
          <button className={justSaved ? 'btn bg-good/20 text-good' : 'btn-primary'} onClick={save}>
            {justSaved ? <><IconCheck width={16} height={16} /> Saved</> : existing ? 'Update' : 'Log'}
          </button>
          {existing && (
            <button className="btn-ghost !px-2.5" title="Delete entry" onClick={() => deleteWorkout(existing.id)}>
              <IconTrash width={16} height={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <span className="text-fg-faint">
          {lastSession
            ? `Last: ${lastSession.weight}kg × ${lastSession.reps} on ${fmtDate(lastSession.date)}`
            : 'No previous data'}
        </span>
        <span className="font-semibold text-fg-muted">
          Volume <span className="tabular-nums text-fg">{fmtVolume(volume)}</span>
        </span>
      </div>
    </div>
  );
}

function relDate(dateStr: string): string {
  const diff = daysBetween(dateStr, todayISO()); // today − date
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff > 1) return `${diff} days ago`;
  return fmtDate(dateStr);
}

// Rest-day recovery activities the user can tick off.
const REST_ACTIVITIES = ['Walk', 'Mobility', 'Stretching', 'Cardio', 'Sauna', 'Meal prep', 'Recovery'];

function RestDayPanel({ entry, date }: { entry: ScheduleEntry; date: string }) {
  const { restLogs, saveRest, deleteRest } = useData();
  const existing = restLogs.find((r) => r.date === date && r.day === entry.day);

  const defaults = entry.day === 4 ? ['Walk', 'Mobility'] : ['Walk', 'Recovery'];
  const [activities, setActivities] = useState<string[]>(existing?.activities ?? defaults);
  const [minutes, setMinutes] = useState(String(existing?.minutes ?? 30));
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [justSaved, setJustSaved] = useState(false);

  const toggle = (a: string) =>
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const save = async () => {
    await saveRest(
      { date, day: entry.day, minutes: Number(minutes) || 0, activities, notes },
      existing?.id,
    );
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  };

  return (
    <Card className={existing ? 'ring-1 ring-accent/25' : ''}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-800 text-accent-soft ring-1 ring-hair">
            <IconCalendar width={20} height={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-fg">
              Day {entry.day} · Rest Day
              {existing && <Pill tone="good"><IconCheck width={12} height={12} /> Logged</Pill>}
            </p>
            <p className="text-xs text-fg-faint">{fmtDate(date)} · {entry.focus}</p>
          </div>
        </div>
      </div>

      <label className="label">Recovery activities</label>
      <div className="flex flex-wrap gap-1.5">
        {REST_ACTIVITIES.map((a) => {
          const on = activities.includes(a);
          return (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                on ? 'bg-accent/20 text-accent-soft ring-1 ring-accent/40' : 'bg-ink-750 text-fg-faint hover:text-fg-muted'
              }`}
            >
              {a}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
        <div>
          <label className="label">Active minutes</label>
          <input className="field" type="number" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="30" />
        </div>
        <div>
          <label className="label">Notes</label>
          <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How recovery felt, steps, meals…" />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button className={justSaved ? 'btn bg-good/20 text-good' : 'btn-primary'} onClick={save}>
          {justSaved ? <><IconCheck width={16} height={16} /> Saved</> : existing ? 'Update rest day' : 'Log rest day'}
        </button>
        {existing && (
          <button className="btn-ghost !px-2.5" title="Delete rest log" onClick={() => deleteRest(existing.id)}>
            <IconTrash width={16} height={16} />
          </button>
        )}
      </div>
    </Card>
  );
}

export function Workouts() {
  const { config, workouts, restLogs, deleteWorkout, deleteRest } = useData();
  const [date, setDate] = useState(todayISO());
  const [confirmClear, setConfirmClear] = useState(false);

  const exById = useMemo(
    () => Object.fromEntries((config?.exercises ?? []).map((e) => [e.id, e])),
    [config],
  );
  const schedByKey = useMemo(
    () =>
      Object.fromEntries(
        (config?.schedule ?? []).filter((s) => s.dayKey).map((s) => [s.dayKey, s] as const),
      ) as Record<string, ScheduleEntry>,
    [config],
  );
  const trainingOrder = useMemo<DayKey[]>(
    () => (config?.schedule ?? []).filter((s) => s.type === 'train' && s.dayKey).map((s) => s.dayKey as DayKey),
    [config],
  );

  // The most recent logged training session (what was done "last").
  const lastSession = useMemo(() => {
    if (!workouts.length) return null;
    const maxDate = workouts.reduce((m, w) => (w.date > m ? w.date : m), workouts[0].date);
    const rows = workouts.filter((w) => w.date === maxDate);
    const counts: Record<string, number> = {};
    for (const w of rows) {
      const ex = exById[w.exerciseId];
      if (ex) counts[ex.day] = (counts[ex.day] || 0) + 1;
    }
    const dayKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as DayKey | undefined;
    if (!dayKey) return null;
    const items = rows
      .map((w) => ({ w, ex: exById[w.exerciseId] }))
      .filter((x) => x.ex && x.ex.day === dayKey)
      .sort((a, b) => a.ex.order - b.ex.order);
    return { date: maxDate, dayKey, items, volume: items.reduce((s, x) => s + x.w.volume, 0) };
  }, [workouts, exById]);

  // Next training day in the rotation (skips rest days).
  const nextDayKey = useMemo<DayKey>(() => {
    if (!trainingOrder.length) return '';
    if (!lastSession) return trainingOrder[0];
    const idx = trainingOrder.indexOf(lastSession.dayKey);
    return trainingOrder[(idx + 1) % trainingOrder.length];
  }, [trainingOrder, lastSession]);

  // Default the tracker to the next scheduled session (by schedule day number).
  const nextSchedNum = schedByKey[nextDayKey]?.day ?? 1;
  const [selDay, setSelDay] = useState<number>(nextSchedNum);

  // Bind the selected day to whatever is already logged on the chosen date —
  // a training session, or a rest-day log — so past dates snap to their data.
  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const w of workouts) {
      if (w.date !== date) continue;
      const ex = exById[w.exerciseId];
      if (ex) counts[ex.day] = (counts[ex.day] || 0) + 1;
    }
    const dk = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (dk && schedByKey[dk]) {
      setSelDay(schedByKey[dk].day);
      return;
    }
    const rest = restLogs.find((r) => r.date === date);
    if (rest) setSelDay(rest.day);
  }, [date, workouts, restLogs, exById, schedByKey]);

  if (!config) return null;

  const selEntry = config.schedule.find((s) => s.day === selDay) ?? config.schedule[0];
  const isRest = selEntry.type === 'rest';
  const nextSched = schedByKey[nextDayKey];
  const dayExercises = isRest
    ? []
    : config.exercises
        .filter((e) => e.day === selEntry.dayKey && e.active !== false)
        .sort((a, b) => a.order - b.order);

  const loggedToday = workouts.filter((w) => w.date === date);
  const sessionVolume = dayExercises.reduce((sum, ex) => {
    const w = loggedToday.find((l) => l.exerciseId === ex.id);
    return sum + (w?.volume ?? 0);
  }, 0);
  const loggedCount = dayExercises.filter((ex) => loggedToday.some((l) => l.exerciseId === ex.id)).length;

  // Everything logged on this calendar date (any training day + any rest log).
  const dateRest = restLogs.filter((r) => r.date === date);
  const dateEntryCount = loggedToday.length + dateRest.length;

  // Wipe the whole date so it can be re-logged as a different day (two-tap confirm).
  const clearDay = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    await Promise.all([
      ...loggedToday.map((w) => deleteWorkout(w.id)),
      ...dateRest.map((r) => deleteRest(r.id)),
    ]);
    setConfirmClear(false);
  };

  return (
    <>
      <PageHeader
        title="Workout Tracker"
        subtitle="Follow the Day 1–7 schedule. Volume (weight × reps × sets) is calculated automatically."
        actions={
          <div className="flex items-center gap-2">
            {dateEntryCount > 0 && (
              <button
                className={confirmClear ? 'btn-danger' : 'btn-ghost'}
                onClick={clearDay}
                title="Delete everything logged on this date so you can re-log it"
              >
                <IconTrash width={15} height={15} />
                {confirmClear ? 'Confirm — clear day?' : `Clear day (${dateEntryCount})`}
              </button>
            )}
            <label className="label sr-only">Session date</label>
            <input className="field !w-auto" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        }
      />

      {/* Program schedule (Day 1–7, incl. rest days) */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {config.schedule.map((s) => {
          const rest = s.type === 'rest';
          const isSelected = s.day === selDay;
          const isNext = s.dayKey === nextDayKey;
          const isLast = s.dayKey === lastSession?.dayKey;
          return (
            <button
              key={s.day}
              onClick={() => setSelDay(s.day)}
              className={`relative flex flex-col rounded-xl border p-3 text-left transition ${
                isSelected
                  ? 'border-accent/50 bg-accent/10 text-fg'
                  : rest
                    ? 'border-dashed border-hair bg-ink-900/40 text-fg-faint hover:border-hair2 hover:text-fg-muted'
                    : isNext
                      ? 'border-accent/25 bg-ink-850 text-fg-muted ring-1 ring-accent/20 hover:text-fg'
                      : 'border-hair bg-ink-850 text-fg-muted hover:border-hair2 hover:text-fg'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-faint">Day {s.day}</span>
                {isSelected ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                ) : rest ? (
                  <IconCalendar width={13} height={13} />
                ) : isLast ? (
                  <IconCheck width={13} height={13} className="text-good" />
                ) : null}
              </div>
              <span className="mt-1 text-sm font-semibold leading-tight">{s.title}</span>
              <span className="text-[11px] leading-tight text-fg-faint">{s.focus}</span>
              {isNext && !isSelected && (
                <span className="mt-1 inline-block w-fit rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent-soft">
                  Up next
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Last session recap + up-next guidance */}
      {lastSession ? (
        <Card className="mb-5">
          <div className="grid gap-4 md:grid-cols-[1.5fr,1fr]">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-fg-faint">Last session</span>
                <span className="text-xs text-fg-faint">{relDate(lastSession.date)} · {fmtDateFull(lastSession.date)}</span>
              </div>
              <p className="text-sm font-semibold text-fg">
                Day {schedByKey[lastSession.dayKey]?.day} · {schedByKey[lastSession.dayKey]?.title}
                <span className="font-normal text-fg-faint"> — {fmtVolume(lastSession.volume)} volume</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {lastSession.items.map(({ w, ex }) => (
                  <span key={w.id} className="chip">
                    {ex.name} <b className="ml-1 text-fg">{w.weight}×{w.reps}</b>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-xl border border-accent/25 bg-accent/[0.06] p-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-accent-soft">Up next — today</span>
              <p className="mt-1 text-lg font-bold leading-tight text-fg">Day {nextSched?.day} · {nextSched?.title}</p>
              <p className="text-xs text-fg-faint">{nextSched?.focus}</p>
              <button
                className="btn-primary mt-3"
                onClick={() => { setSelDay(nextSchedNum); setDate(todayISO()); }}
              >
                <IconDumbbell width={15} height={15} /> Log this session
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-5">
          <p className="text-sm text-fg-muted">
            No sessions logged yet — start with <span className="font-semibold text-fg">Day 1 · Pull</span> and the schedule
            will guide you to the next session each time.
          </p>
        </Card>
      )}

      {/* Rest day → recovery log; training day → exercise logging */}
      {isRest ? (
        <RestDayPanel key={`rest-${selEntry.day}-${date}`} entry={selEntry} date={date} />
      ) : (
        <>
          <Card className="mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-grad text-white shadow-glow">
                  <IconDumbbell width={20} height={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-fg">Day {selEntry.day} · {selEntry.title} — {selEntry.focus}</p>
                  <p className="text-xs text-fg-faint">{fmtDate(date)} · {dayExercises.length} exercises programmed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={loggedCount === dayExercises.length && loggedCount > 0 ? 'good' : 'default'}>
                  {loggedCount}/{dayExercises.length} logged
                </Pill>
                <Pill tone="accent"><IconFlame width={13} height={13} /> {fmtVolume(sessionVolume)} volume</Pill>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            {dayExercises.map((ex) => (
              <ExerciseLogRow key={`${ex.id}-${date}`} exercise={ex} date={date} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
