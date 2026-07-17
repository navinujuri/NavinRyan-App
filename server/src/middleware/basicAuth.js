import crypto from 'node:crypto';
import { config } from '../config.js';

// Constant-time string compare (avoids leaking match info via timing).
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * HTTP Basic Auth gate for the whole app (API + static SPA).
 *
 * - Disabled entirely unless BOTH AUTH_USER and AUTH_PASS are configured
 *   (so local dev stays open).
 * - `/api/health` is always exempt so platform health checks (Render) pass.
 * - Browsers show a native login prompt on 401 and then cache the credentials
 *   for the origin, so the SPA's fetch calls are authenticated automatically.
 */
export function basicAuth(req, res, next) {
  const { user, pass } = config.auth;
  if (!user || !pass) return next(); // gate disabled
  if (req.path === '/api/health') return next(); // keep health check open

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [u, p] = Buffer.from(encoded, 'base64').toString('utf8').split(':');
    if (safeEqual(u ?? '', user) && safeEqual(p ?? '', pass)) return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="Ryan Reynolds Physique Tracker", charset="UTF-8"');
  return res.status(401).send('Authentication required.');
}
