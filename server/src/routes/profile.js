import express from 'express';
import { getStore } from '../storage/index.js';

export const profileRouter = express.Router();

profileRouter.get('/', async (_req, res, next) => {
  try {
    const store = await getStore();
    res.json(await store.getSingleton('profile'));
  } catch (err) {
    next(err);
  }
});

profileRouter.put('/', async (req, res, next) => {
  try {
    const store = await getStore();
    const patch = { ...req.body };
    // Coerce known numeric fields.
    for (const k of [
      'age', 'height', 'currentWeight', 'goalWeight',
      'currentWaist', 'goalWaist', 'bodyFat', 'goalBodyFat',
    ]) {
      if (patch[k] !== undefined) patch[k] = Number(patch[k]);
    }
    res.json(await store.setSingleton('profile', patch));
  } catch (err) {
    next(err);
  }
});
