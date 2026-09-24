import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ADMIN_COOKIE = 'aira_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('ADMIN_SESSION_SECRET harus minimal 32 karakter.');
  return value;
}

export function verifyPassword(password) {
  const stored = process.env.ADMIN_PASSWORD_HASH || '';
  const [salt, expectedHex] = stored.split(':');
  if (!salt || !/^[a-f0-9]{128}$/i.test(expectedHex || '')) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expectedHex, 'hex'));
}

export function createSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ email: process.env.ADMIN_EMAIL, expires })).toString('base64url');
  const signature = createHmac('sha256', secret()).update(payload).digest('base64url');
  return { value: `${payload}.${signature}`, maxAge: SESSION_SECONDS };
}

export function validSession(value) {
  if (!value || typeof value !== 'string') return false;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return false;
  const expected = createHmac('sha256', secret()).update(payload).digest();
  let received;
  try { received = Buffer.from(signature, 'base64url'); } catch { return false; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.email === process.env.ADMIN_EMAIL && Number.isInteger(data.expires) && data.expires > Date.now() / 1000;
  } catch { return false; }
}

export async function isAdmin() {
  const jar = await cookies();
  return validSession(jar.get(ADMIN_COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}
