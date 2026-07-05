import { NextRequest, NextResponse } from 'next/server';
import { hashPin, makeSessionToken, sessionCookieOptions } from '@/lib/auth';
import { query, queryOne } from '@/db/client';

export async function POST(req: NextRequest) {
  const { email, pin, displayName } = await req.json() as {
    email: string;
    pin: string;
    displayName: string;
  };

  if (!email || !pin || !displayName?.trim()) {
    return NextResponse.json({ error: 'Email, PIN, and name required' }, { status: 400 });
  }
  if (!/^\d{5}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 5 digits' }, { status: 400 });
  }

  const norm = email.toLowerCase().trim();
  const existing = await queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [norm]);
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const pinHash = hashPin(norm, pin);

  const rows = await query<{ id: string; email: string; display_name: string }>(
    `INSERT INTO users (email, pin_hash, display_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, display_name`,
    [norm, pinHash, displayName.trim()],
  );

  const user = rows[0];
  const token = makeSessionToken(user.id);
  const opts = sessionCookieOptions();

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.display_name },
  });
  res.cookies.set(opts.name, token, opts);
  return res;
}
