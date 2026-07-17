import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Central runtime configuration. Everything is env-overridable so the same
 * codebase runs locally (JSON storage) today and can point at MongoDB later
 * without touching the routes.
 */
export const config = {
  port: Number(process.env.PORT) || 4000,

  // Storage driver: "json" (default, local file) or "mongo" (future).
  storageDriver: process.env.STORAGE_DRIVER || 'json',

  // Absolute path to the local JSON database file.
  jsonDbPath:
    process.env.JSON_DB_PATH ||
    path.resolve(__dirname, '..', 'data', 'db.json'),

  // Reserved for the future MongoDB driver.
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
  mongoDbName: process.env.MONGO_DB_NAME || 'rr_physique_tracker',

  // Path to the built client (served in production single-process mode).
  clientDist: path.resolve(__dirname, '..', '..', 'client', 'dist'),
};
