/**
 * One-time migration: single-user data  →  a multi-user account (v2 cutover).
 *
 *   MIGRATE_EMAIL=you@example.com MIGRATE_PASSWORD=yourpass \
 *     node --env-file-if-exists=.env server/scripts/migrate-to-multiuser.mjs
 *
 * Idempotent — aborts if any users already exist. Fully NON-DESTRUCTIVE:
 *   1. Creates a user from MIGRATE_EMAIL / MIGRATE_PASSWORD.
 *   2. Copies the old singleton `profile` → `profiles` (old collection kept).
 *   3. Backfills `userId` on existing workouts/measurements/etc. (additive $set).
 *   4. Seeds the RR template as the user's first program with EXERCISE IDS =
 *      the original slugs. Because existing workout logs reference those same
 *      slugs, they keep resolving with NO remapping — nothing is rewritten.
 */
import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';
import { hashPassword } from '../src/middleware/auth.js';
import { seedTemplateProgram } from '../src/services/programs.js';

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME || 'rr_physique_tracker';
const email = String(process.env.MIGRATE_EMAIL || '').trim().toLowerCase();
const password = String(process.env.MIGRATE_PASSWORD || '');

if (!uri) throw new Error('MONGO_URI is required');
if (!email || password.length < 6) throw new Error('MIGRATE_EMAIL and MIGRATE_PASSWORD (6+ chars) are required');

const DATA_COLLECTIONS = ['measurements', 'workouts', 'physiqueRatings', 'photos', 'restLogs'];

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
await client.connect();
const db = client.db(dbName);

if ((await db.collection('users').countDocuments()) > 0) {
  console.log('Users already exist — migration already done. Aborting (no changes).');
  await client.close();
  process.exit(0);
}

// Minimal store adapter over raw Mongo so we can reuse seedTemplateProgram().
const store = {
  insert: async (c, doc) => {
    const rec = { id: doc.id || crypto.randomUUID(), ...doc };
    await db.collection(c).insertOne({ ...rec });
    return rec;
  },
  update: async (c, filter, patch) => {
    await db.collection(c).updateOne(filter, { $set: patch });
    return true;
  },
};

const userId = crypto.randomUUID();
await db.collection('users').insertOne({
  id: userId,
  email,
  displayName: email.split('@')[0],
  passwordHash: hashPassword(password),
  activeProgramId: null,
  createdAt: new Date().toISOString(),
});
console.log(`Created user ${email} (${userId})`);

// Old singleton profile → profiles (keep the old doc as a backup).
const oldProfile = await db.collection('profile').findOne({ _id: 'profile' });
if (oldProfile) {
  const { _id, ...rest } = oldProfile;
  await db.collection('profiles').insertOne({ id: crypto.randomUUID(), userId, ...rest });
  console.log('Copied profile → profiles');
}

// Backfill userId on all existing data (additive; only where missing).
for (const c of DATA_COLLECTIONS) {
  const r = await db.collection(c).updateMany({ userId: { $exists: false } }, { $set: { userId } });
  console.log(`Backfilled userId on ${c}: ${r.modifiedCount}`);
}

// Seed the template as the user's first program with SLUG exercise ids so the
// backfilled workout logs (which use those slugs) resolve without remapping.
const programId = await seedTemplateProgram(store, userId, {
  slugExerciseIds: true,
  startDate: oldProfile?.startDate || null,
  targetDate: oldProfile?.targetDate || null,
});
await db.collection('users').updateOne({ id: userId }, { $set: { activeProgramId: programId } });
console.log(`Seeded program ${programId} (exercise ids = slugs → logs preserved)`);

console.log('\nMigration complete. Log in with your MIGRATE_EMAIL / MIGRATE_PASSWORD.');
await client.close();
