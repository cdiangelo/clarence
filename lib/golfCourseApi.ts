// Shared client for api.golfcourseapi.com — the real response shape wraps
// course detail under a `course` key, and hole-by-hole data lives nested
// inside `tees.male[].holes` / `tees.female[].holes`, not at the top level.
import { fetchWithTimeout } from './http';

const GCA_BASE = 'https://api.golfcourseapi.com/v1';

export interface GcaHoleRaw {
  par?: number;
  yardage?: number;
  handicap?: number;
}

export interface GcaTeeRaw {
  tee_name?: string;
  course_rating?: number;
  slope_rating?: number;
  par_total?: number;
  number_of_holes?: number;
  holes?: GcaHoleRaw[];
}

export interface GcaCourseRaw {
  id: string | number;
  club_name: string;
  course_name?: string;
  location?: { city?: string; state?: string; latitude?: number; longitude?: number };
  tees?: { male?: GcaTeeRaw[]; female?: GcaTeeRaw[] };
}

export interface NormalizedCourse {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  par: number;
  rating18?: number;
  slope18?: number;
  holes: 9 | 18;
  verified: false;
}

export interface HoleData {
  holeNumber: number;
  par: number;
  yardage?: number;
  handicap?: number;
}

function pickTee(tees?: { male?: GcaTeeRaw[]; female?: GcaTeeRaw[] }): GcaTeeRaw | undefined {
  const list = [...(tees?.male ?? []), ...(tees?.female ?? [])];
  const blue = list.find((t) => /blue/i.test(t.tee_name ?? ''));
  const white = list.find((t) => /white/i.test(t.tee_name ?? ''));
  return blue ?? white ?? list[0];
}

export function normalizeSearchResult(c: GcaCourseRaw): NormalizedCourse {
  const tee = pickTee(c.tees);
  return {
    id: `gca-${c.id}`,
    name: c.course_name ? `${c.club_name} — ${c.course_name}` : c.club_name,
    city: c.location?.city ?? '',
    state: c.location?.state ?? '',
    lat: c.location?.latitude ?? 0,
    lng: c.location?.longitude ?? 0,
    par: tee?.par_total ?? 72,
    rating18: tee?.course_rating,
    slope18: tee?.slope_rating,
    holes: tee?.number_of_holes === 9 ? 9 : 18,
    verified: false,
  };
}

export function extractHoles(c: GcaCourseRaw): HoleData[] | null {
  const tee = pickTee(c.tees);
  if (!tee?.holes || tee.holes.length < 9) return null;
  return tee.holes.map((h, i) => ({
    holeNumber: i + 1,
    par: h.par ?? 4,
    yardage: h.yardage,
    handicap: h.handicap,
  }));
}

export async function gcaSearch(query: string, apiKey: string): Promise<GcaCourseRaw[]> {
  if (!apiKey) return [];
  try {
    const res = await fetchWithTimeout(
      `${GCA_BASE}/search?search_query=${encodeURIComponent(query)}`,
      { Authorization: `Key ${apiKey}` },
    );
    if (!res.ok) {
      console.error('[gcaSearch] non-ok', res.status, await res.text().catch(() => ''));
      return [];
    }
    const data = await res.json() as { courses?: GcaCourseRaw[] };
    return data.courses ?? [];
  } catch (e) {
    console.error('[gcaSearch] fetch failed', e);
    return [];
  }
}

export async function gcaCourseDetail(id: string, apiKey: string): Promise<GcaCourseRaw | null> {
  if (!apiKey) return null;
  try {
    const res = await fetchWithTimeout(`${GCA_BASE}/courses/${id}`, { Authorization: `Key ${apiKey}` });
    if (!res.ok) {
      console.error('[gcaCourseDetail] non-ok', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json() as { course?: GcaCourseRaw } & Partial<GcaCourseRaw>;
    // API wraps detail responses as { course: {...} } — fall back to flat shape defensively
    return data.course ?? (data.id != null ? (data as GcaCourseRaw) : null);
  } catch (e) {
    console.error('[gcaCourseDetail] fetch failed', e);
    return null;
  }
}

// Seed/DB courses have their own local ids (e.g. 'harborside-port'), never
// 'gca-' prefixed, so get_course_holes has no id to hand the API directly —
// even though the real course very likely exists there too. This bridges
// the gap by searching GCA BY NAME and pulling holes from whatever it finds,
// rather than requiring the course to have originated from a GCA search.
export async function findHolesByName(courseName: string, apiKey: string): Promise<HoleData[] | null> {
  if (!apiKey) return null;

  // Local names often append the specific track after a dash — e.g.
  // "Harborside International - Port" — but GCA's club_name is just the
  // facility ("Harborside International Golf Center"), with the track in a
  // separate course_name field ("Port"). Searching on the full local string
  // (dash and all) can return zero matches even when the club is in GCA's
  // database, since it never appears verbatim anywhere in their data. Search
  // on the base club name instead, and use the trailing segment to pick the
  // right track out of the (likely multiple) results for that club.
  const dashMatch = courseName.match(/^(.+?)\s+[-–]\s+(.+)$/);
  const baseName = dashMatch ? dashMatch[1] : courseName;
  const trackHint = dashMatch ? dashMatch[2].toLowerCase() : null;

  let results = await gcaSearch(baseName, apiKey);
  if (results.length === 0 && baseName !== courseName) {
    results = await gcaSearch(courseName, apiKey);
  }
  if (results.length === 0) {
    console.error('[findHolesByName] no GCA search results for', { courseName, baseName });
    return null;
  }

  const normalizedBase = baseName.toLowerCase();
  const best =
    (trackHint && results.find((c) => (c.course_name ?? '').toLowerCase().includes(trackHint))) ||
    results.find((c) => {
      const full = (c.course_name ? `${c.club_name} ${c.course_name}` : c.club_name).toLowerCase();
      return full.includes(normalizedBase) || normalizedBase.includes(c.club_name.toLowerCase());
    }) ||
    results[0];

  const detail = await gcaCourseDetail(String(best.id), apiKey);
  if (!detail) return null;
  const holes = extractHoles(detail);
  if (!holes) {
    console.error('[findHolesByName] matched course but GCA has no hole-level data', { courseName, matchedId: best.id, matchedName: best.club_name });
  }
  return holes;
}
