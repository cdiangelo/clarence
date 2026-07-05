import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/db/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { carry?: number; carryIsEstimate?: boolean; loft?: number };

  await query(
    `UPDATE bag_clubs SET
       carry = COALESCE($1, carry),
       carry_is_estimate = COALESCE($2, carry_is_estimate),
       loft = COALESCE($3, loft)
     WHERE id = $4 AND user_id = $5`,
    [body.carry ?? null, body.carryIsEstimate ?? null, body.loft ?? null, id, session.userId],
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query('DELETE FROM bag_clubs WHERE id = $1 AND user_id = $2', [id, session.userId]);
  return NextResponse.json({ ok: true });
}
