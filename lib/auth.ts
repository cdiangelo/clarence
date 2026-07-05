import { createHmac, createHash } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'clarence_sess';
const SESSION_TTL_DAYS = 30;

function getSecret(): string {
  return process.env.SESSION_SECRET ?? 'clarence-dev-secret-change-in-prod';
}

// ─── token ────────────────────────────────────────────────────

function signToken(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function makeSessionToken(userId: string): string {
  const exp = Date.now() + SESSION_TTL_DAYS * 86400_000;
  const payload = `${userId}.${exp}`;
  const sig = signToken(payload);
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const parts = raw.split('.');
    if (parts.length !== 3) return null;
    const [userId, expStr, sig] = parts;
    if (signToken(`${userId}.${expStr}`) !== sig) return null;
    if (Date.now() > parseInt(expStr, 10)) return null;
    return { userId };
  } catch {
    return null;
  }
}

// ─── PIN ──────────────────────────────────────────────────────

export function hashPin(email: string, pin: string): string {
  return createHash('sha256').update(`${email.toLowerCase()}:${pin}`).digest('hex');
}

// ─── session helpers (called from Server Components / Route Handlers) ──────

export async function getSession(): Promise<{ userId: string } | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_TTL_DAYS * 86400,
    path: '/',
  };
}

export { COOKIE_NAME };
