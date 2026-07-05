import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { gcaCourseDetail, extractHoles, type HoleData as GcaHoleData } from '@/lib/golfCourseApi';

const GCA_KEY = process.env.GOLF_COURSE_API_KEY ?? '';

export interface HoleData {
  holeNumber: number;
  par: number;
  yardsBlue?: number;
  yardsWhite?: number;
  handicap?: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;

  try {
    // DB lookup first (works for both UUID and gca- IDs if we seeded them)
    const dbHoles = await query<{
      hole_num: number; par: number;
      yards_blue: number | null; yards_white: number | null; hdcp: number | null;
    }>(
      'SELECT hole_num, par, yards_blue, yards_white, hdcp FROM course_holes WHERE course_id = $1 ORDER BY hole_num',
      [courseId],
    ).catch(() => []);

    if (dbHoles.length >= 9) {
      return NextResponse.json({
        holes: dbHoles.map((h) => ({
          holeNumber: h.hole_num,
          par: h.par,
          yardsBlue: h.yards_blue ?? undefined,
          yardsWhite: h.yards_white ?? undefined,
          handicap: h.hdcp ?? undefined,
        } satisfies HoleData)),
        source: 'db',
      });
    }

    // GCA API fallback for gca-prefixed IDs — hole arrays live nested inside
    // tees.male[].holes / tees.female[].holes, and the detail response wraps
    // the course under a `course` key (see lib/golfCourseApi.ts)
    if (GCA_KEY && courseId.startsWith('gca-')) {
      const apiId = courseId.replace(/^gca-/, '');
      const detail = await gcaCourseDetail(apiId, GCA_KEY);
      const rawHoles = detail ? extractHoles(detail) : null;

      if (rawHoles && rawHoles.length >= 9) {
        const holes: HoleData[] = rawHoles.map((h: GcaHoleData) => ({
          holeNumber: h.holeNumber,
          par: h.par,
          yardsBlue: h.yardage,
          handicap: h.handicap,
        }));
        return NextResponse.json({ holes, source: 'gca' });
      }
    }

    return NextResponse.json({ holes: [], message: 'No scorecard data available for this course' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, holes: [] }, { status: 500 });
  }
}
