import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const COOKIE_NAME = '__Host-finsight_session';
const LOCAL_COOKIE_NAME = 'finsight_session';
const SESSION_SECONDS = 12 * 60 * 60;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 12;
const attempts = new Map();

// Development can opt out explicitly, but a Vercel/production deployment must
// always fail closed when the password or session key is missing or invalid.
const localBypass = process.env.NODE_ENV !== 'production' &&
  !process.env.VERCEL && process.env.FINSIGHT_DISABLE_AUTH === 'true';
const secureCookies = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const cookieName = secureCookies ? COOKIE_NAME : LOCAL_COOKIE_NAME;
const passwordHash = /^scrypt:([a-f0-9]{32}):([a-f0-9]{64})$/.exec(
  process.env.FINSIGHT_PASSWORD_HASH || '',
);
const sessionSecret = process.env.FINSIGHT_SESSION_SECRET || '';
const configured = Boolean(passwordHash && sessionSecret.length >= 43);

function sign(value) {
  return createHmac('sha256', sessionSecret).update(value).digest('base64url');
}

function safeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function issueSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `v1.${expires}.${randomBytes(16).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

function readCookie(req) {
  const cookies = String(req.headers.cookie || '').split(';');
  for (const part of cookies) {
    const index = part.indexOf('=');
    if (index > -1 && part.slice(0, index).trim() === cookieName) {
      return part.slice(index + 1).trim();
    }
  }
  return '';
}

function hasValidSession(req) {
  if (localBypass) return true;
  if (!configured) return false;
  const token = readCookie(req);
  const match = /^(v1\.(\d{10})\.([A-Za-z0-9_-]{22}))\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const expires = Number(match[2]);
  const now = Math.floor(Date.now() / 1000);
  if (expires <= now || expires > now + SESSION_SECONDS + 60) return false;
  return safeEqual(match[4], sign(match[1]));
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'strict',
    path: '/',
  };
}

function requesterKey(req) {
  // Best-effort per-instance throttling; the generated password is high entropy
  // because serverless instances cannot provide a globally shared rate limit.
  return String(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].slice(0, 100);
}

function isRateLimited(key) {
  const now = Date.now();
  for (const [address, record] of attempts) {
    if (record.until <= now) attempts.delete(address);
  }
  if (attempts.size >= 1000 && !attempts.has(key)) attempts.delete(attempts.keys().next().value);
  const record = attempts.get(key) || { count: 0, until: now + ATTEMPT_WINDOW_MS };
  record.count += 1;
  attempts.set(key, record);
  return record.count > MAX_ATTEMPTS;
}

export function requireSameOriginRequest(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  // A cross-origin browser request cannot send this header without a CORS
  // preflight, and the API deliberately does not grant cross-origin access.
  if (req.get('X-FinSight-Request') !== '1') {
    return res.status(403).json({ success: false, message: 'Invalid request.' });
  }
  const origin = req.get('Origin');
  if (secureCookies && origin) {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== 'https:' || parsed.host !== req.get('Host')) {
        return res.status(403).json({ success: false, message: 'Invalid request origin.' });
      }
    } catch {
      return res.status(403).json({ success: false, message: 'Invalid request origin.' });
    }
  }
  return next();
}

export function sessionStatus(req, res) {
  if (!configured && !localBypass) {
    return res.status(503).json({ success: false, message: 'Sign-in is not configured.' });
  }
  if (!hasValidSession(req)) {
    return res.status(401).json({ success: false, message: 'Please sign in.' });
  }
  return res.json({ success: true, authenticated: true });
}

export async function login(req, res, next) {
  try {
    if (localBypass) return res.json({ success: true, authenticated: true });
    if (!configured) {
      return res.status(503).json({ success: false, message: 'Sign-in is not configured.' });
    }
    const key = requesterKey(req);
    if (isRateLimited(key)) {
      return res.status(429).json({ success: false, message: 'Too many sign-in attempts. Please try again later.' });
    }
    const password = req.body?.password;
    if (typeof password !== 'string' || password.length > 512 || password.length === 0) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }
    const expected = Buffer.from(passwordHash[2], 'hex');
    const actual = await deriveKey(password, Buffer.from(passwordHash[1], 'hex'), expected.length);
    if (!timingSafeEqual(actual, expected)) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }
    attempts.delete(key);
    res.cookie(cookieName, issueSession(), { ...cookieOptions(), maxAge: SESSION_SECONDS * 1000 });
    return res.json({ success: true, authenticated: true });
  } catch (error) {
    return next(error);
  }
}

export function logout(_req, res) {
  res.clearCookie(cookieName, cookieOptions());
  return res.json({ success: true });
}

export function requireAuthentication(req, res, next) {
  if (!configured && !localBypass) {
    return res.status(503).json({ success: false, message: 'Sign-in is not configured.' });
  }
  if (!hasValidSession(req)) {
    return res.status(401).json({ success: false, message: 'Please sign in.' });
  }
  return next();
}
