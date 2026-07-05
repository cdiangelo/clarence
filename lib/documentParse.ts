// Text extraction for user-uploaded knowledge documents. PDF and
// markdown/plain-text are the only supported formats — no OCR, no fallback
// guessing at content we can't actually read.
export const MAX_DOC_CHARS = 60_000;

export async function extractDocumentText(filename: string, buffer: Buffer): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop() ?? '';

  let text: string;
  if (ext === 'pdf') {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      // Strip pdf-parse's "-- N of M --" page-separator lines — cosmetic
      // noise that would otherwise pollute every uploaded PDF's content.
      text = result.text.replace(/^-- \d+ of \d+ --$/gm, '').trim();
    } finally {
      await parser.destroy();
    }
  } else if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
    text = buffer.toString('utf8');
  } else {
    throw new Error('Unsupported file type — upload a .pdf, .md, or .txt file');
  }

  text = text.trim();
  if (!text) throw new Error('No extractable text found in this file');

  return text.length > MAX_DOC_CHARS
    ? `${text.slice(0, MAX_DOC_CHARS)}\n\n[...truncated, file was longer]`
    : text;
}
