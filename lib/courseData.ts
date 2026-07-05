// Central course-data resolution layer. Every caller that needs a course's
// profile (par/rating/slope/location) or its hole-by-hole layout goes
// through here instead of re-implementing the DB → GCA → estimate fallback
// chain in each API route — that duplication is exactly how the "seed
// courses can never reach GCA" bug happened in the first place.
import { query } from '@/db/client';
import { gcaCourseDetail, extractHoles, findHolesByName, normalizeSearchResult } from './golfCourseApi';
import { extrapolateHoles, type HoleProfile } from './holeExtrapolation';

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
  holes: HoleProfile[];
  source: 'db' | 'gca' | 'estimated';
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

// Resolves hole-by-hole layout with a three-tier fallback:
//   1. Real data already in our DB (course_holes)
//   2. Real data from the Golf Course API (direct id, or by-name search
//      when the course has a local, non-GCA id)
//   3. A plausible extrapolated layout from the course's total par — always
//      succeeds as long as *a* par is known, and every hole is flagged
//      `estimated: true` so callers never present it as the real scorecard
export async function resolveHoles(
  courseId: string,
  fallback?: { par?: number; holes?: 9 | 18; name?: string },
): Promise<ResolvedHoles> {
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
        handicap: h.hdcp ?? undefined, estimated: false,
      })),
    };
  }

  // Only fetched once, lazily, if neither the caller's fallback nor the
  // faster paths above already gave us what we need
  let profile: CourseProfile | null | undefined;
  async function getProfile(): Promise<CourseProfile | null> {
    if (profile === undefined) profile = await resolveCourseProfile(courseId);
    return profile;
  }

  if (GCA_KEY) {
    let rawHoles = null;
    if (courseId.startsWith('gca-')) {
      const detail = await gcaCourseDetail(courseId.replace(/^gca-/, ''), GCA_KEY);
      rawHoles = detail ? extractHoles(detail) : null;
    } else {
      const name = fallback?.name ?? (await getProfile())?.name;
      if (name) rawHoles = await findHolesByName(name, GCA_KEY);
    }
    if (rawHoles && rawHoles.length >= 9) {
      return { source: 'gca', holes: rawHoles.map((h) => ({ ...h, estimated: false })) };
    }
  }

  const resolvedProfile = fallback?.par && fallback?.holes ? null : await getProfile();
  const par = fallback?.par ?? resolvedProfile?.par ?? 72;
  const numHoles = fallback?.holes ?? resolvedProfile?.holes ?? 18;
  return { source: 'estimated', holes: extrapolateHoles(par, numHoles) };
}
