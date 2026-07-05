import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/db/client';
import { COURSES } from '@/data/courses';

const GCA_KEY = process.env.GOLF_COURSE_API_KEY ?? '';
const GCA_BASE = 'https://api.golfcourseapi.com/v1';

interface GcaCourse {
  id: string | number;
  club_name: string;
  course_name?: string;
  location?: { city?: string; state?: string; latitude?: number; longitude?: number };
  holes?: number;
  tees?: { male?: { name: string; course_rating: number; slope_rating: number; par: number }[] };
}

async function searchGolfCourseApi(q: string): Promise<object[]> {
  if (!GCA_KEY) return [];
  try {
    const url = `${GCA_BASE}/search?search_query=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Authorization: `Key ${GCA_KEY}` }, next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json() as { courses?: GcaCourse[] };
    return (data.courses ?? []).slice(0, 8).map((c) => {
      const blueTees = c.tees?.male?.find((t) => /blue/i.test(t.name));
      const whiteTees = c.tees?.male?.find((t) => /white/i.test(t.name));
      const tee = blueTees ?? whiteTees ?? c.tees?.male?.[0];
      return {
        id: `gca-${c.id}`,
        name: c.course_name ? `${c.club_name} — ${c.course_name}` : c.club_name,
        city: c.location?.city ?? '',
        state: c.location?.state ?? '',
        lat: c.location?.latitude ?? 0,
        lng: c.location?.longitude ?? 0,
        par: tee?.par ?? 72,
        rating18: tee?.course_rating,
        slope18: tee?.slope_rating,
        holes: c.holes === 9 ? 9 : 18,
        verified: false,
        source: 'gca',
      };
    });
  } catch {
    return [];
  }
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
