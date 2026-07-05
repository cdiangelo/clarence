import { NextRequest, NextResponse } from 'next/server';
import { hashPin, makeSessionToken, sessionCookieOptions } from '@/lib/auth';
import { queryOne } from '@/db/client';

export async function POST(req: NextRequest) {
  const { email, pin } = await req.json() as { email: string; pin: string };

  if (!email || !pin) {
    return NextResponse.json({ error: 'Email and PIN required' }, { status: 400 });
  }
  if (!/^\d{5}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 5 digits' }, { status: 400 });
  }

  const norm = email.toLowerCase().trim();
  const pinHash = hashPin(norm, pin);

  const user = await queryOne<{ id: string; email: string; display_name: string; pin_hash: string }>(
    'SELECT id, email, display_name, pin_hash FROM users WHERE email = $1',
    [norm],
  );

  if (!user || user.pin_hash !== pinHash) {
    return NextResponse.json({ error: 'Incorrect email or PIN' }, { status: 401 });
  }

  const token = makeSessionToken(user.id);
  const opts = sessionCookieOptions();

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, displayName: user.display_name },
  });
  res.cookies.set(opts.name, token, opts);
  return res;
}
