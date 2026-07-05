import { NextRequest, NextResponse } from 'next/server';
import { resolveTees } from '@/lib/courseData';

export interface TeeOptionData {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  rating18?: number;
  slope18?: number;
  par: number;
  holesCount: 9 | 18;
  holes: {
    holeNumber: number;
    par: number;
    yardsBlue?: number;
    handicap?: number;
  }[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;

  try {
    const { tees, source } = await resolveTees(courseId);

    return NextResponse.json({
      source,
      tees: tees.map((t): TeeOptionData => ({
        id: t.id, name: t.name, gender: t.gender, rating18: t.rating18, slope18: t.slope18,
        par: t.par, holesCount: t.holesCount,
        holes: t.holes.map((h) => ({
          holeNumber: h.holeNumber, par: h.par, yardsBlue: h.yardage, handicap: h.handicap,
        })),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, tees: [] }, { status: 500 });
  }
}
