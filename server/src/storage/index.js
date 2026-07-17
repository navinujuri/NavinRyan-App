import { config } from '../config.js';
import { JsonStore } from './jsonStore.js';
import { MongoStore } from './mongoStore.js';
import { buildSeed } from '../data/seed.js';

let storePromise = null;

/**
 * Returns the singleton storage instance for the configured driver.
 * The driver is chosen by config.storageDriver ("json" | "mongo").
 */
export function getStore() {
  if (!storePromise) {
    storePromise = (async () => {
      let store;
      switch (config.storageDriver) {
        case 'mongo':
          store = new MongoStore(config);
          break;
        case 'json':
        default:
          store = new JsonStore(config.jsonDbPath);
          break;
      }
      return store.init(buildSeed);
    })().catch((err) => {
      // Don't cache the failure — let the next call (a retry or a request) try
      // again once the DB becomes reachable (e.g. after fixing the allowlist).
      storePromise = null;
      throw err;
    });
  }
  return storePromise;
}
