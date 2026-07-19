import crypto from 'node:crypto';
import { config } from '../config.js';

// ── Password hashing (scrypt — built into Node, no dependency) ───────────────
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored || '').split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(derived, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── JWT (HS256, hand-rolled with crypto — no dependency) ─────────────────────
const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function signJwt(payload, expiresInSec = 60 * 60 * 24 * 30) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + expiresInSec }));
  const sig = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyJwt(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = crypto.createHmac('sha256', config.jwtSecret).update(`${header}.${body}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (claims.exp && Math.floor(Date.now() / 1000) > claims.exp) return null;
    return claims;
  } catch {
    return null;
  }
}

// ── Auth middleware ──────────────────────────────────────────────────────────
// Endpoints reachable without a token so the SPA + auth flow work.
const OPEN_API_PATHS = new Set([
  '/api/health',
  '/api/auth/login',
  '/api/auth/register',
]);

export function authenticate(req, res, next) {
  if (!req.path.startsWith('/api')) return next(); // static SPA is public
  if (OPEN_API_PATHS.has(req.path)) return next();

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const claims = verifyJwt(token);
  if (!claims?.sub) return res.status(401).json({ error: 'Unauthorized' });
  req.userId = claims.sub;
  req.userEmail = claims.email;
  next();
}
