import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { queryOne } from '@/db/client';

// GET: current session user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ user: null });

  const user = await queryOne<{ id: string; email: string; display_name: string }>(
    'SELECT id, email, display_name FROM users WHERE id = $1',
    [session.userId],
  );
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({ user: { id: user.id, email: user.email, displayName: user.display_name } });
}

// POST: check if email already exists (used by auth page step 1)
export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email: string };
  if (!email) return NextResponse.json({ exists: false });

  const row = await queryOne<{ id: string }>(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase().trim()],
  );
  return NextResponse.json({ exists: !!row });
}
