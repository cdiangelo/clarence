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
  const body = await req.json() as {
    courseName?: string; courseId?: string; date?: string; holes?: 9 | 18; score?: number;
    courseRating?: number; slopeRating?: number; putts?: number; notes?: string;
  };

  try {
    const rows = await query<{
      id: string; course_id: string | null; course_name: string; date: string; holes: number; score: number;
      course_rating: number | null; slope_rating: number | null; putts: number | null; notes: string | null;
    }>(
      `UPDATE rounds SET
         course_name = COALESCE($1, course_name),
         course_id = COALESCE($2, course_id),
         date = COALESCE($3, date),
         holes = COALESCE($4, holes),
         score = COALESCE($5, score),
         course_rating = $6,
         slope_rating = $7,
         putts = $8,
         notes = $9
       WHERE id = $10 AND user_id = $11
       RETURNING id, course_id, course_name, to_char(date, 'YYYY-MM-DD') AS date, holes, score, course_rating, slope_rating, putts, notes`,
      [
        body.courseName ?? null, body.courseId ?? null, body.date ?? null, body.holes ?? null, body.score ?? null,
        body.courseRating ?? null, body.slopeRating ?? null, body.putts ?? null, body.notes ?? null,
        id, session.userId,
      ],
    );

    if (rows.length === 0) return NextResponse.json({ error: 'Round not found' }, { status: 404 });

    const row = rows[0];
    return NextResponse.json({
      round: {
        id: row.id,
        courseId: row.course_id ?? undefined,
        courseName: row.course_name,
        date: row.date,
        holes: row.holes as 9 | 18,
        score: row.score,
        courseRating: row.course_rating ?? undefined,
        slopeRating: row.slope_rating ?? undefined,
        putts: row.putts ?? undefined,
        notes: row.notes ?? undefined,
      },
    });
  } catch (err) {
    console.error('[/api/rounds/[id] PATCH]', err);
    return NextResponse.json({ error: 'Failed to update round' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query('DELETE FROM rounds WHERE id = $1 AND user_id = $2', [id, session.userId]);
  return NextResponse.json({ ok: true });
}
