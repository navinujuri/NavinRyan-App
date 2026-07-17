import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

/**
 * MongoDB storage driver.
 *
 * Implements the exact same interface as JsonStore, so switching drivers is a
 * one-line config change (STORAGE_DRIVER=mongo) — no route code changes.
 *
 * Layout:
 *   - `profile`         : single document, pinned at _id = "profile"
 *   - `measurements`    : one doc per entry (string `id` field, UUID)
 *   - `workouts`        : "
 *   - `physiqueRatings` : "
 *   - `photos`          : "
 *
 * The app addresses records by their own string `id` (never Mongo's `_id`), so
 * reads project `_id` out to keep payloads identical to the JSON driver.
 */
const COLLECTIONS = ['measurements', 'workouts', 'physiqueRatings', 'photos', 'restLogs'];
const PROFILE_ID = 'profile';

export class MongoStore {
  constructor(config) {
    this.uri = config.mongoUri;
    this.dbName = config.mongoDbName;
    this.client = null;
    this.db = null;
  }

  async init(seedFactory) {
    this.client = new MongoClient(this.uri, {
      serverSelectionTimeoutMS: 10_000,
    });
    await this.client.connect();
    this.db = this.client.db(this.dbName);

    // Seed once, only when the database is empty.
    const hasProfile = await this.db.collection('profile').countDocuments({}, { limit: 1 });
    if (hasProfile === 0) {
      await this._seed(seedFactory());
      console.log('  →  seeded fresh MongoDB database');
    }
    return this;
  }

  async _seed(seed) {
    await this.db.collection('profile').insertOne({ _id: PROFILE_ID, ...seed.profile });
    for (const name of COLLECTIONS) {
      const rows = seed[name] || [];
      if (rows.length) await this.db.collection(name).insertMany(rows.map((r) => ({ ...r })));
    }
  }

  // ── Whole-database access ────────────────────────────────────────────────
  async dump() {
    const [profile, measurements, workouts, physiqueRatings, photos, restLogs] = await Promise.all([
      this.getSingleton('profile'),
      this.list('measurements'),
      this.list('workouts'),
      this.list('physiqueRatings'),
      this.list('photos'),
      this.list('restLogs'),
    ]);
    return { profile, measurements, workouts, physiqueRatings, photos, restLogs };
  }

  async reset(seedFactory) {
    await Promise.all(
      ['profile', ...COLLECTIONS].map((c) => this.db.collection(c).deleteMany({})),
    );
    await this._seed(seedFactory());
    return this.dump();
  }

  // ── Singleton document (profile) ─────────────────────────────────────────
  async getSingleton(_key) {
    const doc = await this.db
      .collection('profile')
      .findOne({ _id: PROFILE_ID }, { projection: { _id: 0 } });
    return doc || {};
  }

  async setSingleton(_key, value) {
    await this.db
      .collection('profile')
      .updateOne({ _id: PROFILE_ID }, { $set: value }, { upsert: true });
    return this.getSingleton('profile');
  }

  // ── Collections ──────────────────────────────────────────────────────────
  async list(collection) {
    return this.db.collection(collection).find({}, { projection: { _id: 0 } }).toArray();
  }

  async insert(collection, doc) {
    const record = { id: doc.id || crypto.randomUUID(), ...doc };
    // Insert a copy so Mongo's added `_id` doesn't leak onto the returned record.
    await this.db.collection(collection).insertOne({ ...record });
    return record;
  }

  async update(collection, id, patch) {
    const res = await this.db
      .collection(collection)
      .findOneAndUpdate(
        { id },
        { $set: { ...patch, id } },
        { returnDocument: 'after', projection: { _id: 0 } },
      );
    // Driver v5/v6 returns the doc directly; v4 wrapped it in `.value`.
    return res?.value ?? res ?? null;
  }

  async remove(collection, id) {
    const res = await this.db.collection(collection).deleteOne({ id });
    return res.deletedCount > 0;
  }
}
