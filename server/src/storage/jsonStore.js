import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/**
 * Local JSON-file storage driver.
 *
 * Implements the same async, collection-oriented interface a MongoDB driver
 * would expose (see storage/index.js), so swapping the driver later is a
 * one-line config change — the routes never touch the filesystem directly.
 *
 * Shape of the persisted document:
 *   {
 *     profile:        {...}     // singleton
 *     measurements:   [...]     // collection
 *     workouts:       [...]     // collection
 *     physiqueRatings:[...]     // collection
 *     photos:         [...]     // collection
 *   }
 */
export class JsonStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.db = null;
    // Serialize writes so concurrent requests can't clobber the file.
    this._writeChain = Promise.resolve();
  }

  async init(seedFactory) {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      this.db = JSON.parse(raw);
    } catch {
      // No file yet (or corrupt) → seed a fresh database.
      this.db = seedFactory();
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await this._flush();
    }
    return this;
  }

  _flush() {
    const snapshot = JSON.stringify(this.db, null, 2);
    this._writeChain = this._writeChain.then(() =>
      fs.writeFile(this.filePath, snapshot, 'utf8'),
    );
    return this._writeChain;
  }

  // ── Whole-database access ────────────────────────────────────────────────
  async dump() {
    return structuredClone(this.db);
  }

  async reset(seedFactory) {
    this.db = seedFactory();
    await this._flush();
    return this.dump();
  }

  // ── Singleton document (profile) ─────────────────────────────────────────
  async getSingleton(key) {
    return structuredClone(this.db[key]);
  }

  async setSingleton(key, value) {
    this.db[key] = { ...this.db[key], ...value };
    await this._flush();
    return structuredClone(this.db[key]);
  }

  // ── Collections ──────────────────────────────────────────────────────────
  async list(collection) {
    return structuredClone(this.db[collection] || []);
  }

  async insert(collection, doc) {
    const record = { id: doc.id || crypto.randomUUID(), ...doc };
    if (!this.db[collection]) this.db[collection] = [];
    this.db[collection].push(record);
    await this._flush();
    return structuredClone(record);
  }

  async update(collection, id, patch) {
    const items = this.db[collection] || [];
    const idx = items.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch, id };
    await this._flush();
    return structuredClone(items[idx]);
  }

  async remove(collection, id) {
    const items = this.db[collection] || [];
    const idx = items.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    items.splice(idx, 1);
    await this._flush();
    return true;
  }
}
