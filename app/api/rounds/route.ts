import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/db/client';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rounds = await query<{
    id: string; course_id: string | null; course_name: string; date: string;
    holes: number; score: number; course_rating: number | null; slope_rating: number | null;
    putts: number | null; fir: number | null; fir_total: number | null; gir: number | null; notes: string | null;
  }>(
    // to_char forces a plain 'YYYY-MM-DD' string — the pg driver otherwise
    // returns DATE columns as full Date objects that serialize to a full
    // ISO timestamp, which breaks any client code that appends a time part
    `SELECT id, course_id, course_name, to_char(date, 'YYYY-MM-DD') AS date, holes, score,
            course_rating, slope_rating, putts, fir, fir_total, gir, notes
     FROM rounds WHERE user_id = $1 ORDER BY date DESC`,
    [session.userId],
  );

  return NextResponse.json({
    rounds: rounds.map((r) => ({
      id: r.id,
      courseId: r.course_id ?? undefined,
      courseName: r.course_name,
      date: r.date,
      holes: r.holes as 9 | 18,
      score: r.score,
      courseRating: r.course_rating ?? undefined,
      slopeRating: r.slope_rating ?? undefined,
      putts: r.putts ?? undefined,
      fir: r.fir ?? undefined,
      firTotal: r.fir_total ?? undefined,
      gir: r.gir ?? undefined,
      notes: r.notes ?? undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    courseName: string; courseId?: string; holes: 9 | 18; score: number;
    courseRating?: number; slopeRating?: number; putts?: number;
    fir?: number; firTotal?: number; gir?: number; notes?: string;
    date?: string;
  };

  if (!body.courseName || !body.holes || !body.score) {
    return NextResponse.json({ error: 'courseName, holes, and score required' }, { status: 400 });
  }

  const date = body.date ?? new Date().toISOString().slice(0, 10);

  try {
    const rows = await query<{
      id: string; course_id: string | null; course_name: string; date: string; holes: number; score: number;
      course_rating: number | null; slope_rating: number | null; putts: number | null; notes: string | null;
    }>(
      `INSERT INTO rounds (user_id, course_id, course_name, date, holes, score, course_rating, slope_rating, putts, fir, fir_total, gir, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id, course_id, course_name, to_char(date, 'YYYY-MM-DD') AS date, holes, score, course_rating, slope_rating, putts, notes`,
      [
        session.userId, body.courseId ?? null, body.courseName, date,
        body.holes, body.score, body.courseRating ?? null, body.slopeRating ?? null,
        body.putts ?? null, body.fir ?? null, body.firTotal ?? null, body.gir ?? null,
        body.notes ?? null,
      ],
    );

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
    console.error('[/api/rounds POST]', err);
    return NextResponse.json({ error: 'Failed to save round' }, { status: 500 });
  }
}
