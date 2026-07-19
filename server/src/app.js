import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import { config } from './config.js';
import { authenticate } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { metaRouter } from './routes/meta.js';
import { profileRouter } from './routes/profile.js';
import {
  collectionRouter,
  normalizeWorkout,
  normalizeMeasurement,
  normalizePhysique,
  normalizePhoto,
  normalizeRest,
} from './routes/collectionRouter.js';

export function createApp() {
  const app = express();

  app.use(cors());
  // Progress photos are stored as base64 data URLs → allow a generous body size.
  app.use(express.json({ limit: '25mb' }));

  // JWT gate: SPA shell + /api/health + /api/auth/{login,register} stay open;
  // every other /api route requires a valid token and is scoped to req.userId.
  app.use(authenticate);
  app.use('/api/auth', authRouter);

  // ── API (all scoped to the authenticated user) ─────────────────────────────
  app.use('/api', metaRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/measurements', collectionRouter('measurements', normalizeMeasurement));
  app.use('/api/workouts', collectionRouter('workouts', normalizeWorkout));
  app.use('/api/physique', collectionRouter('physiqueRatings', normalizePhysique));
  app.use('/api/photos', collectionRouter('photos', normalizePhoto));
  app.use('/api/rest', collectionRouter('restLogs', normalizeRest));

  // ── Static client (production single-process mode) ─────────────────────────
  if (fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(`${config.clientDist}/index.html`);
    });
  }

  // ── Error handler ──────────────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error('[api error]', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
