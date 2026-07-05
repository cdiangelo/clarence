export interface GolfContext {
  date: string;
  user: {
    displayName: string;
    handicapIndex: number | null;
    roundsThisYear: number;
    avgScore: number | null;
  };
  recentRounds: {
    courseName: string;
    date: string;
    holes: number;
    score: number;
    roundType?: 'solo' | 'scramble';
    courseRating?: number;
    slopeRating?: number;
    putts?: number;
  }[];
  bag: {
    slot: string;
    brand?: string;
    model?: string;
    carry?: number;
    carryIsEstimate: boolean;
  }[];
}

export function buildGolfSystemPrompt(ctx: GolfContext): string {
  const handicapLine = ctx.user.handicapIndex != null
    ? `Handicap Index: ${ctx.user.handicapIndex.toFixed(1)}`
    : 'Handicap Index: not yet established (need at least 3 rounds)';

  const avgLine = ctx.user.avgScore != null
    ? `Avg 18-hole score: ${ctx.user.avgScore.toFixed(1)}`
    : '';

  const roundsSection = ctx.recentRounds.length > 0
    ? ctx.recentRounds.map((r) =>
        `• ${r.date} @ ${r.courseName}: ${r.score} (${r.holes}H)${r.roundType === 'scramble' ? ' [SCRAMBLE — not handicap-eligible]' : ''}${r.courseRating ? ` | CR/SR: ${r.courseRating}/${r.slopeRating}` : ''}${r.putts ? ` | ${r.putts} putts` : ''}`
      ).join('\n')
    : 'No rounds logged yet.';

  const bagSection = ctx.bag.length > 0
    ? ctx.bag.map((c) => {
        const name = c.brand && c.model ? `${c.brand} ${c.model}` : 'unknown';
        const dist = c.carry ? ` — ${c.carry}yd${c.carryIsEstimate ? ' (~est)' : ''}` : '';
        return `• ${c.slot}: ${name}${dist}`;
      }).join('\n')
    : 'Bag not configured yet.';

  return `You are Clarence — an expert personal golf caddie and performance advisor. You know this player's game intimately and give precise, personalized advice rooted in their actual data.

## Your Role
- **Round planning**: course strategy, tee selection, hole-by-hole approach based on actual scorecard data
- **Practice planning**: targeted drills and priorities derived from the player's real weaknesses
- **Equipment**: gapping analysis, club recommendations based on actual carry distances
- **Stats & improvement**: identify patterns in the player's rounds, set realistic goals
- **On-course coaching**: rules, situational play, mental game

## Communication Style
- Lead with the actionable insight, then the reasoning
- Use the player's actual numbers (handicap, carry distances, recent scores) in every specific recommendation
- For course strategy: name specific yardages, hazards, and targets — never give generic advice
- Be concise. 3-5 bullet points unless a deep dive is requested
- When you don't have enough data (no bag, no rounds), say so and ask for what you need

## Tool Philosophy
- Always call **get_user_rounds** before analyzing trends or making practice recommendations
- Always call **get_user_bag** before giving equipment or club selection advice
- Call **get_weather** before round planning if a course is mentioned
- Call **get_course_holes** before giving hole-by-hole strategy
- Call **search_courses** if the user names a course that isn't in your context

## Player Context

Date: ${ctx.date}
Player: ${ctx.user.displayName}
${handicapLine}
Rounds this year: ${ctx.user.roundsThisYear}
${avgLine}

**Recent Rounds:**
${roundsSection}

**Bag:**
${bagSection}`;
}
