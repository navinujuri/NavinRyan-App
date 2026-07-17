import { createApp } from './app.js';
import { config } from './config.js';
import { getStore } from './storage/index.js';

async function main() {
  // Initialise storage (seeds db.json on first run) before accepting requests.
  await getStore();

  const app = createApp();
  app.listen(config.port, () => {
    console.log('');
    console.log('  💪  Ryan Reynolds Physique Tracker — API');
    console.log(`  →  http://localhost:${config.port}/api/health`);
    console.log(`  →  storage driver: ${config.storageDriver}`);
    console.log('');
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
