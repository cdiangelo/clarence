import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { callClaude } from '@/lib/claude';
import { buildGolfSystemPrompt } from '@/lib/prompts';
import { calcHandicapIndex, calcSeasonStats } from '@/lib/handicap';
import { query } from '@/db/client';
import { COURSES } from '@/data/courses';
import { gcaSearch, normalizeSearchResult } from '@/lib/golfCourseApi';
import { resolveHoles } from '@/lib/courseData';
import { getWeather } from '@/lib/weather';
import type { Message, TextBlock, ToolUseBlock, ToolResultBlock } from '@/lib/claude';

export const maxDuration = 120;

const GCA_KEY = process.env.GOLF_COURSE_API_KEY ?? '';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.userId;

  const body = await req.json() as {
    message: string;
    history: { role: 'user' | 'assistant'; content: string }[];
    sessionId?: string;
  };

  // Resolve or create the chat session this exchange belongs to
  let chatSessionId = body.sessionId;
  if (chatSessionId) {
    const owned = await query<{ id: string }>(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [chatSessionId, session.userId],
    ).catch(() => []);
    if (owned.length === 0) chatSessionId = undefined;
  }
  if (!chatSessionId) {
    const created = await query<{ id: string }>(
      'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING id',
      [session.userId, body.message.slice(0, 60)],
    );
    chatSessionId = created[0].id;
  }

  // Build context from DB
  const [roundRows, clubRows, userRow, sessionRows, documentRows] = await Promise.all([
    query<{
      id: string; course_name: string; date: string; holes: number; score: number; round_type: string;
      course_rating: number | null; slope_rating: number | null; putts: number | null;
    }>(
      `SELECT id, course_name, to_char(date, 'YYYY-MM-DD') AS date, holes, score, round_type,
              course_rating, slope_rating, putts
       FROM rounds WHERE user_id = $1 ORDER BY date DESC LIMIT 50`,
      [session.userId],
    ).catch(() => []),
    query<{ slot: string; carry: number | null; carry_is_estimate: boolean; brand: string | null; model: string | null }>(
      `SELECT bc.slot, bc.carry, bc.carry_is_estimate,
              COALESCE(bc.brand, cc.brand) AS brand, COALESCE(bc.model, cc.model) AS model
       FROM bag_clubs bc LEFT JOIN clubs_catalog cc ON cc.id = bc.catalog_id
       WHERE bc.user_id = $1`,
      [session.userId],
    ).catch(() => []),
    query<{ id: string; email: string; display_name: string }>(
      'SELECT id, email, display_name FROM users WHERE id = $1',
      [session.userId],
    ).then((r) => r[0]).catch(() => null),
    query<{ id: string; title: string | null; updated_at: string }>(
      `SELECT id, title, to_char(updated_at, 'YYYY-MM-DD') AS updated_at
       FROM chat_sessions
       WHERE user_id = $1 AND id != $2
       ORDER BY updated_at DESC LIMIT 8`,
      [session.userId, chatSessionId],
    ).catch(() => []),
    query<{ id: string; filename: string; char_count: number }>(
      'SELECT id, filename, char_count FROM user_documents WHERE user_id = $1 ORDER BY created_at DESC',
      [session.userId],
    ).catch(() => []),
  ]);

  // Scramble/team rounds are never WHS-eligible for a handicap index
  const roundsForHcp = roundRows
    .filter((r) => r.course_rating != null && r.slope_rating != null && r.round_type !== 'scramble')
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
      score: r.score, roundType: r.round_type === 'scramble' ? 'scramble' as const : 'solo' as const,
      courseRating: r.course_rating ?? undefined,
      slopeRating: r.slope_rating ?? undefined, putts: r.putts ?? undefined,
    })),
    bag: clubRows.map((c) => ({
      slot: c.slot, brand: c.brand ?? undefined, model: c.model ?? undefined,
      carry: c.carry ?? undefined, carryIsEstimate: c.carry_is_estimate,
    })),
    recentSessions: sessionRows.map((s) => ({
      id: s.id, date: s.updated_at, title: s.title ?? 'Untitled chat',
    })),
    documents: documentRows.map((d) => ({
      id: d.id, filename: d.filename, charCount: d.char_count,
    })),
  });

  const toolsUsed: string[] = [];

  async function handleTool(name: string, input: Record<string, unknown>): Promise<string> {
    switch (name) {
      case 'get_weather': {
        const { lat, lng, location } = input as { lat: number; lng: number; location?: string };
        return getWeather(lat, lng, location);
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
          const { holes, source } = await resolveHoles(courseId);
          return JSON.stringify({
            courseId,
            holes,
            source,
            note: source === 'none'
              ? 'No real scorecard data is available for this course (not in our DB or the Golf Course API). Tell the player honestly that hole-by-hole data isn\'t available — do not guess or estimate par/yardage.'
              : undefined,
          });
        } catch (e) { return `Error fetching holes: ${(e as Error).message}`; }
      }

      case 'get_user_rounds': {
        const limit = Math.min((input.limit as number) ?? 20, 50);
        return JSON.stringify({
          rounds: roundRows.slice(0, limit).map((r) => ({
            courseName: r.course_name, date: r.date, holes: r.holes,
            roundType: r.round_type === 'scramble' ? 'scramble' : 'solo',
            score: r.score, courseRating: r.course_rating, slopeRating: r.slope_rating, putts: r.putts,
          })),
          handicapIndex: hcpResult.handicapIndex,
          handicapNote: 'handicapIndex excludes scramble/team rounds per WHS rules',
          seasonStats,
        });
      }

      case 'get_user_document': {
        const { documentId } = input as { documentId: string };
        try {
          const rows = await query<{ filename: string; content: string }>(
            'SELECT filename, content FROM user_documents WHERE id = $1 AND user_id = $2',
            [documentId, userId],
          );
          if (rows.length === 0) return JSON.stringify({ error: 'Document not found' });
          return JSON.stringify({ filename: rows[0].filename, content: rows[0].content });
        } catch (e) { return `Error fetching document: ${(e as Error).message}`; }
      }

      case 'get_user_bag': {
        return JSON.stringify({
          clubs: clubRows.map((c) => ({
            slot: c.slot, brand: c.brand, model: c.model,
            carry: c.carry, carryIsEstimate: c.carry_is_estimate,
          })),
        });
      }

      case 'get_chat_history': {
        const { sessionId: targetId } = input as { sessionId?: string };
        try {
          const targetSession = targetId
            ? await query<{ id: string; title: string | null }>(
                'SELECT id, title FROM chat_sessions WHERE id = $1 AND user_id = $2',
                [targetId, userId],
              )
            : await query<{ id: string; title: string | null }>(
                `SELECT id, title FROM chat_sessions WHERE user_id = $1 AND id != $2
                 ORDER BY updated_at DESC LIMIT 1`,
                [userId, chatSessionId],
              );

          if (targetSession.length === 0) return JSON.stringify({ error: 'No matching prior conversation found' });

          const priorMessages = await query<{ role: string; content: string }>(
            'SELECT role, content FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 60',
            [targetSession[0].id],
          );

          return JSON.stringify({
            title: targetSession[0].title,
            messages: priorMessages.map((m) => ({ role: m.role, content: m.content })),
          });
        } catch (e) { return `Error fetching chat history: ${(e as Error).message}`; }
      }

      default:
        return `Unknown tool: ${name}`;
    }
  }

  let messages: Message[] = [
    ...body.history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: body.message },
  ];

  // Persist the user's message immediately so it's in the archive even if
  // the Claude call below fails
  await query(
    'INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)',
    [chatSessionId, 'user', body.message],
  ).catch((e) => console.error('[chat] failed to persist user message', e));

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

        await Promise.all([
          query(
            'INSERT INTO chat_messages (session_id, role, content, tools_used) VALUES ($1, $2, $3, $4)',
            [chatSessionId, 'assistant', text, toolsUsed.length ? toolsUsed : null],
          ),
          query('UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1', [chatSessionId]),
        ]).catch((e) => console.error('[chat] failed to persist assistant message', e));

        return NextResponse.json({ text, toolsUsed, sessionId: chatSessionId });
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
