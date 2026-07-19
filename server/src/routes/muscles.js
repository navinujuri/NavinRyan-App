import express from 'express';
import { getStore } from '../storage/index.js';
import { MUSCLE_GROUPS, PHYSIQUE_MUSCLES } from '../domain/muscles.js';

export const musclesRouter = express.Router();

// GET /api/muscles → fixed taxonomy + this user's custom muscles.
musclesRouter.get('/', async (req, res, next) => {
  try {
    const store = await getStore();
    const custom = await store.list('customMuscles', { userId: req.userId });
    res.json({
      fixed: MUSCLE_GROUPS,
      physique: PHYSIQUE_MUSCLES,
      custom,
      all: [...MUSCLE_GROUPS, ...custom.map((m) => m.name)],
    });
  } catch (err) { next(err); }
});

// POST /api/muscles/custom { name }
musclesRouter.post('/custom', async (req, res, next) => {
  try {
    const store = await getStore();
    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Name is required.' });
    if (MUSCLE_GROUPS.includes(name)) return res.status(409).json({ error: 'That muscle already exists.' });
    const existing = await store.findOne('customMuscles', { userId: req.userId, name });
    if (existing) return res.status(409).json({ error: 'That muscle already exists.' });
    const created = await store.insert('customMuscles', { userId: req.userId, name });
    res.status(201).json(created);
  } catch (err) { next(err); }
});

musclesRouter.delete('/custom/:id', async (req, res, next) => {
  try {
    const store = await getStore();
    const ok = await store.remove('customMuscles', { id: req.params.id, userId: req.userId });
    if (!ok) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
});
