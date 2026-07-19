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
 * Multi-user: every document carries a `userId`; routes always pass a filter so
 * one user can never read another's rows.
 */
function matches(doc, filter) {
  return Object.entries(filter).every(([k, v]) => doc[k] === v);
}

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

  async dump(filter) {
    if (!filter) return structuredClone(this.db);
    const out = {};
    for (const [name, value] of Object.entries(this.db)) {
      out[name] = Array.isArray(value) ? value.filter((d) => matches(d, filter)) : value;
    }
    return structuredClone(out);
  }

  // ── Collections ──────────────────────────────────────────────────────────
  async list(collection, filter = {}) {
    const items = (this.db[collection] || []).filter((d) => matches(d, filter));
    return structuredClone(items);
  }

  async findOne(collection, filter) {
    const found = (this.db[collection] || []).find((d) => matches(d, filter));
    return found ? structuredClone(found) : null;
  }

  async insert(collection, doc) {
    const record = { id: doc.id || crypto.randomUUID(), ...doc };
    if (!this.db[collection]) this.db[collection] = [];
    this.db[collection].push(record);
    await this._flush();
    return structuredClone(record);
  }

  /** Update the first doc matching `filter` (usually {id} or {id,userId}). */
  async update(collection, filter, patch) {
    const items = this.db[collection] || [];
    const idx = items.findIndex((d) => matches(d, filter));
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...patch, id: items[idx].id };
    await this._flush();
    return structuredClone(items[idx]);
  }

  /** Upsert a singleton-per-owner doc (e.g. a user's profile) by `filter`. */
  async upsert(collection, filter, value) {
    const existing = await this.findOne(collection, filter);
    if (existing) return this.update(collection, filter, value);
    return this.insert(collection, { ...filter, ...value });
  }

  async remove(collection, filter) {
    const items = this.db[collection] || [];
    const idx = items.findIndex((d) => matches(d, filter));
    if (idx === -1) return false;
    items.splice(idx, 1);
    await this._flush();
    return true;
  }

  /** Remove every doc matching `filter` (used when deleting an account). */
  async removeMany(collection, filter) {
    const items = this.db[collection] || [];
    const before = items.length;
    this.db[collection] = items.filter((d) => !matches(d, filter));
    await this._flush();
    return before - this.db[collection].length;
  }
}
