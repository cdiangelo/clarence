import { NextRequest, NextResponse } from 'next/server';
import { resolveHoles } from '@/lib/courseData';

export interface HoleData {
  holeNumber: number;
  par: number;
  yardsBlue?: number;
  yardsWhite?: number;
  handicap?: number;
  estimated?: boolean;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: courseId } = await params;
  const parParam = req.nextUrl.searchParams.get('par');
  const holesParam = req.nextUrl.searchParams.get('holes');

  try {
    const { holes, source } = await resolveHoles(courseId, {
      par: parParam ? Number(parParam) : undefined,
      holes: holesParam === '9' ? 9 : holesParam === '18' ? 18 : undefined,
    });

    return NextResponse.json({
      source,
      holes: holes.map((h): HoleData => ({
        holeNumber: h.holeNumber, par: h.par, yardsBlue: h.yardage, handicap: h.handicap, estimated: h.estimated,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message, holes: [] }, { status: 500 });
  }
}
