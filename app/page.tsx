'use client';
import React from 'react';
import Link from 'next/link';
import { usePortfolioStore } from '@/stores/portfolio';
import { useResearchStore } from '@/stores/research';
import { useWatchlistStore } from '@/stores/watchlist';

export default function DashboardPage() {
  const { positions, cash } = usePortfolioStore();
  const { theses } = useResearchStore();
  const { entries } = useWatchlistStore();

  const totalCost = positions.reduce((s, p) => s + p.shares * p.avgCost, 0);
  const activeTheses = theses.filter((t) => t.stage === 'active');
  const developingTheses = theses.filter((t) => t.stage === 'developing');

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-mono text-lg font-bold tracking-widest text-ink">DASHBOARD</h1>
        <p className="text-xs text-ink-muted mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Positions" value={positions.length.toString()} />
        <StatCard label="Cost Basis" value={totalCost > 0 ? `$${(totalCost / 1000).toFixed(1)}k` : '—'} />
        <StatCard label="Active Theses" value={activeTheses.length.toString()} accent="text-gain" />
        <StatCard label="Watchlist" value={entries.length.toString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio */}
        <section>
          <SectionHeader title="PORTFOLIO" href="/markets" />
          {positions.length === 0 ? (
            <EmptyState message="No positions yet. Ask the analyst to add portfolio positions." />
          ) : (
            <div className="space-y-2">
              {positions.slice(0, 6).map((pos) => (
                <div key={pos.id} className="flex items-center justify-between bg-elevated border border-border rounded-xl px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary">{pos.ticker}</span>
                      {pos.name && <span className="text-xs text-ink-muted">{pos.name}</span>}
                    </div>
                    {pos.sector && <span className="text-[10px] text-ink-muted">{pos.sector}</span>}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-ink font-mono">{pos.shares} sh</div>
                    <div className="text-xs text-ink-muted font-mono">${pos.avgCost.toFixed(2)} avg</div>
                  </div>
                </div>
              ))}
              {positions.length > 6 && (
                <Link href="/markets" className="block text-center text-xs text-ink-muted hover:text-primary py-1 transition-colors">
                  +{positions.length - 6} more →
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Active Theses */}
        <section>
          <SectionHeader title="ACTIVE THESES" href="/research" />
          {activeTheses.length === 0 && developingTheses.length === 0 ? (
            <EmptyState message="No theses yet. Ask the analyst to build an investment thesis." />
          ) : (
            <div className="space-y-2">
              {[...activeTheses, ...developingTheses].slice(0, 5).map((t) => (
                <div key={t.id} className="bg-elevated border border-border rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {t.ticker && <span className="font-mono text-xs font-bold text-primary">{t.ticker}</span>}
                        <StageChip stage={t.stage} />
                        <DirChip dir={t.direction} />
                      </div>
                      <p className="text-xs text-ink leading-snug line-clamp-1">{t.title}</p>
                    </div>
                    <span className="text-xs text-gold flex-shrink-0">{'★'.repeat(t.conviction)}</span>
                  </div>
                </div>
              ))}
              {theses.length > 5 && (
                <Link href="/research" className="block text-center text-xs text-ink-muted hover:text-primary py-1 transition-colors">
                  View all {theses.length} →
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Watchlist */}
        <section>
          <SectionHeader title="WATCHLIST" href="/markets" />
          {entries.length === 0 ? (
            <EmptyState message="Watchlist empty. Ask the analyst to add tickers." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {entries.map((e) => (
                <div key={e.id} className="bg-elevated border border-border rounded-lg px-3 py-2">
                  <span className="font-mono text-sm font-bold text-ink">{e.ticker}</span>
                  {e.name && <span className="block text-[10px] text-ink-muted">{e.name}</span>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <div className="text-[10px] font-mono font-semibold text-ink-muted tracking-wider mb-3">QUICK ACTIONS</div>
          <div className="grid grid-cols-1 gap-2">
            <QuickLink href="/chat" label="Open Analyst" description="Ask questions, run analysis, build theses" icon="◉" />
            <QuickLink href="/research" label="Research" description="Manage investment theses and frameworks" icon="◧" />
            <QuickLink href="/reports" label="Reports" description="Generate PDF research reports" icon="▤" />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = 'text-ink' }: { label: string; value: string; accent?: string }) {
  return (
    <div className="bg-elevated border border-border rounded-xl px-4 py-3">
      <div className={`text-xl font-mono font-bold ${accent}`}>{value}</div>
      <div className="text-[10px] text-ink-muted font-mono tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[10px] font-mono font-semibold text-ink-muted tracking-wider">{title}</span>
      <Link href={href} className="text-[10px] text-ink-muted hover:text-primary transition-colors">
        View all →
      </Link>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-elevated border border-border border-dashed rounded-xl px-4 py-6 text-center">
      <p className="text-xs text-ink-muted">{message}</p>
      <Link href="/chat" className="inline-block mt-2 text-xs text-primary hover:text-primary-light transition-colors">
        Open Analyst →
      </Link>
    </div>
  );
}

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

function DirChip({ dir }: { dir: string }) {
  const cls: Record<string, string> = {
    long: 'text-gain bg-gain/10',
    short: 'text-loss bg-loss/10',
    neutral: 'text-ink-secondary bg-elevated',
  };
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${cls[dir] ?? ''}`}>
      {dir.toUpperCase()}
    </span>
  );
}

function QuickLink({ href, label, description, icon }: { href: string; label: string; description: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-elevated border border-border hover:border-border-light rounded-xl px-4 py-3 transition-colors group"
    >
      <span className="text-lg text-ink-muted group-hover:text-primary transition-colors">{icon}</span>
      <div>
        <div className="text-sm font-medium text-ink">{label}</div>
        <div className="text-[10px] text-ink-muted">{description}</div>
      </div>
    </Link>
  );
}
