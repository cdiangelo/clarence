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
