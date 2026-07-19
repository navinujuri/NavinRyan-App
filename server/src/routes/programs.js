import express from 'express';
import { getStore } from '../storage/index.js';
import { seedTemplateProgram, createEmptyProgram } from '../services/programs.js';

const num = (v, d = 0) => (v === undefined || v === null || v === '' ? d : Number(v));

// Verify a program belongs to the caller; returns it or null.
async function ownedProgram(store, userId, programId) {
  return store.findOne('programs', { id: programId, userId });
}

// ── /api/programs ────────────────────────────────────────────────────────────
export const programsRouter = express.Router();

programsRouter.get('/', async (req, res, next) => {
  try {
    const store = await getStore();
    const programs = await store.list('programs', { userId: req.userId });
    res.json(programs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
  } catch (err) { next(err); }
});

// Create a program — empty, or a clone of the built-in template (UUID ids).
programsRouter.post('/', async (req, res, next) => {
  try {
    const store = await getStore();
    const existing = await store.list('programs', { userId: req.userId });
    const order = existing.length;
    const id = req.body?.clone
      ? await seedTemplateProgram(store, req.userId, { slugExerciseIds: false, isActive: false, order })
      : await createEmptyProgram(store, req.userId, String(req.body?.name || 'New Program'), order);
    if (req.body?.name && req.body?.clone) {
      await store.update('programs', { id, userId: req.userId }, { name: String(req.body.name) });
    }
    res.status(201).json(await store.findOne('programs', { id, userId: req.userId }));
  } catch (err) { next(err); }
});

programsRouter.patch('/:id', async (req, res, next) => {
  try {
    const store = await getStore();
    const patch = {};
    for (const k of ['name', 'startDate', 'targetDate']) if (req.body[k] !== undefined) patch[k] = String(req.body[k]);
    for (const k of ['durationWeeks', 'deloadWeek']) if (req.body[k] !== undefined) patch[k] = num(req.body[k]);
    for (const k of ['priorities', 'nonNegotiables']) if (Array.isArray(req.body[k])) patch[k] = req.body[k].map(String);
    const updated = await store.update('programs', { id: req.params.id, userId: req.userId }, patch);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { next(err); }
});

programsRouter.delete('/:id', async (req, res, next) => {
  try {
    const store = await getStore();
    const program = await ownedProgram(store, req.userId, req.params.id);
    if (!program) return res.status(404).json({ error: 'Not found' });
    await store.removeMany('exercises', { userId: req.userId, programId: program.id });
    await store.removeMany('scheduleDays', { userId: req.userId, programId: program.id });
    await store.remove('programs', { id: program.id, userId: req.userId });
    // If it was active, promote another program.
    const user = await store.findOne('users', { id: req.userId });
    if (user?.activeProgramId === program.id) {
      const remaining = await store.list('programs', { userId: req.userId });
      await store.update('users', { id: req.userId }, { activeProgramId: remaining[0]?.id ?? null });
    }
    res.status(204).end();
  } catch (err) { next(err); }
});

programsRouter.post('/:id/activate', async (req, res, next) => {
  try {
    const store = await getStore();
    const program = await ownedProgram(store, req.userId, req.params.id);
    if (!program) return res.status(404).json({ error: 'Not found' });
    const all = await store.list('programs', { userId: req.userId });
    for (const p of all) await store.update('programs', { id: p.id, userId: req.userId }, { isActive: p.id === program.id });
    await store.update('users', { id: req.userId }, { activeProgramId: program.id });
    res.json({ ok: true, activeProgramId: program.id });
  } catch (err) { next(err); }
});

// ── Schedule days (nested under a program) ───────────────────────────────────
programsRouter.post('/:id/days', async (req, res, next) => {
  try {
    const store = await getStore();
    const program = await ownedProgram(store, req.userId, req.params.id);
    if (!program) return res.status(404).json({ error: 'Not found' });
    const days = await store.list('scheduleDays', { userId: req.userId, programId: program.id });
    const created = await store.insert('scheduleDays', {
      userId: req.userId,
      programId: program.id,
      day: days.length + 1,
      order: days.length + 1,
      type: req.body?.type === 'rest' ? 'rest' : 'train',
      title: String(req.body?.title || 'New Day'),
      focus: String(req.body?.focus || ''),
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

programsRouter.patch('/:id/days/:dayId', async (req, res, next) => {
  try {
    const store = await getStore();
    const patch = {};
    for (const k of ['title', 'focus']) if (req.body[k] !== undefined) patch[k] = String(req.body[k]);
    if (req.body.type) patch.type = req.body.type === 'rest' ? 'rest' : 'train';
    const updated = await store.update('scheduleDays', { id: req.params.dayId, userId: req.userId, programId: req.params.id }, patch);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { next(err); }
});

programsRouter.delete('/:id/days/:dayId', async (req, res, next) => {
  try {
    const store = await getStore();
    const day = await store.findOne('scheduleDays', { id: req.params.dayId, userId: req.userId, programId: req.params.id });
    if (!day) return res.status(404).json({ error: 'Not found' });
    // Soft-delete the day's exercises that have logs; hard-delete the rest.
    const exs = await store.list('exercises', { userId: req.userId, scheduleDayId: day.id });
    for (const ex of exs) {
      const logged = await store.findOne('workouts', { userId: req.userId, exerciseId: ex.id });
      if (logged) await store.update('exercises', { id: ex.id, userId: req.userId }, { active: false });
      else await store.remove('exercises', { id: ex.id, userId: req.userId });
    }
    await store.remove('scheduleDays', { id: day.id, userId: req.userId });
    res.status(204).end();
  } catch (err) { next(err); }
});

// Reorder days: body { orderedIds: [...] }
programsRouter.put('/:id/days/order', async (req, res, next) => {
  try {
    const store = await getStore();
    const ids = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
    await Promise.all(ids.map((id, i) =>
      store.update('scheduleDays', { id, userId: req.userId, programId: req.params.id }, { day: i + 1, order: i + 1 })));
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Create an exercise within a program/day.
programsRouter.post('/:id/exercises', async (req, res, next) => {
  try {
    const store = await getStore();
    const program = await ownedProgram(store, req.userId, req.params.id);
    if (!program) return res.status(404).json({ error: 'Not found' });
    const siblings = await store.list('exercises', { userId: req.userId, scheduleDayId: String(req.body?.scheduleDayId) });
    const created = await store.insert('exercises', {
      userId: req.userId,
      programId: program.id,
      scheduleDayId: String(req.body?.scheduleDayId || ''),
      name: String(req.body?.name || 'New Exercise'),
      order: siblings.length + 1,
      cue: String(req.body?.cue || ''),
      primaryMuscle: String(req.body?.primaryMuscle || ''),
      secondaryMuscles: Array.isArray(req.body?.secondaryMuscles) ? req.body.secondaryMuscles.map(String) : [],
      targetSets: num(req.body?.targetSets, 3),
      repMin: num(req.body?.repMin, 8),
      repMax: num(req.body?.repMax, 12),
      active: true,
    });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

// ── /api/exercises ───────────────────────────────────────────────────────────
export const exercisesRouter = express.Router();

exercisesRouter.patch('/:id', async (req, res, next) => {
  try {
    const store = await getStore();
    const patch = {};
    for (const k of ['name', 'cue', 'primaryMuscle', 'scheduleDayId']) if (req.body[k] !== undefined) patch[k] = String(req.body[k]);
    if (Array.isArray(req.body.secondaryMuscles)) patch.secondaryMuscles = req.body.secondaryMuscles.map(String);
    for (const k of ['targetSets', 'repMin', 'repMax', 'order']) if (req.body[k] !== undefined) patch[k] = num(req.body[k]);
    const updated = await store.update('exercises', { id: req.params.id, userId: req.userId }, patch);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { next(err); }
});

// Soft-delete if the exercise has logged workouts (keeps history/charts intact);
// otherwise remove it outright.
exercisesRouter.delete('/:id', async (req, res, next) => {
  try {
    const store = await getStore();
    const ex = await store.findOne('exercises', { id: req.params.id, userId: req.userId });
    if (!ex) return res.status(404).json({ error: 'Not found' });
    const logged = await store.findOne('workouts', { userId: req.userId, exerciseId: ex.id });
    if (logged) {
      await store.update('exercises', { id: ex.id, userId: req.userId }, { active: false });
      res.json({ softDeleted: true });
    } else {
      await store.remove('exercises', { id: ex.id, userId: req.userId });
      res.status(204).end();
    }
  } catch (err) { next(err); }
});

exercisesRouter.put('/order', async (req, res, next) => {
  try {
    const store = await getStore();
    const ids = Array.isArray(req.body?.orderedIds) ? req.body.orderedIds : [];
    await Promise.all(ids.map((id, i) => store.update('exercises', { id, userId: req.userId }, { order: i + 1 })));
    res.json({ ok: true });
  } catch (err) { next(err); }
});
