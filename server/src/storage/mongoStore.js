import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

/**
 * MongoDB storage driver — same interface as JsonStore, so the driver is a
 * one-line config switch (STORAGE_DRIVER=mongo). Multi-user: every document
 * carries a `userId`; routes always pass a filter, so cross-user reads are
 * impossible. Reads project `_id` out to keep payloads identical to JSON.
 */
export class MongoStore {
  constructor(config) {
    this.uri = config.mongoUri;
    this.dbName = config.mongoDbName;
    this.client = null;
    this.db = null;
  }

  // eslint-disable-next-line no-unused-vars
  async init(_seedFactory) {
    this.client = new MongoClient(this.uri, { serverSelectionTimeoutMS: 10_000 });
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    return this;
  }

  async list(collection, filter = {}) {
    return this.db.collection(collection).find(filter, { projection: { _id: 0 } }).toArray();
  }

  async findOne(collection, filter) {
    return this.db.collection(collection).findOne(filter, { projection: { _id: 0 } });
  }

  async insert(collection, doc) {
    const record = { id: doc.id || crypto.randomUUID(), ...doc };
    await this.db.collection(collection).insertOne({ ...record });
    return record;
  }

  async update(collection, filter, patch) {
    const res = await this.db
      .collection(collection)
      .findOneAndUpdate(filter, { $set: patch }, { returnDocument: 'after', projection: { _id: 0 } });
    return res?.value ?? res ?? null;
  }

  async upsert(collection, filter, value) {
    const res = await this.db.collection(collection).findOneAndUpdate(
      filter,
      { $set: { ...filter, ...value }, $setOnInsert: { id: crypto.randomUUID() } },
      { upsert: true, returnDocument: 'after', projection: { _id: 0 } },
    );
    return res?.value ?? res ?? null;
  }

  async remove(collection, filter) {
    const res = await this.db.collection(collection).deleteOne(filter);
    return res.deletedCount > 0;
  }

  async removeMany(collection, filter) {
    const res = await this.db.collection(collection).deleteMany(filter);
    return res.deletedCount;
  }
}
