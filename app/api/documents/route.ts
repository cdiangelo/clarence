import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/db/client';
import { extractDocumentText } from '@/lib/documentParse';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const documents = await query<{ id: string; filename: string; char_count: number; created_at: string }>(
    `SELECT id, filename, char_count, to_char(created_at, 'YYYY-MM-DD') AS created_at
     FROM user_documents WHERE user_id = $1 ORDER BY created_at DESC`,
    [session.userId],
  );

  return NextResponse.json({
    documents: documents.map((d) => ({
      id: d.id, filename: d.filename, charCount: d.char_count, createdAt: d.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'File too large — 8MB max' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractDocumentText(file.name, buffer);

    const rows = await query<{ id: string; filename: string; char_count: number; created_at: string }>(
      `INSERT INTO user_documents (user_id, filename, content, char_count)
       VALUES ($1, $2, $3, $4)
       RETURNING id, filename, char_count, to_char(created_at, 'YYYY-MM-DD') AS created_at`,
      [session.userId, file.name, text, text.length],
    );

    const row = rows[0];
    return NextResponse.json({
      document: { id: row.id, filename: row.filename, charCount: row.char_count, createdAt: row.created_at },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to process file' },
      { status: 400 },
    );
  }
}
