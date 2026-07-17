import { createApp } from './app.js';
import { config } from './config.js';
import { getStore } from './storage/index.js';

/**
 * Warm the DB connection in the background, retrying with backoff. The web
 * server keeps serving (health check + SPA) even while the DB is unreachable,
 * so a bad/late Atlas allowlist can't turn into a crash-loop or failed deploy —
 * data routes simply start working once the connection succeeds.
 */
async function connectStorage(attempt = 1) {
  try {
    await getStore();
    console.log(`  ✓  storage connected (${config.storageDriver})`);
  } catch (err) {
    const wait = Math.min(30, attempt * 5);
    console.error(`  !  storage connect failed (attempt ${attempt}): ${err.message}`);
    console.error(`     web server is up; retrying the DB in ${wait}s…`);
    setTimeout(() => connectStorage(attempt + 1), wait * 1000);
  }
}

const app = createApp();
app.listen(config.port, () => {
  console.log('');
  console.log('  💪  Ryan Reynolds Physique Tracker — API');
  console.log(`  →  listening on port ${config.port} (/api/health)`);
  console.log(`  →  storage driver: ${config.storageDriver}`);
  console.log('');
  connectStorage();
});
