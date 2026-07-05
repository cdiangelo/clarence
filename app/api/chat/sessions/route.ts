import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/db/client';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessions = await query<{
    id: string; title: string | null; created_at: string; updated_at: string;
    message_count: string; snippet: string | null;
  }>(
    `SELECT cs.id, cs.title, cs.created_at, cs.updated_at,
            COUNT(cm.id) AS message_count,
            (SELECT content FROM chat_messages WHERE session_id = cs.id AND role = 'user' ORDER BY created_at ASC LIMIT 1) AS snippet
     FROM chat_sessions cs
     LEFT JOIN chat_messages cm ON cm.session_id = cs.id
     WHERE cs.user_id = $1
     GROUP BY cs.id
     HAVING COUNT(cm.id) > 0
     ORDER BY cs.updated_at DESC
     LIMIT 50`,
    [session.userId],
  );

  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title ?? (s.snippet ? s.snippet.slice(0, 60) : 'Chat'),
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      messageCount: Number(s.message_count),
      snippet: s.snippet ?? '',
    })),
  });
}
