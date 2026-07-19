import crypto from 'node:crypto';
import { EXERCISES, SCHEDULE, PROGRAM } from '../domain/exercises.js';
import { MUSCLE_GROUPS, PHYSIQUE_MUSCLES, SECONDARY_VOLUME_WEIGHT } from '../domain/muscles.js';

/**
 * Seed the built-in Ryan Reynolds template as a program for a user.
 *
 * `slugExerciseIds` — on a user's FIRST program the exercise ids are the
 * template slugs (e.g. "assisted-pull-up"), so any pre-existing workout logs
 * that reference those slugs keep resolving with no remapping. Additional
 * programs a user clones later use fresh UUIDs (avoids id collisions).
 */
export async function seedTemplateProgram(store, userId, {
  slugExerciseIds = true,
  isActive = true,
  startDate = null,
  targetDate = null,
  order = 0,
} = {}) {
  const programId = crypto.randomUUID();
  await store.insert('programs', {
    id: programId,
    userId,
    name: PROGRAM.name,
    durationWeeks: PROGRAM.durationWeeks,
    deloadWeek: PROGRAM.deloadWeek,
    priorities: PROGRAM.priorities,
    nonNegotiables: PROGRAM.nonNegotiables,
    startDate,
    targetDate,
    isActive,
    order,
    createdAt: new Date().toISOString(),
  });

  const dayIdByKey = {};
  for (const s of SCHEDULE) {
    const dayId = crypto.randomUUID();
    dayIdByKey[s.dayKey ?? `rest-${s.day}`] = dayId;
    await store.insert('scheduleDays', {
      id: dayId,
      userId,
      programId,
      day: s.day,
      type: s.type,
      title: s.title,
      focus: s.focus,
      order: s.day,
    });
  }

  for (const e of EXERCISES) {
    await store.insert('exercises', {
      id: slugExerciseIds ? e.id : crypto.randomUUID(),
      userId,
      programId,
      scheduleDayId: dayIdByKey[e.day],
      name: e.name,
      order: e.order,
      cue: e.cue,
      primaryMuscle: e.primaryMuscle,
      secondaryMuscles: e.secondaryMuscles,
      targetSets: e.targetSets,
      repMin: e.repRange[0],
      repMax: e.repRange[1],
      active: true,
    });
  }
  return programId;
}

// Parse a variety of rep formats into [min, max].
function parseReps(e) {
  if (e.repMin !== undefined || e.repMax !== undefined) {
    const lo = Number(e.repMin) || 0;
    const hi = Number(e.repMax) || lo || 0;
    return [lo, hi];
  }
  const r = e.reps ?? e.repRange;
  if (Array.isArray(r)) return [Number(r[0]) || 0, Number(r[1]) || Number(r[0]) || 0];
  if (typeof r === 'number') return [r, r];
  if (typeof r === 'string') {
    const m = r.match(/(\d+)\s*(?:[-–]|to)\s*(\d+)/);
    if (m) return [Number(m[1]), Number(m[2])];
    const single = Number(r.trim());
    if (!Number.isNaN(single)) return [single, single];
  }
  return [8, 12];
}

/**
 * Bulk-import a whole phase from a JSON spec (days + their exercises), creating
 * the program, schedule days, exercises, and auto-adding any referenced muscle
 * that isn't already known (as a custom muscle). Optionally activates it.
 *
 * Spec shape:
 *   { name?, durationWeeks?, deloadWeek?, priorities?[], nonNegotiables?[],
 *     days: [ { title, focus?, type?('train'|'rest'),
 *              exercises?: [ { name, primaryMuscle?, secondaryMuscles?[],
 *                             sets?, repMin?, repMax? | reps?("8-12"), cue? } ] } ] }
 */
export async function importProgram(store, userId, spec, { activate = true } = {}) {
  const existingCustom = (await store.list('customMuscles', { userId })).map((m) => m.name);
  const known = new Set([...MUSCLE_GROUPS, ...existingCustom]);
  const ensureMuscle = async (name) => {
    const n = String(name || '').trim();
    if (!n || known.has(n)) return;
    await store.insert('customMuscles', { userId, name: n });
    known.add(n);
  };

  const order = (await store.list('programs', { userId })).length;
  const programId = crypto.randomUUID();
  await store.insert('programs', {
    id: programId,
    userId,
    name: String(spec.name || 'Imported Phase'),
    durationWeeks: Number(spec.durationWeeks) || 16,
    deloadWeek: Number(spec.deloadWeek) || 9,
    priorities: Array.isArray(spec.priorities) ? spec.priorities.map(String) : [],
    nonNegotiables: Array.isArray(spec.nonNegotiables) ? spec.nonNegotiables.map(String) : [],
    startDate: null,
    targetDate: null,
    isActive: false,
    order,
    createdAt: new Date().toISOString(),
  });

  const days = Array.isArray(spec.days) ? spec.days : [];
  let dayNum = 0;
  for (const d of days) {
    dayNum += 1;
    const type = d.type === 'rest' ? 'rest' : 'train';
    const dayId = crypto.randomUUID();
    await store.insert('scheduleDays', {
      id: dayId,
      userId,
      programId,
      day: dayNum,
      order: dayNum,
      type,
      title: String(d.title || (type === 'rest' ? 'Rest' : `Day ${dayNum}`)),
      focus: String(d.focus || ''),
    });
    const exs = Array.isArray(d.exercises) ? d.exercises : [];
    let exOrder = 0;
    for (const e of exs) {
      exOrder += 1;
      const [repMin, repMax] = parseReps(e);
      await ensureMuscle(e.primaryMuscle);
      const secondary = Array.isArray(e.secondaryMuscles) ? e.secondaryMuscles.map(String) : [];
      for (const m of secondary) await ensureMuscle(m);
      await store.insert('exercises', {
        userId,
        programId,
        scheduleDayId: dayId,
        name: String(e.name || 'Exercise'),
        order: exOrder,
        cue: String(e.cue || ''),
        primaryMuscle: String(e.primaryMuscle || ''),
        secondaryMuscles: secondary,
        targetSets: Number(e.sets ?? e.targetSets) || 3,
        repMin,
        repMax,
        active: true,
      });
    }
  }

  if (activate) {
    const all = await store.list('programs', { userId });
    for (const p of all) await store.update('programs', { id: p.id, userId }, { isActive: p.id === programId });
    await store.update('users', { id: userId }, { activeProgramId: programId });
  }
  return programId;
}

/** Create an empty program (no days/exercises) for the user to build up. */
export async function createEmptyProgram(store, userId, name, order = 0) {
  const programId = crypto.randomUUID();
  await store.insert('programs', {
    id: programId,
    userId,
    name: name || 'New Program',
    durationWeeks: 16,
    deloadWeek: 9,
    priorities: [],
    nonNegotiables: [],
    startDate: null,
    targetDate: null,
    isActive: false,
    order,
    createdAt: new Date().toISOString(),
  });
  return programId;
}

/** Shape a user's active program into the `config` the SPA already consumes. */
export async function loadProgramState(store, userId) {
  const [user, programs, customMuscleDocs] = await Promise.all([
    store.findOne('users', { id: userId }),
    store.list('programs', { userId }),
    store.list('customMuscles', { userId }),
  ]);
  const customMuscles = customMuscleDocs.map((m) => m.name);
  const muscleGroups = [...MUSCLE_GROUPS, ...customMuscles];

  const active =
    programs.find((p) => p.id === user?.activeProgramId) ||
    programs.find((p) => p.isActive) ||
    programs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0] ||
    null;

  const baseConfig = {
    exercises: [],
    schedule: [],
    trainingDays: [],
    muscleGroups,
    physiqueMuscles: PHYSIQUE_MUSCLES,
    secondaryVolumeWeight: SECONDARY_VOLUME_WEIGHT,
    program: { name: '', durationWeeks: 16, deloadWeek: 9, priorities: [], nonNegotiables: [] },
  };

  if (!active) {
    return { config: baseConfig, programs, activeProgramId: null };
  }

  const [days, exercises] = await Promise.all([
    store.list('scheduleDays', { userId, programId: active.id }),
    store.list('exercises', { userId, programId: active.id }),
  ]);
  days.sort((a, b) => a.day - b.day);
  exercises.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const schedule = days.map((d) => ({
    day: d.day,
    dayKey: d.id, // the schedule-day id doubles as the SPA's opaque "dayKey"
    type: d.type,
    title: d.title,
    focus: d.focus,
  }));

  const shapedExercises = exercises.map((e) => ({
    id: e.id,
    name: e.name,
    day: e.scheduleDayId,
    order: e.order,
    cue: e.cue || '',
    primaryMuscle: e.primaryMuscle,
    secondaryMuscles: e.secondaryMuscles || [],
    targetSets: e.targetSets,
    repRange: [e.repMin, e.repMax],
    active: e.active !== false,
  }));

  const trainingDays = schedule
    .filter((s) => s.type === 'train')
    .map((s) => ({ key: s.dayKey, label: s.title, focus: s.focus }));

  return {
    config: {
      ...baseConfig,
      exercises: shapedExercises,
      schedule,
      trainingDays,
      program: {
        name: active.name,
        durationWeeks: active.durationWeeks,
        deloadWeek: active.deloadWeek,
        priorities: active.priorities || [],
        nonNegotiables: active.nonNegotiables || [],
      },
    },
    programs,
    activeProgramId: active.id,
  };
}
