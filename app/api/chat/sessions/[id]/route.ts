import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/db/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const sessionRow = await query<{ id: string; title: string | null; created_at: string }>(
    'SELECT id, title, created_at FROM chat_sessions WHERE id = $1 AND user_id = $2',
    [id, session.userId],
  );
  if (sessionRow.length === 0) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const messages = await query<{
    id: string; role: string; content: string; tools_used: string[] | null; created_at: string;
  }>(
    'SELECT id, role, content, tools_used, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
    [id],
  );

  return NextResponse.json({
    session: { id: sessionRow[0].id, title: sessionRow[0].title, createdAt: sessionRow[0].created_at },
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      toolsUsed: m.tools_used ?? undefined,
      timestamp: m.created_at,
    })),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await query('DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2', [id, session.userId]);
  return NextResponse.json({ ok: true });
}
