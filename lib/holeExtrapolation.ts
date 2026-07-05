// Pure functions only — no server-only imports (db/fetch) — so this can be
// used from both API routes and client components (e.g. the live round
// store extrapolating locally for a course with no id).

export interface HoleProfile {
  holeNumber: number;
  par: number;
  yardage?: number;
  handicap?: number;
  estimated: boolean;
}

const TYPICAL_YARDAGE: Record<number, number> = { 3: 160, 4: 400, 5: 540 };

// Well-spread base templates for the standard par-72/par-36 makeup (4 par-3s,
// 10 par-4s, 4 par-5s for 18; 2/5/2 for 9) — no two special holes adjacent,
// nothing clumped at either end. Non-standard total pars are reached by
// nudging individual par-4 holes in this template up or down, so the spread
// stays intact even after adjustment.
const TEMPLATE_18 = [4, 5, 4, 3, 4, 4, 5, 4, 3, 4, 4, 3, 5, 4, 4, 3, 4, 5];
const TEMPLATE_9 = [4, 5, 4, 3, 4, 4, 3, 4, 5];

export function extrapolateHoles(totalPar: number, numHoles: 9 | 18): HoleProfile[] {
  const pars = [...(numHoles === 18 ? TEMPLATE_18 : TEMPLATE_9)];
  let sum = pars.reduce((a, b) => a + b, 0);

  // Nudge par-4 holes toward the course's actual total par, starting from
  // the middle outward so any adjustment stays visually spread out too
  const order = [...pars.keys()].sort((a, b) => Math.abs(a - pars.length / 2) - Math.abs(b - pars.length / 2));
  for (const idx of order) {
    if (sum === totalPar) break;
    if (pars[idx] !== 4) continue;
    if (sum < totalPar) { pars[idx] = 5; sum += 1; } else { pars[idx] = 3; sum -= 1; }
  }
  if (sum !== totalPar) pars[pars.length - 1] += totalPar - sum;

  return pars.map((par, i) => ({
    holeNumber: i + 1,
    par,
    yardage: TYPICAL_YARDAGE[par] ?? 400,
    estimated: true,
  }));
}
