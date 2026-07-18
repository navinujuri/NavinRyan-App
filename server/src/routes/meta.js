import express from 'express';
import { getStore } from '../storage/index.js';
import { EXERCISES, PROGRAM, SCHEDULE, TRAINING_DAYS } from '../domain/exercises.js';
import { MUSCLE_GROUPS, PHYSIQUE_MUSCLES, SECONDARY_VOLUME_WEIGHT } from '../domain/muscles.js';
import { buildSeed } from '../data/seed.js';
import { authEnabled } from '../middleware/auth.js';

export const metaRouter = express.Router();

// The static domain config the client needs to render the program & muscle map.
const appConfig = () => ({
  exercises: EXERCISES,
  trainingDays: TRAINING_DAYS,
  schedule: SCHEDULE,
  muscleGroups: MUSCLE_GROUPS,
  physiqueMuscles: PHYSIQUE_MUSCLES,
  secondaryVolumeWeight: SECONDARY_VOLUME_WEIGHT,
  program: PROGRAM,
});

// Static domain config the client needs to render the program & muscle map.
metaRouter.get('/config', (_req, res) => {
  res.json(appConfig());
});

// One-shot bootstrap: everything the SPA needs on load.
metaRouter.get('/bootstrap', async (_req, res, next) => {
  try {
    const store = await getStore();
    const [profile, measurements, workouts, physiqueRatings, photos, restLogs] = await Promise.all([
      store.getSingleton('profile'),
      store.list('measurements'),
      store.list('workouts'),
      store.list('physiqueRatings'),
      store.list('photos'),
      store.list('restLogs'),
    ]);
    res.json({
      config: appConfig(),
      profile,
      measurements,
      workouts,
      physiqueRatings,
      photos,
      restLogs,
    });
  } catch (err) {
    next(err);
  }
});

// Full database dump (used by the Export feature).
metaRouter.get('/export', async (_req, res, next) => {
  try {
    const store = await getStore();
    const db = await store.dump();
    res.json({
      profile: db.profile,
      measurements: db.measurements,
      workouts: db.workouts,
      muscleVolumes: [], // derived client-side; included for schema completeness
      physiqueRatings: db.physiqueRatings,
      photos: db.photos,
      restLogs: db.restLogs || [],
      exportedAt: new Date().toISOString(),
      program: PROGRAM.name,
    });
  } catch (err) {
    next(err);
  }
});

// Reset to the demo seed (handy while exploring).
metaRouter.post('/reset', async (_req, res, next) => {
  try {
    const store = await getStore();
    await store.reset(buildSeed);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

metaRouter.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'rrpt-server', authRequired: authEnabled() }),
);
