import express from 'express';
import crypto from 'node:crypto';
import { getStore } from '../storage/index.js';
import { config } from '../config.js';
import { hashPassword, verifyPassword, signJwt } from '../middleware/auth.js';
import { importProgram, seedTemplateProgram } from '../services/programs.js';
import { PHASE0_TEMPLATE } from '../domain/phase0.js';

export const authRouter = express.Router();

const DAY_MS = 86_400_000;
const iso = (d) => d.toISOString().slice(0, 10);
const publicUser = (u) => ({ id: u.id, email: u.email, displayName: u.displayName });

// Collections wiped when an account is deleted.
const USER_COLLECTIONS = [
  'profiles', 'programs', 'scheduleDays', 'exercises', 'customMuscles',
  'workouts', 'measurements', 'physiqueRatings', 'photos', 'restLogs',
];

async function seedNewUser(store, userId, displayName) {
  const today = new Date();
  const startDate = iso(today);
  const targetDate = iso(new Date(today.getTime() + 112 * DAY_MS));
  await store.insert('profiles', {
    userId,
    name: displayName,
    age: 0,
    height: 0,
    currentWeight: 0,
    goalWeight: 0,
    currentWaist: 0,
    goalWaist: 0,
    startDate,
    targetDate,
    bodyFat: 0,
    goalBodyFat: 0,
    units: 'metric',
  });
  // New accounts get BOTH programs: the beginner "Phase 0" on-ramp (order 0) and
  // the full Phase 1 program (order 1). Phase 0 is imported first with
  // activate:true, so it becomes the active/default program (and sets
  // activeProgramId); Phase 1 is seeded inactive as the next phase to graduate to.
  await importProgram(store, userId, PHASE0_TEMPLATE, { activate: true });
  await seedTemplateProgram(store, userId, {
    slugExerciseIds: false,
    isActive: false,
    order: 1,
    startDate,
    targetDate,
  });
}

// POST /api/auth/register  { email, password, name }
authRouter.post('/register', async (req, res, next) => {
  try {
    if (!config.allowRegistration) return res.status(403).json({ error: 'Registration is closed.' });
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const displayName = String(req.body?.name || '').trim() || email.split('@')[0];

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const store = await getStore();
    const existing = await store.findOne('users', { email });
    if (existing) return res.status(409).json({ error: 'An account with that email already exists.' });

    const user = await store.insert('users', {
      id: crypto.randomUUID(),
      email,
      displayName,
      passwordHash: hashPassword(password),
      activeProgramId: null,
      createdAt: new Date().toISOString(),
    });
    await seedNewUser(store, user.id, displayName);

    const token = signJwt({ sub: user.id, email: user.email });
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login  { email, password }
authRouter.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const store = await getStore();
    const user = await store.findOne('users', { email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = signJwt({ sub: user.id, email: user.email });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRouter.get('/me', async (req, res, next) => {
  try {
    const store = await getStore();
    const user = await store.findOne('users', { id: req.userId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/password  { currentPassword, newPassword }
authRouter.patch('/password', async (req, res, next) => {
  try {
    const store = await getStore();
    const user = await store.findOne('users', { id: req.userId });
    if (!user || !verifyPassword(String(req.body?.currentPassword || ''), user.passwordHash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    await store.update('users', { id: req.userId }, { passwordHash: hashPassword(newPassword) });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/account  — removes the account and all its data
authRouter.delete('/account', async (req, res, next) => {
  try {
    const store = await getStore();
    for (const c of USER_COLLECTIONS) await store.removeMany(c, { userId: req.userId });
    await store.remove('users', { id: req.userId });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});
