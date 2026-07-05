import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { callClaude } from '@/lib/claude';
import { buildGolfSystemPrompt } from '@/lib/prompts';
import { calcHandicapIndex, calcSeasonStats } from '@/lib/handicap';
import { query } from '@/db/client';
import { COURSES } from '@/data/courses';
import { gcaSearch, gcaCourseDetail, normalizeSearchResult, extractHoles } from '@/lib/golfCourseApi';
import type { Message, TextBlock, ToolUseBlock, ToolResultBlock } from '@/lib/claude';

export const maxDuration = 120;

const GCA_KEY = process.env.GOLF_COURSE_API_KEY ?? '';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    message: string;
    history: { role: 'user' | 'assistant'; content: string }[];
  };

  // Build context from DB
  const [roundRows, clubRows, userRow] = await Promise.all([
    query<{
      id: string; course_name: string; date: string; holes: number; score: number;
      course_rating: number | null; slope_rating: number | null; putts: number | null;
    }>(
      'SELECT id, course_name, date, holes, score, course_rating, slope_rating, putts FROM rounds WHERE user_id = $1 ORDER BY date DESC LIMIT 50',
      [session.userId],
    ).catch(() => []),
    query<{ slot: string; carry: number | null; carry_is_estimate: boolean; brand: string | null; model: string | null }>(
      `SELECT bc.slot, bc.carry, bc.carry_is_estimate, cc.brand, cc.model
       FROM bag_clubs bc LEFT JOIN clubs_catalog cc ON cc.id = bc.catalog_id
       WHERE bc.user_id = $1`,
      [session.userId],
    ).catch(() => []),
    query<{ id: string; email: string; display_name: string }>(
      'SELECT id, email, display_name FROM users WHERE id = $1',
      [session.userId],
    ).then((r) => r[0]).catch(() => null),
  ]);

  const roundsForHcp = roundRows
    .filter((r) => r.course_rating != null && r.slope_rating != null)
    .map((r) => ({
      id: r.id, courseName: r.course_name, date: r.date, holes: r.holes as 9 | 18,
      score: r.score, courseRating: r.course_rating!, slopeRating: r.slope_rating!,
    }));

  const hcpResult = calcHandicapIndex(roundsForHcp);
  const seasonStats = calcSeasonStats(roundsForHcp);

  const system = buildGolfSystemPrompt({
    date: new Date().toISOString().slice(0, 10),
    user: {
      displayName: userRow?.display_name ?? 'Golfer',
      handicapIndex: hcpResult.handicapIndex,
      roundsThisYear: seasonStats.roundsYTD,
      avgScore: seasonStats.avgScore,
    },
    recentRounds: roundRows.slice(0, 10).map((r) => ({
      courseName: r.course_name, date: r.date, holes: r.holes as 9 | 18,
      score: r.score, courseRating: r.course_rating ?? undefined,
      slopeRating: r.slope_rating ?? undefined, putts: r.putts ?? undefined,
    })),
    bag: clubRows.map((c) => ({
      slot: c.slot, brand: c.brand ?? undefined, model: c.model ?? undefined,
      carry: c.carry ?? undefined, carryIsEstimate: c.carry_is_estimate,
    })),
  });

  const toolsUsed: string[] = [];

  async function handleTool(name: string, input: Record<string, unknown>): Promise<string> {
    switch (name) {
      case 'get_weather': {
        const { lat, lng, location } = input as { lat: number; lng: number; location?: string };
        try {
          const url = new URL('https://api.open-meteo.com/v1/forecast');
          url.searchParams.set('latitude', String(lat));
          url.searchParams.set('longitude', String(lng));
          url.searchParams.set('current', 'temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,relative_humidity_2m');
          url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,wind_speed_10m,weather_code');
          url.searchParams.set('temperature_unit', 'fahrenheit');
          url.searchParams.set('wind_speed_unit', 'mph');
          url.searchParams.set('forecast_days', '1');
          url.searchParams.set('timezone', 'auto');
          const res = await fetch(url.toString());
          if (!res.ok) {
            console.error('[get_weather] open-meteo non-ok', res.status, await res.text().catch(() => ''));
            return 'Weather data unavailable';
          }
          const data = await res.json();
          return JSON.stringify({ location: location ?? `${lat},${lng}`, ...data });
        } catch (e) {
          console.error('[get_weather] fetch failed', e);
          return 'Weather service error';
        }
      }

      case 'search_courses': {
        const { query: q } = input as { query: string };
        try {
          // 1. DB search
          const dbRows = await query<{
            id: string; name: string; city: string; state: string;
            lat: number; lng: number; par: number;
            rating18: number | null; slope18: number | null; holes_count: number; verified: boolean;
          }>(
            `SELECT id, name, city, state, lat, lng, par, rating18, slope18, holes_count, verified
             FROM courses WHERE name ILIKE $1 OR city ILIKE $1 ORDER BY verified DESC, name LIMIT 8`,
            [`%${q}%`],
          ).catch(() => []);

          if (dbRows.length >= 3) {
            return JSON.stringify({ courses: dbRows.map((r) => ({ ...r, holes: r.holes_count })) });
          }

          // 2. Seed data
          const seedMatches = COURSES.filter((c) =>
            c.name.toLowerCase().includes(q.toLowerCase()) ||
            c.city.toLowerCase().includes(q.toLowerCase())
          ).slice(0, 8);

          if (seedMatches.length >= 3) {
            return JSON.stringify({ courses: seedMatches });
          }

          // 3. Golf Course API — normalizeSearchResult includes lat/lng so
          // get_weather can be called for these courses too
          if (GCA_KEY) {
            const rawCourses = await gcaSearch(q, GCA_KEY);
            const courses = rawCourses.slice(0, 8).map(normalizeSearchResult);
            return JSON.stringify({ courses: [...seedMatches, ...courses].slice(0, 8) });
          }

          return JSON.stringify({ courses: seedMatches });
        } catch (e) { return `Course search error: ${(e as Error).message}`; }
      }

      case 'get_course_holes': {
        const { courseId } = input as { courseId: string };
        try {
          const holes = await query<{
            hole_num: number; par: number; yards_blue: number | null;
            yards_white: number | null; yards_red: number | null; hdcp: number | null;
          }>(
            'SELECT hole_num, par, yards_blue, yards_white, yards_red, hdcp FROM course_holes WHERE course_id = $1 ORDER BY hole_num',
            [courseId],
          );
          if (holes.length === 0) {
            // GCA courses have 'gca-{id}' prefixed IDs — hole arrays live nested
            // inside tees.male[].holes, and the detail response wraps the course
            // under a `course` key (see lib/golfCourseApi.ts)
            if (GCA_KEY && courseId.startsWith('gca-')) {
              const apiId = courseId.replace(/^gca-/, '');
              const detail = await gcaCourseDetail(apiId, GCA_KEY);
              const rawHoles = detail ? extractHoles(detail) : null;
              if (rawHoles && rawHoles.length >= 9) {
                return JSON.stringify({ courseId, holes: rawHoles });
              }
            }
            return JSON.stringify({ courseId, holes: [], message: 'No hole data available for this course' });
          }
          return JSON.stringify({ courseId, holes });
        } catch (e) { return `Error fetching holes: ${(e as Error).message}`; }
      }

      case 'get_user_rounds': {
        const limit = Math.min((input.limit as number) ?? 20, 50);
        return JSON.stringify({
          rounds: roundRows.slice(0, limit).map((r) => ({
            courseName: r.course_name, date: r.date, holes: r.holes,
            score: r.score, courseRating: r.course_rating, slopeRating: r.slope_rating, putts: r.putts,
          })),
          handicapIndex: hcpResult.handicapIndex,
          seasonStats,
        });
      }

      case 'get_user_bag': {
        return JSON.stringify({
          clubs: clubRows.map((c) => ({
            slot: c.slot, brand: c.brand, model: c.model,
            carry: c.carry, carryIsEstimate: c.carry_is_estimate,
          })),
        });
      }

      default:
        return `Unknown tool: ${name}`;
    }
  }

  let messages: Message[] = [
    ...body.history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: body.message },
  ];

  try {
    while (true) {
      const response = await callClaude(system, messages);

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
        const toolResults: ToolResultBlock[] = [];

        for (const block of toolUseBlocks) {
          toolsUsed.push(block.name);
          try {
            const result = await handleTool(block.name, block.input);
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
          } catch (err) {
            toolResults.push({
              type: 'tool_result', tool_use_id: block.id,
              content: `Error: ${err instanceof Error ? err.message : 'unknown'}`,
              is_error: true,
            });
          }
        }

        messages = [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ];
      } else {
        const text = (response.content.find((b): b is TextBlock => b.type === 'text'))?.text ?? '';
        return NextResponse.json({ text, toolsUsed });
      }
    }
  } catch (err) {
    console.error('[/api/chat]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
