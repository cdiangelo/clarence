import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { COURSES } from '@/data/courses';
import { gcaSearch, normalizeSearchResult } from '@/lib/golfCourseApi';

const GCA_KEY = process.env.GOLF_COURSE_API_KEY ?? '';

async function searchGolfCourseApi(q: string) {
  const rawCourses = await gcaSearch(q, GCA_KEY);
  return rawCourses.slice(0, 8).map(normalizeSearchResult);
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ courses: [] });

  // 1. DB search
  const dbRows = await query<{
    id: string; name: string; city: string; state: string; lat: number; lng: number;
    par: number; rating18: number | null; slope18: number | null;
    rating9: number | null; slope9: number | null; holes_count: number; verified: boolean;
  }>(
    `SELECT id, name, city, state, lat, lng, par, rating18, slope18, rating9, slope9, holes_count, verified
     FROM courses
     WHERE name ILIKE $1 OR city ILIKE $1
     ORDER BY verified DESC, name
     LIMIT 8`,
    [`%${q}%`],
  ).catch(() => []);

  if (dbRows.length >= 3) {
    return NextResponse.json({
      courses: dbRows.map((r) => ({
        id: r.id, name: r.name, city: r.city, state: r.state,
        lat: r.lat, lng: r.lng, par: r.par,
        rating18: r.rating18 ?? undefined, slope18: r.slope18 ?? undefined,
        rating9: r.rating9 ?? undefined, slope9: r.slope9 ?? undefined,
        holes: r.holes_count as 9 | 18, verified: r.verified,
      })),
    });
  }

  // 2. Seed data fallback
  const seedMatches = COURSES.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.city.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 8);

  if (seedMatches.length >= 3) {
    return NextResponse.json({ courses: seedMatches });
  }

  // 3. Golf Course API
  const apiResults = await searchGolfCourseApi(q);
  const merged = [...seedMatches, ...apiResults].slice(0, 8);
  return NextResponse.json({ courses: merged });
}
