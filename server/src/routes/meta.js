import express from 'express';
import { getStore } from '../storage/index.js';
import { EXERCISES, PROGRAM, SCHEDULE, TRAINING_DAYS } from '../domain/exercises.js';
import { MUSCLE_GROUPS, PHYSIQUE_MUSCLES, SECONDARY_VOLUME_WEIGHT } from '../domain/muscles.js';

export const metaRouter = express.Router();

// Program/muscle config. NOTE (Phase 1): still the shared static program — in
// Phase 2 this is replaced by the signed-in user's own editable program.
const appConfig = () => ({
  exercises: EXERCISES,
  trainingDays: TRAINING_DAYS,
  schedule: SCHEDULE,
  muscleGroups: MUSCLE_GROUPS,
  physiqueMuscles: PHYSIQUE_MUSCLES,
  secondaryVolumeWeight: SECONDARY_VOLUME_WEIGHT,
  program: PROGRAM,
});

metaRouter.get('/config', (_req, res) => res.json(appConfig()));

// One-shot bootstrap: everything the SPA needs on load, scoped to the user.
metaRouter.get('/bootstrap', async (req, res, next) => {
  try {
    const store = await getStore();
    const scope = { userId: req.userId };
    const [profile, measurements, workouts, physiqueRatings, photos, restLogs] = await Promise.all([
      store.findOne('profiles', scope),
      store.list('measurements', scope),
      store.list('workouts', scope),
      store.list('physiqueRatings', scope),
      store.list('photos', scope),
      store.list('restLogs', scope),
    ]);
    res.json({
      config: appConfig(),
      profile: profile || {},
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

// Full export of the signed-in user's data.
metaRouter.get('/export', async (req, res, next) => {
  try {
    const store = await getStore();
    const scope = { userId: req.userId };
    const [profile, measurements, workouts, physiqueRatings, photos, restLogs] = await Promise.all([
      store.findOne('profiles', scope),
      store.list('measurements', scope),
      store.list('workouts', scope),
      store.list('physiqueRatings', scope),
      store.list('photos', scope),
      store.list('restLogs', scope),
    ]);
    res.json({
      profile: profile || {},
      measurements,
      workouts,
      muscleVolumes: [], // derived client-side; included for schema completeness
      physiqueRatings,
      photos,
      restLogs,
      exportedAt: new Date().toISOString(),
      program: PROGRAM.name,
    });
  } catch (err) {
    next(err);
  }
});

metaRouter.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'rrpt-server' }),
);
