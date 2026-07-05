import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { gcaCourseDetail, extractHoles, findHolesByName, type HoleData as GcaHoleData } from '@/lib/golfCourseApi';

const GCA_KEY = process.env.GOLF_COURSE_API_KEY ?? '';

export interface HoleData {
  holeNumber: number;
  par: number;
  yardsBlue?: number;
  yardsWhite?: number;
  handicap?: number;
}

function toApiShape(rawHoles: GcaHoleData[]): HoleData[] {
  return rawHoles.map((h) => ({
    holeNumber: h.holeNumber, par: h.par, yardsBlue: h.yardage, handicap: h.handicap,
  }));
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

    if (GCA_KEY) {
      if (courseId.startsWith('gca-')) {
        // GCA courses have 'gca-{id}' prefixed IDs — hole arrays live nested inside
        // tees.male[].holes / tees.female[].holes, and the detail response wraps
        // the course under a `course` key (see lib/golfCourseApi.ts)
        const apiId = courseId.replace(/^gca-/, '');
        const detail = await gcaCourseDetail(apiId, GCA_KEY);
        const rawHoles = detail ? extractHoles(detail) : null;
        if (rawHoles && rawHoles.length >= 9) {
          return NextResponse.json({ holes: toApiShape(rawHoles), source: 'gca' });
        }
      } else {
        // Seed/DB courses have their own local id, never GCA-prefixed — the
        // real course still very likely exists in GCA under its own id, so
        // look up the local course's name and search GCA by name instead
        const nameRow = await query<{ name: string }>('SELECT name FROM courses WHERE id = $1', [courseId]).catch(() => []);
        if (nameRow[0]) {
          const rawHoles = await findHolesByName(nameRow[0].name, GCA_KEY);
          if (rawHoles && rawHoles.length >= 9) {
            return NextResponse.json({ holes: toApiShape(rawHoles), source: 'gca' });
          }
        }
      }
    }

    return NextResponse.json({ holes: [], message: 'No scorecard data available for this course' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, holes: [] }, { status: 500 });
  }
}
