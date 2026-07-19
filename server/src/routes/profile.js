import express from 'express';
import { getStore } from '../storage/index.js';

export const profileRouter = express.Router();

const NUMERIC = [
  'age', 'height', 'currentWeight', 'goalWeight',
  'currentWaist', 'goalWaist', 'bodyFat', 'goalBodyFat',
];

profileRouter.get('/', async (req, res, next) => {
  try {
    const store = await getStore();
    const profile = await store.findOne('profiles', { userId: req.userId });
    res.json(profile || {});
  } catch (err) {
    next(err);
  }
});

profileRouter.put('/', async (req, res, next) => {
  try {
    const store = await getStore();
    const patch = { ...req.body };
    delete patch.id;
    delete patch.userId;
    for (const k of NUMERIC) if (patch[k] !== undefined) patch[k] = Number(patch[k]);
    const saved = await store.upsert('profiles', { userId: req.userId }, patch);
    res.json(saved);
  } catch (err) {
    next(err);
  }
});
