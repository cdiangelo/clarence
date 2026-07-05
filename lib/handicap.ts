// WHS World Handicap System — 2024 rules implementation

export interface RoundInput {
  id: string;
  date: string; // ISO date string
  score: number; // adjusted gross score
  courseRating: number;
  slopeRating: number;
  holes: 9 | 18;
  isNine?: boolean;
}

export interface ScoreDifferential {
  roundId: string;
  date: string;
  differential: number;
  holes: 9 | 18;
  paired?: boolean; // 9-hole rounds get paired
  notes?: string;
}

export interface HandicapResult {
  handicapIndex: number | null;
  roundsUsed: number;
  differentials: ScoreDifferential[];
  smallSampleAdj: number;
  message?: string;
}

// WHS table: [rounds available] → [# to use, adjustment]
const WHS_TABLE: Record<number, [number, number]> = {
  3:  [1, -2.0],
  4:  [1, -1.0],
  5:  [1,  0.0],
  6:  [2, -1.0],
  7:  [2,  0.0],
  8:  [2,  0.0],
  9:  [3, -1.0],
  10: [3,  0.0],
  11: [3,  0.0],
  12: [4,  0.0],
  13: [4,  0.0],
  14: [4,  0.0],
  15: [5,  0.0],
  16: [5,  0.0],
  17: [6,  0.0],
  18: [6,  0.0],
  19: [7,  0.0],
  20: [8,  0.0],
};

// Calculate a score differential for a single 18-hole round
export function calcDifferential18(score: number, courseRating: number, slopeRating: number): number {
  return ((score - courseRating) * 113) / slopeRating;
}

// For a 9-hole round, calculate the 9-hole differential
// WHS: 9-hole diff = (adjusted score - 9-hole course rating) × 113 / 9-hole slope
export function calcDifferential9(score: number, courseRating9: number, slopeRating9: number): number {
  return ((score - courseRating9) * 113) / slopeRating9;
}

// Build differential list from rounds
// 9-hole rounds are paired in sequence; unpaired 9-hole rounds are held until paired
export function buildDifferentials(rounds: RoundInput[]): ScoreDifferential[] {
  const sorted = [...rounds].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const result: ScoreDifferential[] = [];
  const pendingNine: ScoreDifferential[] = [];

  for (const r of sorted) {
    if (r.holes === 18) {
      const diff = calcDifferential18(r.score, r.courseRating, r.slopeRating);
      result.push({ roundId: r.id, date: r.date, differential: diff, holes: 18 });
    } else {
      // 9-hole: queue until we have a pair
      const diff9 = calcDifferential9(r.score, r.courseRating, r.slopeRating);
      pendingNine.push({ roundId: r.id, date: r.date, differential: diff9, holes: 9 });

      if (pendingNine.length >= 2) {
        const a = pendingNine.shift()!;
        const b = pendingNine.shift()!;
        const combined = a.differential + b.differential;
        // Combined entry uses the later date
        result.push({
          roundId: `${a.roundId}+${b.roundId}`,
          date: b.date,
          differential: combined,
          holes: 18,
          paired: true,
          notes: `Combined from two 9-hole rounds (${a.roundId}, ${b.roundId})`,
        });
      }
    }
  }

  return result;
}

// Main WHS handicap calculation
export function calcHandicapIndex(rounds: RoundInput[]): HandicapResult {
  if (rounds.length < 3) {
    return { handicapIndex: null, roundsUsed: 0, differentials: [], smallSampleAdj: 0, message: 'Need at least 3 rounds to establish a handicap index.' };
  }

  const differentials = buildDifferentials(rounds);
  // Use only last 20 (18-hole equivalents, sorted by date desc)
  const recent = [...differentials]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  const n = recent.length;
  const entry = WHS_TABLE[Math.min(n, 20)] ?? WHS_TABLE[20];
  const [countToUse, adjustment] = entry;

  // Sort by differential ascending (lowest = best scores)
  const sorted = [...recent].sort((a, b) => a.differential - b.differential);
  const best = sorted.slice(0, countToUse);

  const avg = best.reduce((s, d) => s + d.differential, 0) / best.length;
  const rawIndex = avg + adjustment;
  const handicapIndex = Math.round(rawIndex * 10) / 10; // 1 decimal place

  return {
    handicapIndex: Math.max(0, handicapIndex),
    roundsUsed: countToUse,
    differentials: recent,
    smallSampleAdj: adjustment,
  };
}

// Course handicap from handicap index
export function courseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number,
): number {
  return Math.round((handicapIndex * slopeRating) / 113 + (courseRating - par));
}

// Playing handicap (same as course handicap for stroke play)
export function playingHandicap(courseHcp: number, allowance = 1.0): number {
  return Math.round(courseHcp * allowance);
}

// Season statistics
export interface SeasonStats {
  roundsYTD: number;
  avgScore: number | null;
  avgScoreOverPar: number | null;
  lowestDiff: number | null;
  monthlyData: { month: string; count: number; avgScore: number | null }[];
}

export function calcSeasonStats(rounds: RoundInput[], year?: number): SeasonStats {
  const yr = year ?? new Date().getFullYear();
  const ytd = rounds.filter((r) => new Date(r.date).getFullYear() === yr && r.holes === 18);

  const avgScore = ytd.length > 0 ? ytd.reduce((s, r) => s + r.score, 0) / ytd.length : null;
  const avgScoreOverPar = null; // populated externally with course par data

  const diffs = buildDifferentials(ytd);
  const lowestDiff = diffs.length > 0 ? Math.min(...diffs.map((d) => d.differential)) : null;

  // Group by month
  const byMonth: Record<string, number[]> = {};
  for (const r of ytd) {
    const m = new Date(r.date).toLocaleString('en-US', { month: 'short' });
    byMonth[m] = [...(byMonth[m] ?? []), r.score];
  }

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = months.map((month) => {
    const scores = byMonth[month] ?? [];
    return {
      month,
      count: scores.length,
      avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    };
  });

  return { roundsYTD: ytd.length, avgScore, avgScoreOverPar, lowestDiff, monthlyData };
}
