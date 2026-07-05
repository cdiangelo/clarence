// Client for OpenGolfAPI (opengolfapi.org) — a free, keyless, OSM-derived
// open golf course database. Used as a third fallback tier in resolveHoles(),
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
import type { HoleData } from './golfCourseApi';

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

// Accepts several plausible field-name variants since the exact response
// shape is unverified; requires every hole to have a real numeric par or
// the whole result is rejected as unusable, rather than partially fabricated.
function normalizeHoles(raw: unknown): HoleData[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const list = obj.holes ?? obj.scorecard;
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

// Mirrors findHolesByName()'s GCA track-matching fix: local names like
// "Harborside International - Port" need the trailing track segment split
// off before searching, then used to disambiguate multi-track clubs.
export async function findHolesByNameOpenGolf(courseName: string): Promise<HoleData[] | null> {
  const dashMatch = courseName.match(/^(.+?)\s+[-–]\s+(.+)$/);
  const baseName = dashMatch ? dashMatch[1] : courseName;
  const trackHint = dashMatch ? dashMatch[2].toLowerCase() : null;

  let results = await openGolfSearch(baseName);
  if (results.length === 0 && baseName !== courseName) {
    results = await openGolfSearch(courseName);
  }
  if (results.length === 0) {
    console.error('[findHolesByNameOpenGolf] no results for', { courseName, baseName });
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
      console.error('[findHolesByNameOpenGolf] holes fetch non-ok', res.status, await res.text().catch(() => ''));
      return null;
    }
    const holes = normalizeHoles(await res.json());
    if (!holes) {
      console.error('[findHolesByNameOpenGolf] matched course but response was not a usable scorecard', { courseName, matchedId: best.id });
    }
    return holes;
  } catch (e) {
    console.error('[findHolesByNameOpenGolf] holes fetch failed', e);
    return null;
  }
}
