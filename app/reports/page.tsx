'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useResearchStore } from '@/stores/research';
import { buildThesisHtml } from '@/lib/reports';

export default function ReportsPage() {
  const { theses } = useResearchStore();
  const [generating, setGenerating] = useState<string | null>(null);

  async function exportThesis(id: string) {
    setGenerating(id);
    try {
      const thesis = theses.find((t) => t.id === id);
      if (!thesis) return;
      const html = buildThesisHtml(thesis);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-mono text-lg font-bold tracking-widest text-ink">REPORTS</h1>
        <p className="text-xs text-ink-muted mt-0.5">Export research as printable PDF reports</p>
      </div>

      {/* How to use */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-6">
        <p className="text-xs text-ink-secondary leading-relaxed">
          Ask the analyst to generate a full report with{' '}
          <span className="font-mono text-primary">"generate a PDF report on NVDA"</span> or{' '}
          <span className="font-mono text-primary">"generate a PDF for [thesis name]"</span>.
          Reports will open in a new tab ready to print.
        </p>
      </div>

      {/* Thesis reports */}
      <div>
        <div className="text-[10px] font-mono font-semibold text-ink-muted tracking-wider mb-3">
          THESIS REPORTS ({theses.length})
        </div>

        {theses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-elevated border border-border border-dashed rounded-xl">
            <p className="text-sm text-ink-secondary mb-1">No theses to export</p>
            <p className="text-xs text-ink-muted max-w-xs">
              Build investment theses through the analyst chat, then export them as reports here.
            </p>
            <Link href="/chat" className="mt-4 text-xs text-primary hover:text-primary-light transition-colors">
              Open Analyst →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {theses.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 bg-elevated border border-border rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {t.ticker && (
                      <span className="font-mono text-xs font-bold text-primary">{t.ticker}</span>
                    )}
                    <StageChip stage={t.stage} />
                  </div>
                  <p className="text-sm text-ink leading-snug line-clamp-1">{t.title}</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">
                    Updated {new Date(t.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => exportThesis(t.id)}
                  disabled={generating === t.id}
                  className="flex-shrink-0 text-xs px-3 py-1.5 bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating === t.id ? 'Generating…' : 'Export PDF'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template section */}
      <div className="mt-8">
        <div className="text-[10px] font-mono font-semibold text-ink-muted tracking-wider mb-3">
          REPORT TEMPLATES
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TEMPLATES.map((tmpl) => (
            <div key={tmpl.label} className="bg-elevated border border-border rounded-xl px-4 py-3">
              <div className="text-sm font-medium text-ink mb-0.5">{tmpl.label}</div>
              <div className="text-xs text-ink-muted mb-2 leading-snug">{tmpl.description}</div>
              <Link
                href={`/chat?prompt=${encodeURIComponent(tmpl.prompt)}`}
                className="text-[10px] text-primary hover:text-primary-light transition-colors"
              >
                Generate via Analyst →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TEMPLATES = [
  {
    label: 'Investment Thesis',
    description: 'Full thesis with hypothesis, assumptions, catalysts, risks, and valuation.',
    prompt: 'Build a comprehensive investment thesis and generate a PDF report.',
  },
  {
    label: 'Options Analysis',
    description: 'Options chain analysis with IV landscape, skew, and arbitrage flags.',
    prompt: 'Analyze the options chain and generate a PDF report with arbitrage opportunities.',
  },
  {
    label: 'Sector Deep Dive',
    description: 'Macro sector analysis with relative strength and positioning.',
    prompt: 'Do a deep dive sector analysis and generate a PDF report.',
  },
  {
    label: 'Portfolio Review',
    description: 'Portfolio composition, concentration risk, and rebalancing suggestions.',
    prompt: 'Review my portfolio and generate a PDF report with observations.',
  },
];

function StageChip({ stage }: { stage: string }) {
  const cls: Record<string, string> = {
    active: 'text-gain bg-gain/10',
    developing: 'text-gold bg-gold/10',
    testing: 'text-primary bg-primary/10',
    watching: 'text-ink-secondary bg-elevated',
    closed: 'text-ink-muted bg-surface',
  };
  return (
    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${cls[stage] ?? ''}`}>
      {stage}
    </span>
  );
}
