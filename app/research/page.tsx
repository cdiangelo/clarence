'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useResearchStore } from '@/stores/research';
import { ThesisCard } from '@/components/research/ThesisCard';
import type { ThesisStage } from '@/stores/research';

const STAGES: { value: ThesisStage | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'developing', label: 'Developing' },
  { value: 'testing', label: 'Testing' },
  { value: 'watching', label: 'Watching' },
  { value: 'closed', label: 'Closed' },
];

export default function ResearchPage() {
  const { theses, deleteThesis } = useResearchStore();
  const [stageFilter, setStageFilter] = useState<ThesisStage | 'all'>('all');
  const [query, setQuery] = useState('');

  const filtered = theses
    .filter((t) => stageFilter === 'all' || t.stage === stageFilter)
    .filter((t) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticker?.toLowerCase().includes(q) ||
        t.hypothesis.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-widest text-ink">RESEARCH</h1>
          <p className="text-xs text-ink-muted mt-0.5">{theses.length} theses</p>
        </div>
        <Link
          href="/chat"
          className="text-xs bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 px-3 py-1.5 rounded-lg transition-colors"
        >
          + New Thesis
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search theses, tickers…"
          className="w-full bg-elevated border border-border rounded-xl px-3 py-2 text-sm text-ink placeholder-ink-muted outline-none focus:border-border-light transition-colors"
        />
      </div>

      {/* Stage filters */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {STAGES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStageFilter(value)}
            className={`text-xs px-3 py-1 rounded-lg transition-colors ${
              stageFilter === value
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-elevated text-ink-secondary border border-border hover:border-border-light hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Thesis list */}
      {theses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-ink-muted text-4xl mb-4">◧</div>
          <p className="text-sm text-ink-secondary mb-1">No theses yet</p>
          <p className="text-xs text-ink-muted max-w-xs">
            Ask the analyst to build an investment thesis. Try: "Build a thesis on NVDA long term."
          </p>
          <Link href="/chat" className="mt-4 text-xs text-primary hover:text-primary-light transition-colors">
            Open Analyst →
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xs text-ink-muted">No theses match your filters.</p>
          <button
            onClick={() => { setStageFilter('all'); setQuery(''); }}
            className="mt-2 text-xs text-primary hover:text-primary-light transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((thesis) => (
            <ThesisCard key={thesis.id} thesis={thesis} onDelete={deleteThesis} />
          ))}
        </div>
      )}
    </div>
  );
}
