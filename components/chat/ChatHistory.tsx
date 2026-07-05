'use client';
import React, { useEffect, useState } from 'react';

interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  snippet: string;
}

interface Props {
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function ChatHistory({ onClose, onSelect }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/chat/sessions')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load history');
        return res.json();
      })
      .then((data: { sessions: SessionSummary[] }) => setSessions(data.sessions))
      .catch(() => setError('Could not load past conversations'));
  }, []);

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
          <span className="eyebrow text-turf">Past Conversations</span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-ink-muted hover:text-ink text-base leading-none"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-2 py-2">
          {error && <div className="text-xs text-flag text-center py-6">{error}</div>}

          {!error && sessions === null && (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-turf/30 border-t-turf rounded-full animate-spin" />
            </div>
          )}

          {sessions?.length === 0 && (
            <div className="text-sm text-ink-muted text-center py-10">
              No past conversations yet.
            </div>
          )}

          {sessions?.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="w-full text-left px-3 py-3 rounded-xl hover:bg-paper transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">{s.title}</div>
                  <div className="text-[10px] text-ink-muted mt-0.5">
                    {new Date(s.updatedAt + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                    {' · '}{s.messageCount} messages
                  </div>
                </div>
                <span
                  onClick={(e) => handleDelete(s.id, e)}
                  className="flex-shrink-0 text-ink-muted hover:text-flag text-sm px-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  role="button"
                  aria-label="Delete conversation"
                >
                  {deletingId === s.id ? '…' : '×'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
