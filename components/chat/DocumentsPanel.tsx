'use client';
import React, { useEffect, useRef, useState } from 'react';

interface DocSummary {
  id: string;
  filename: string;
  charCount: number;
  createdAt: string;
}

interface Props {
  onClose: () => void;
}

export function DocumentsPanel({ onClose }: Props) {
  const [documents, setDocuments] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function load() {
    fetch('/api/documents')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load documents');
        return res.json();
      })
      .then((data: { documents: DocSummary[] }) => setDocuments(data.documents))
      .catch(() => setError('Could not load your documents'));
  }

  useEffect(load, []);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/documents', { method: 'POST', body: form });
      const data = await res.json() as { document?: DocSummary; error?: string };
      if (!res.ok || !data.document) throw new Error(data.error ?? 'Upload failed');
      setDocuments((prev) => [data.document!, ...(prev ?? [])]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocuments((prev) => prev?.filter((d) => d.id !== id) ?? null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <span className="eyebrow text-turf">Your Documents</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-ink-muted hover:text-ink text-base leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <p className="text-[11px] text-ink-muted leading-relaxed mb-2">
            Upload swing notes, lesson summaries, or personal performance data (.pdf, .md, .txt). Caddie will
            reference these when they're relevant to what you ask.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.md,.markdown,.txt"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-turf text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 hover:bg-turf-light transition-colors"
          >
            {uploading ? 'Uploading…' : '+ Upload Document'}
          </button>
          {error && <p className="text-xs text-flag mt-2">{error}</p>}
        </div>

        <div className="overflow-y-auto flex-1 px-2 py-2">
          {!error && documents === null && (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-turf/30 border-t-turf rounded-full animate-spin" />
            </div>
          )}

          {documents?.length === 0 && (
            <div className="text-sm text-ink-muted text-center py-10">
              No documents uploaded yet.
            </div>
          )}

          {documents?.map((d) => (
            <div key={d.id} className="w-full text-left px-3 py-3 rounded-xl hover:bg-paper transition-colors group flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{d.filename}</div>
                <div className="text-[10px] text-ink-muted mt-0.5">
                  {new Date(d.createdAt + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                  {' · '}{d.charCount.toLocaleString()} chars
                </div>
              </div>
              <span
                onClick={(e) => handleDelete(d.id, e)}
                className="flex-shrink-0 text-ink-muted hover:text-flag text-sm px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                role="button"
                aria-label="Delete document"
              >
                {deletingId === d.id ? '…' : '×'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
