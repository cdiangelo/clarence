// Client for OpenGolfAPI (opengolfapi.org) — a free, keyless, OSM-derived
// open golf course database. Used as a third fallback tier in resolveTees(),
// behind our own DB and GolfCourseAPI, for courses neither of those cover.
//
// IMPORTANT: this integration has NOT been exercised against the live API —
// this sandbox's network blocks api.opengolfapi.org, so the exact response
// shape below is inferred from their public docs/schema repo, not a real
// response. The parsing here is deliberately defensive: if a response
// doesn't look like a genuinely complete scorecard, this returns null rather
// than guess at field names and risk emitting wrong-but-plausible data.
// Verify against the live API (from Render, or locally) before trusting it.
import { fetchWithTimeout } from './http';
import type { HoleData, TeeData } from './golfCourseApi';

const OPENGOLF_BASE = 'https://api.opengolfapi.org/v1';
const OPENGOLF_KEY = process.env.OPENGOLF_API_KEY ?? '';

interface OpenGolfSearchResult {
  id: string;
  name?: string;
  club_name?: string;
  course_name?: string;
  state?: string;
}

function headers(): Record<string, string> {
  return OPENGOLF_KEY ? { Authorization: `Bearer ${OPENGOLF_KEY}` } : {};
}

async function openGolfSearch(query: string): Promise<OpenGolfSearchResult[]> {
  try {
    const res = await fetchWithTimeout(
      `${OPENGOLF_BASE}/courses/search?q=${encodeURIComponent(query)}&limit=10`,
      headers(),
    );
    if (!res.ok) {
      console.error('[openGolfSearch] non-ok', res.status, await res.text().catch(() => ''));
      return [];
    }
    const data = await res.json() as { courses?: OpenGolfSearchResult[]; results?: OpenGolfSearchResult[] };
    return data.courses ?? data.results ?? (Array.isArray(data) ? data as OpenGolfSearchResult[] : []);
  } catch (e) {
    console.error('[openGolfSearch] fetch failed', e);
    return [];
  }
}

function resultName(c: OpenGolfSearchResult): string {
  return c.name ?? (c.course_name ? `${c.club_name ?? ''} ${c.course_name}`.trim() : c.club_name ?? '');
}

function normalizeHoleList(list: unknown): HoleData[] | null {
  if (!Array.isArray(list) || list.length < 9) return null;
  const holes: HoleData[] = [];
  for (const [i, h] of list.entries()) {
    if (!h || typeof h !== 'object') return null;
    const entry = h as Record<string, unknown>;
    const holeNumber = Number(entry.hole ?? entry.holeNumber ?? entry.number ?? i + 1);
    const par = Number(entry.par);
    if (!Number.isFinite(holeNumber) || !Number.isFinite(par)) return null;

    const yardageRaw = entry.yardage ?? entry.yards ?? entry.distance;
    const handicapRaw = entry.handicap ?? entry.handicap_index ?? entry.stroke_index ?? entry.hcp;
    holes.push({
      holeNumber,
      par,
      yardage: typeof yardageRaw === 'number' ? yardageRaw : undefined,
      handicap: typeof handicapRaw === 'number' ? handicapRaw : undefined,
    });
  }
  return holes;
}

// Accepts several plausible response shapes since the exact schema is
// unverified: a `tees` array (each with its own named holes) is preferred;
// a flat `holes`/`scorecard` array is treated as a single synthetic
// "Standard" tee when no per-tee breakdown is present.
function normalizeTees(raw: unknown): TeeData[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.tees)) {
    const out: TeeData[] = [];
    for (const t of obj.tees) {
      if (!t || typeof t !== 'object') continue;
      const tee = t as Record<string, unknown>;
      const holes = normalizeHoleList(tee.holes ?? tee.scorecard);
      if (!holes) continue;
      out.push({
        name: typeof tee.name === 'string' ? tee.name : 'Standard',
        gender: tee.gender === 'female' ? 'female' : tee.gender === 'male' ? 'male' : undefined,
        rating18: typeof tee.rating === 'number' ? tee.rating : typeof tee.course_rating === 'number' ? tee.course_rating : undefined,
        slope18: typeof tee.slope === 'number' ? tee.slope : typeof tee.slope_rating === 'number' ? tee.slope_rating : undefined,
        par: holes.reduce((s, h) => s + h.par, 0),
        holesCount: holes.length === 9 ? 9 : 18,
        holes,
      });
    }
    return out.length > 0 ? out : null;
  }

  const flatHoles = normalizeHoleList(obj.holes ?? obj.scorecard);
  if (!flatHoles) return null;
  return [{
    name: 'Standard',
    par: flatHoles.reduce((s, h) => s + h.par, 0),
    holesCount: flatHoles.length === 9 ? 9 : 18,
    holes: flatHoles,
  }];
}

// Mirrors findTeesByName()'s GCA track-matching fix: local names like
// "Harborside International - Port" need the trailing track segment split
// off before searching, then used to disambiguate multi-track clubs.
export async function findTeesByNameOpenGolf(courseName: string): Promise<TeeData[] | null> {
  const dashMatch = courseName.match(/^(.+?)\s+[-–]\s+(.+)$/);
  const baseName = dashMatch ? dashMatch[1] : courseName;
  const trackHint = dashMatch ? dashMatch[2].toLowerCase() : null;

  let results = await openGolfSearch(baseName);
  if (results.length === 0 && baseName !== courseName) {
    results = await openGolfSearch(courseName);
  }
  if (results.length === 0) {
    console.error('[findTeesByNameOpenGolf] no results for', { courseName, baseName });
    return null;
  }

  const normalizedBase = baseName.toLowerCase();
  const best =
    (trackHint && results.find((c) => resultName(c).toLowerCase().includes(trackHint))) ||
    results.find((c) => {
      const full = resultName(c).toLowerCase();
      return full.includes(normalizedBase) || normalizedBase.includes(full);
    }) ||
    results[0];

  try {
    const res = await fetchWithTimeout(`${OPENGOLF_BASE}/courses/${encodeURIComponent(best.id)}/holes`, headers());
    if (!res.ok) {
      console.error('[findTeesByNameOpenGolf] holes fetch non-ok', res.status, await res.text().catch(() => ''));
      return null;
    }
    const tees = normalizeTees(await res.json());
    if (!tees) {
      console.error('[findTeesByNameOpenGolf] matched course but response was not a usable scorecard', { courseName, matchedId: best.id });
    }
    return tees;
  } catch (e) {
    console.error('[findTeesByNameOpenGolf] holes fetch failed', e);
    return null;
  }
}
