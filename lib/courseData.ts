// Central course-data resolution layer. Every caller that needs a course's
// profile (par/rating/slope/location) or its hole-by-hole layout goes
// through here instead of re-implementing the DB → GCA fallback chain in
// each API route — that duplication is exactly how the "seed courses can
// never reach GCA" bug happened in the first place.
//
// This never fabricates data. If neither our DB nor the Golf Course API has
// a real scorecard for a course, resolveHoles() returns an empty result —
// callers must show an honest "not available" state, not an invented one.
import { query } from '@/db/client';
import { gcaCourseDetail, extractHoles, findHolesByName, normalizeSearchResult, type HoleData } from './golfCourseApi';
import { findHolesByNameOpenGolf } from './openGolfApi';

const GCA_KEY = process.env.GOLF_COURSE_API_KEY ?? '';

export interface CourseProfile {
  id: string;
  name: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  par: number;
  rating18?: number;
  slope18?: number;
  rating9?: number;
  slope9?: number;
  holes: 9 | 18;
}

export interface ResolvedHoles {
  holes: HoleData[];
  source: 'db' | 'gca' | 'opengolf' | 'none';
}

export async function resolveCourseProfile(courseId: string): Promise<CourseProfile | null> {
  if (courseId.startsWith('gca-')) {
    if (!GCA_KEY) return null;
    const detail = await gcaCourseDetail(courseId.replace(/^gca-/, ''), GCA_KEY);
    if (!detail) return null;
    const norm = normalizeSearchResult(detail);
    return { ...norm };
  }

  const rows = await query<{
    id: string; name: string; city: string | null; state: string | null;
    lat: number | null; lng: number | null; par: number | null;
    rating18: number | null; slope18: number | null; rating9: number | null; slope9: number | null;
    holes_count: number;
  }>(
    'SELECT id, name, city, state, lat, lng, par, rating18, slope18, rating9, slope9, holes_count FROM courses WHERE id = $1',
    [courseId],
  ).catch(() => []);
  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    id: r.id, name: r.name, city: r.city ?? undefined, state: r.state ?? undefined,
    lat: r.lat ?? undefined, lng: r.lng ?? undefined, par: r.par ?? 72,
    rating18: r.rating18 ?? undefined, slope18: r.slope18 ?? undefined,
    rating9: r.rating9 ?? undefined, slope9: r.slope9 ?? undefined,
    holes: r.holes_count === 9 ? 9 : 18,
  };
}

// Resolves hole-by-hole layout — real data only:
//   1. Already in our DB (course_holes)
//   2. The Golf Course API (direct id, or by-name search when the course
//      has a local, non-GCA id)
//   3. OpenGolfAPI (free, keyless, OSM-derived) — by-name search fallback
//      for courses GCA doesn't have or couldn't match
// If none of them have it, returns an empty result. No estimation, ever.
export async function resolveHoles(courseId: string): Promise<ResolvedHoles> {
  const dbHoles = await query<{
    hole_num: number; par: number; yards_blue: number | null; yards_white: number | null; hdcp: number | null;
  }>(
    'SELECT hole_num, par, yards_blue, yards_white, hdcp FROM course_holes WHERE course_id = $1 ORDER BY hole_num',
    [courseId],
  ).catch(() => []);

  if (dbHoles.length >= 9) {
    return {
      source: 'db',
      holes: dbHoles.map((h) => ({
        holeNumber: h.hole_num, par: h.par,
        yardage: h.yards_blue ?? h.yards_white ?? undefined,
        handicap: h.hdcp ?? undefined,
      })),
    };
  }

  if (GCA_KEY) {
    let rawHoles: HoleData[] | null = null;
    if (courseId.startsWith('gca-')) {
      const detail = await gcaCourseDetail(courseId.replace(/^gca-/, ''), GCA_KEY);
      rawHoles = detail ? extractHoles(detail) : null;
    } else {
      const profile = await resolveCourseProfile(courseId);
      if (profile?.name) rawHoles = await findHolesByName(profile.name, GCA_KEY);
    }
    if (rawHoles && rawHoles.length >= 9) {
      return { source: 'gca', holes: rawHoles };
    }
  }

  if (!courseId.startsWith('gca-')) {
    const profile = await resolveCourseProfile(courseId);
    if (profile?.name) {
      const rawHoles = await findHolesByNameOpenGolf(profile.name);
      if (rawHoles && rawHoles.length >= 9) {
        return { source: 'opengolf', holes: rawHoles };
      }
    }
  }

  return { source: 'none', holes: [] };
}
