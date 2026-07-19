import express from 'express';
import { getStore } from '../storage/index.js';
import { PROGRAM } from '../domain/exercises.js';
import { loadProgramState } from '../services/programs.js';

export const metaRouter = express.Router();

// One-shot bootstrap: the user's active program (as `config`) + all their data.
metaRouter.get('/bootstrap', async (req, res, next) => {
  try {
    const store = await getStore();
    const scope = { userId: req.userId };
    const [{ config, programs, activeProgramId }, profile, measurements, workouts, physiqueRatings, photos, restLogs] =
      await Promise.all([
        loadProgramState(store, req.userId),
        store.findOne('profiles', scope),
        store.list('measurements', scope),
        store.list('workouts', scope),
        store.list('physiqueRatings', scope),
        store.list('photos', scope),
        store.list('restLogs', scope),
      ]);
    res.json({
      config,
      programs,
      activeProgramId,
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
