import crypto from 'node:crypto';
import { config } from '../config.js';

const sessions = new Map();

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

export function verifyAccessCode(candidate) {
  const expected = sha256(config.accessCode);
  const received = sha256(candidate);
  return crypto.timingSafeEqual(expected, received);
}

export function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + config.sessionTtlMinutes * 60 * 1000);
  sessions.set(token, expiresAt.getTime());
  return { token, expiresAt: expiresAt.toISOString() };
}

export function isValidSession(token) {
  if (!token) return false;
  const expiresAt = sessions.get(token);
  if (!expiresAt) return false;
  if (Date.now() >= expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function revokeSession(token) {
  sessions.delete(token);
}

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of sessions.entries()) {
    if (now >= expiresAt) sessions.delete(token);
  }
}, 10 * 60 * 1000);
cleanupTimer.unref();
