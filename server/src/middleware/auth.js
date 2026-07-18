import crypto from 'node:crypto';
import { config } from '../config.js';

// Constant-time string compare (avoids leaking match info via timing).
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Auth is active only when BOTH credentials are configured (off in local dev). */
export function authEnabled() {
  return Boolean(config.auth.user && config.auth.pass);
}

/**
 * Deterministic, stateless bearer token derived from the credentials. The
 * server can recompute it on every request, so there's no session store to
 * keep — and changing the password automatically invalidates old tokens.
 */
export function expectedToken() {
  return crypto
    .createHmac('sha256', config.auth.pass)
    .update(`rrpt:${config.auth.user}`)
    .digest('hex');
}

// POST /api/login  { username, password } -> { token, user }
export function loginHandler(req, res) {
  if (!authEnabled()) return res.json({ token: 'open', user: 'local' });
  const { username = '', password = '' } = req.body || {};
  if (safeEqual(username, config.auth.user) && safeEqual(password, config.auth.pass)) {
    return res.json({ token: expectedToken(), user: config.auth.user });
  }
  return res.status(401).json({ error: 'Invalid username or password.' });
}

// Endpoints reachable without a token so the login page + health check work.
const OPEN_API_PATHS = new Set(['/api/login', '/api/health']);

/**
 * Protects the data API with a bearer token. The static SPA (login page + app
 * shell) and the open endpoints above are always served, so the user can reach
 * the login screen; every other /api route needs a valid token.
 */
export function requireAuth(req, res, next) {
  if (!authEnabled()) return next(); // gate disabled (local dev)
  if (!req.path.startsWith('/api')) return next(); // static SPA is public
  if (OPEN_API_PATHS.has(req.path)) return next();

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (token && safeEqual(token, expectedToken())) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}
