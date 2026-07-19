/**
 * One-time migration: single-user data  →  a multi-user account.
 *
 * Run ONCE against the production database when cutting over to Phase 1:
 *   MIGRATE_EMAIL=you@example.com MIGRATE_PASSWORD=yourpass \
 *     node --env-file-if-exists=.env server/scripts/migrate-to-multiuser.mjs
 *
 * It is idempotent — if any users already exist it aborts without changes.
 * What it does:
 *   1. Creates a user from MIGRATE_EMAIL / MIGRATE_PASSWORD.
 *   2. Moves the old singleton `profile` doc → `profiles` (with userId).
 *   3. Backfills `userId` on all existing workouts/measurements/etc.
 * (Programs stay on the shared static template in Phase 1; exercise IDs are the
 * same slugs, so workout logs keep resolving — no remapping needed here.)
 */
import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';
import { hashPassword } from '../src/middleware/auth.js';

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

const userCount = await db.collection('users').countDocuments();
if (userCount > 0) {
  console.log('Users already exist — migration already done. Aborting (no changes).');
  await client.close();
  process.exit(0);
}

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

// Old singleton profile (_id:'profile') → profiles collection with userId.
const oldProfile = await db.collection('profile').findOne({ _id: 'profile' });
if (oldProfile) {
  const { _id, ...rest } = oldProfile;
  await db.collection('profiles').insertOne({ id: crypto.randomUUID(), userId, ...rest });
  console.log('Migrated profile → profiles');
}

for (const c of DATA_COLLECTIONS) {
  const r = await db.collection(c).updateMany({ userId: { $exists: false } }, { $set: { userId } });
  console.log(`Backfilled userId on ${c}: ${r.modifiedCount}`);
}

console.log('\nMigration complete. Log in with your MIGRATE_EMAIL / MIGRATE_PASSWORD.');
await client.close();
