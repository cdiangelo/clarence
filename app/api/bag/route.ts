import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/db/client';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clubs = await query<{
    id: string; catalog_id: string | null; slot: string;
    carry: number | null; carry_is_estimate: boolean; loft: number | null;
    brand: string | null; model: string | null; family: string | null;
    type: string | null; stock_shaft: string | null;
  }>(
    `SELECT bc.id, bc.catalog_id, bc.slot, bc.carry, bc.carry_is_estimate, bc.loft,
            cc.brand, cc.model, cc.family, cc.type, cc.stock_shaft
     FROM bag_clubs bc
     LEFT JOIN clubs_catalog cc ON cc.id = bc.catalog_id
     WHERE bc.user_id = $1
     ORDER BY bc.slot`,
    [session.userId],
  );

  return NextResponse.json({
    clubs: clubs.map((c) => ({
      id: c.id,
      catalogId: c.catalog_id ?? undefined,
      slot: c.slot,
      brand: c.brand ?? undefined,
      model: c.model ?? undefined,
      carry: c.carry ?? undefined,
      carryIsEstimate: c.carry_is_estimate,
      loft: c.loft ?? undefined,
      catalog: c.brand ? {
        id: c.catalog_id!, brand: c.brand, model: c.model, family: c.family,
        type: c.type, stockShaft: c.stock_shaft,
      } : undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    catalogId?: string; slot: string; brand?: string; model?: string;
    carry?: number; carryIsEstimate?: boolean; loft?: number;
  };

  if (!body.slot) return NextResponse.json({ error: 'slot required' }, { status: 400 });

  const rows = await query<{ id: string; slot: string; carry: number | null; carry_is_estimate: boolean }>(
    `INSERT INTO bag_clubs (user_id, catalog_id, slot, carry, carry_is_estimate, loft)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id, slot) DO UPDATE
       SET catalog_id = EXCLUDED.catalog_id,
           carry = EXCLUDED.carry,
           carry_is_estimate = EXCLUDED.carry_is_estimate,
           loft = EXCLUDED.loft
     RETURNING id, slot, carry, carry_is_estimate`,
    [session.userId, body.catalogId ?? null, body.slot, body.carry ?? null, body.carryIsEstimate ?? true, body.loft ?? null],
  );

  const row = rows[0];
  return NextResponse.json({
    club: { ...body, id: row.id, slot: row.slot, carry: row.carry ?? undefined, carryIsEstimate: row.carry_is_estimate },
  });
}
