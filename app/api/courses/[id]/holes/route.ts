import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';

const GCA_KEY = process.env.GOLF_COURSE_API_KEY ?? '';
const GCA_BASE = 'https://api.golfcourseapi.com/v1';

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

    // GCA API fallback for gca-prefixed IDs
    if (GCA_KEY && courseId.startsWith('gca-')) {
      const apiId = courseId.replace(/^gca-/, '');
      const res = await fetch(`${GCA_BASE}/courses/${apiId}`, {
        headers: { Authorization: `Key ${GCA_KEY}` },
      });

      if (res.ok) {
        const data = await res.json() as {
          holes?: GcaHole[];
          tees?: {
            male?: { name: string; holes?: GcaTeeHole[] }[];
            female?: { name: string; holes?: GcaTeeHole[] }[];
          };
        };

        // Try top-level holes array first
        let rawHoles: HoleData[] | null = parseGcaHoles(data.holes ?? []);

        // Fall back to holes nested inside tees
        if (!rawHoles && data.tees) {
          const teeList = [...(data.tees.male ?? []), ...(data.tees.female ?? [])];
          const blue = teeList.find((t) => /blue/i.test(t.name));
          const white = teeList.find((t) => /white/i.test(t.name));
          const tee = blue ?? white ?? teeList[0];
          if (tee?.holes) {
            rawHoles = tee.holes
              .map((h) => ({
                holeNumber: h.hole_number ?? 0,
                par: h.par ?? 4,
                yardsBlue: h.yardage,
                handicap: h.handicap,
              }))
              .sort((a, b) => a.holeNumber - b.holeNumber);
          }
        }

        if (rawHoles && rawHoles.length >= 9) {
          return NextResponse.json({ holes: rawHoles, source: 'gca' });
        }
      }
    }

    return NextResponse.json({ holes: [], message: 'No scorecard data available for this course' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, holes: [] }, { status: 500 });
  }
}

interface GcaHole {
  hole_number?: number;
  number?: number;
  par?: number;
  yardage?: {
    white?: number; blue?: number; back?: number; middle?: number; front?: number;
  };
  handicap?: number;
}

interface GcaTeeHole {
  hole_number?: number;
  par?: number;
  yardage?: number;
  handicap?: number;
}

function parseGcaHoles(holes: GcaHole[]): HoleData[] | null {
  if (!holes.length) return null;
  const mapped = holes.map((h) => ({
    holeNumber: h.hole_number ?? h.number ?? 0,
    par: h.par ?? 4,
    yardsBlue: h.yardage?.blue ?? h.yardage?.back ?? undefined,
    yardsWhite: h.yardage?.white ?? h.yardage?.middle ?? undefined,
    handicap: h.handicap ?? undefined,
  })).sort((a, b) => a.holeNumber - b.holeNumber);
  if (mapped.length < 9) return null;
  return mapped;
}
