// Central course-data resolution layer. Every caller that needs a course's
// profile (par/rating/slope/location) or its hole-by-hole layout goes
// through here instead of re-implementing the DB → GCA → OpenGolfAPI
// fallback chain in each API route — that duplication is exactly how the
// "seed courses can never reach GCA" bug happened in the first place.
//
// This never fabricates data. If none of our sources have a real scorecard
// for a course, resolveTees() returns an empty result — callers must show
// an honest "not available" state, not an invented one.
import { query } from '@/db/client';
import {
  gcaCourseDetail, extractAllTees, findTeesByName, normalizeSearchResult,
  type HoleData, type TeeData,
} from './golfCourseApi';
import { findTeesByNameOpenGolf } from './openGolfApi';

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

// A tee set the player can pick when starting a round — real courses carry
// several (Blue/White/Gold/Red...), each with its own rating/slope, so a
// single course-level rating (as on CourseProfile) is only ever correct for
// whichever tee it happened to be recorded from.
export interface TeeOption extends TeeData {
  id: string;
}

export interface ResolvedTees {
  tees: TeeOption[];
  source: 'db' | 'gca' | 'opengolf' | 'none';
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

// Resolves every real tee set available for a course — real data only:
//   1. Already in our DB (course_tees / course_tee_holes)
//   1b. Legacy single-tee DB courses (courses.rating18/slope18 + course_holes,
//       predating per-tee storage) synthesized as one "Recorded" tee
//   2. The Golf Course API (direct id, or by-name search when the course
//      has a local, non-GCA id) — every tee it has, not just one
//   3. OpenGolfAPI (free, keyless, OSM-derived) — same, as a last resort
// If none of them have it, returns an empty result. No estimation, ever.
export async function resolveTees(courseId: string): Promise<ResolvedTees> {
  const dbTees = await query<{
    id: string; name: string; gender: string | null;
    rating18: number | null; slope18: number | null; rating9: number | null; slope9: number | null;
    holes_count: number;
  }>(
    `SELECT id, name, gender, rating18, slope18, rating9, slope9, holes_count
     FROM course_tees WHERE course_id = $1 ORDER BY sort_order, name`,
    [courseId],
  ).catch(() => []);

  if (dbTees.length > 0) {
    const tees: TeeOption[] = [];
    for (const t of dbTees) {
      const holeRows = await query<{ hole_num: number; par: number; yardage: number | null; hdcp: number | null }>(
        'SELECT hole_num, par, yardage, hdcp FROM course_tee_holes WHERE tee_id = $1 ORDER BY hole_num',
        [t.id],
      ).catch(() => []);
      if (holeRows.length < 9) continue;
      tees.push({
        id: t.id,
        name: t.name,
        gender: t.gender === 'female' ? 'female' : t.gender === 'male' ? 'male' : undefined,
        rating18: t.rating18 ?? undefined,
        slope18: t.slope18 ?? undefined,
        par: holeRows.reduce((s, h) => s + h.par, 0),
        holesCount: t.holes_count === 9 ? 9 : 18,
        holes: holeRows.map((h) => ({
          holeNumber: h.hole_num, par: h.par, yardage: h.yardage ?? undefined, handicap: h.hdcp ?? undefined,
        })),
      });
    }
    if (tees.length > 0) return { tees, source: 'db' };
  }

  // Legacy fallback for courses seeded before per-tee storage existed
  const legacyHoles = await query<{
    hole_num: number; par: number; yards_blue: number | null; yards_white: number | null; hdcp: number | null;
  }>(
    'SELECT hole_num, par, yards_blue, yards_white, hdcp FROM course_holes WHERE course_id = $1 ORDER BY hole_num',
    [courseId],
  ).catch(() => []);

  if (legacyHoles.length >= 9) {
    const profile = await resolveCourseProfile(courseId);
    return {
      source: 'db',
      tees: [{
        id: 'recorded',
        name: 'Recorded',
        rating18: profile?.rating18, slope18: profile?.slope18,
        par: legacyHoles.reduce((s, h) => s + h.par, 0),
        holesCount: legacyHoles.length === 9 ? 9 : 18,
        holes: legacyHoles.map((h) => ({
          holeNumber: h.hole_num, par: h.par, yardage: h.yards_blue ?? h.yards_white ?? undefined, handicap: h.hdcp ?? undefined,
        })),
      }],
    };
  }

  if (GCA_KEY) {
    let teeData: TeeData[] | null = null;
    if (courseId.startsWith('gca-')) {
      const detail = await gcaCourseDetail(courseId.replace(/^gca-/, ''), GCA_KEY);
      const extracted = detail ? extractAllTees(detail) : [];
      teeData = extracted.length > 0 ? extracted : null;
    } else {
      const profile = await resolveCourseProfile(courseId);
      if (profile?.name) teeData = await findTeesByName(profile.name, GCA_KEY);
    }
    if (teeData && teeData.length > 0) {
      return {
        source: 'gca',
        tees: teeData.map((t, i) => ({ ...t, id: `gca:${t.name}:${t.gender ?? i}` })),
      };
    }
  }

  if (!courseId.startsWith('gca-')) {
    const profile = await resolveCourseProfile(courseId);
    if (profile?.name) {
      const teeData = await findTeesByNameOpenGolf(profile.name);
      if (teeData && teeData.length > 0) {
        return {
          source: 'opengolf',
          tees: teeData.map((t, i) => ({ ...t, id: `opengolf:${t.name}:${t.gender ?? i}` })),
        };
      }
    }
  }

  return { tees: [], source: 'none' };
}

// Back-compat wrapper for callers that just want "a" real scorecard without
// tee selection (e.g. the chat tool's get_course_holes) — uses the first
// tee returned, which sources already put in a sensible default order
// (DB sort_order, or GCA's blue/white-first pick).
export async function resolveHoles(courseId: string): Promise<ResolvedHoles> {
  const { tees, source } = await resolveTees(courseId);
  if (tees.length === 0) return { holes: [], source: 'none' };
  return { holes: tees[0].holes, source };
}
