import express from 'express';
import { getStore } from '../storage/index.js';

/**
 * Generic REST router for a JSON collection.
 *
 *   GET    /            list all
 *   POST   /            create (id auto-assigned)
 *   PUT    /:id         patch
 *   DELETE /:id         remove
 *
 * `normalize(body)` cleans/derives fields before persisting (e.g. computing
 * workout volume). It runs on both create and update.
 */
export function collectionRouter(collection, normalize = (x) => x) {
  const router = express.Router();

  router.get('/', async (_req, res, next) => {
    try {
      const store = await getStore();
      res.json(await store.list(collection));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const store = await getStore();
      const created = await store.insert(collection, normalize(req.body));
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const store = await getStore();
      const updated = await store.update(collection, req.params.id, normalize(req.body));
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const store = await getStore();
      const ok = await store.remove(collection, req.params.id);
      if (!ok) return res.status(404).json({ error: 'Not found' });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

// ── field normalizers ───────────────────────────────────────────────────────
const num = (v) => (v === undefined || v === null || v === '' ? 0 : Number(v));

export function normalizeWorkout(body) {
  const weight = num(body.weight);
  const reps = num(body.reps);
  const sets = num(body.sets);
  return {
    exerciseId: String(body.exerciseId || ''),
    date: String(body.date || '').slice(0, 10),
    weight,
    reps,
    sets,
    volume: weight * reps * sets,
    notes: body.notes ? String(body.notes) : '',
  };
}

export function normalizeMeasurement(body) {
  return {
    date: String(body.date || '').slice(0, 10),
    weight: num(body.weight),
    waist: num(body.waist),
    neck: num(body.neck),
    chest: num(body.chest),
    arms: num(body.arms),
    thighs: num(body.thighs),
    bodyFat: num(body.bodyFat),
  };
}

export function normalizePhysique(body) {
  const ratings = {};
  for (const [k, v] of Object.entries(body.ratings || {})) {
    ratings[k] = Math.max(0, Math.min(10, num(v)));
  }
  return { date: String(body.date || '').slice(0, 10), ratings };
}

export function normalizePhoto(body) {
  return {
    month: num(body.month),
    view: String(body.view || 'front'),
    date: String(body.date || '').slice(0, 10),
    dataUrl: String(body.dataUrl || ''),
    caption: body.caption ? String(body.caption) : '',
  };
}

export function normalizeRest(body) {
  return {
    date: String(body.date || '').slice(0, 10),
    day: num(body.day), // schedule day number (e.g. 4 or 7)
    minutes: num(body.minutes),
    activities: Array.isArray(body.activities) ? body.activities.map(String) : [],
    notes: body.notes ? String(body.notes) : '',
  };
}
