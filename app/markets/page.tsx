'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePortfolioStore } from '@/stores/portfolio';
import { useWatchlistStore } from '@/stores/watchlist';
import { useOptionsStore } from '@/stores/options';

type Tab = 'portfolio' | 'watchlist' | 'options';

export default function MarketsPage() {
  const [tab, setTab] = useState<Tab>('portfolio');

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 lg:px-6 pt-6 pb-0 flex-shrink-0">
        <h1 className="font-mono text-lg font-bold tracking-widest text-ink mb-4">MARKETS</h1>
        {/* Tabs */}
        <div className="flex gap-0.5 bg-elevated border border-border rounded-xl p-1">
          {(['portfolio', 'watchlist', 'options'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize ${
                tab === t
                  ? 'bg-primary/20 text-primary'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
        {tab === 'portfolio' && <PortfolioTab />}
        {tab === 'watchlist' && <WatchlistTab />}
        {tab === 'options' && <OptionsTab />}
      </div>
    </div>
  );
}

function PortfolioTab() {
  const { positions, cash, removePosition } = usePortfolioStore();
  const totalCost = positions.reduce((s, p) => s + p.shares * p.avgCost, 0);

  if (positions.length === 0) {
    return (
      <EmptyPrompt
        message="No positions yet."
        hint={'Ask the analyst to add a position. Try: "Add 100 shares of AAPL at $185."'}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-elevated border border-border rounded-xl px-4 py-3">
          <div className="text-lg font-mono font-bold text-ink">
            ${totalCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[10px] text-ink-muted font-mono tracking-wider mt-0.5">COST BASIS</div>
        </div>
        <div className="bg-elevated border border-border rounded-xl px-4 py-3">
          <div className="text-lg font-mono font-bold text-ink">{positions.length}</div>
          <div className="text-[10px] text-ink-muted font-mono tracking-wider mt-0.5">POSITIONS</div>
        </div>
      </div>

      {/* Positions table */}
      <div className="bg-elevated border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-px bg-border">
          {['Ticker', 'Shares', 'Avg Cost', 'Total'].map((h) => (
            <div key={h} className="bg-surface px-3 py-2 text-[10px] font-mono font-semibold text-ink-muted tracking-wider">
              {h}
            </div>
          ))}
        </div>
        {positions.map((pos) => (
          <div key={pos.id} className="grid grid-cols-[1fr_auto_auto_auto] border-t border-border/40 hover:bg-surface/50 transition-colors group">
            <div className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-primary">{pos.ticker}</span>
                <button
                  onClick={() => removePosition(pos.id)}
                  className="opacity-0 group-hover:opacity-100 text-[10px] text-ink-muted hover:text-loss transition-all"
                >
                  ×
                </button>
              </div>
              {pos.name && <span className="text-[10px] text-ink-muted">{pos.name}</span>}
            </div>
            <div className="px-3 py-2.5 text-sm text-ink font-mono text-right">{pos.shares}</div>
            <div className="px-3 py-2.5 text-sm text-ink font-mono text-right">${pos.avgCost.toFixed(2)}</div>
            <div className="px-3 py-2.5 text-sm text-ink font-mono text-right">
              ${(pos.shares * pos.avgCost).toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          </div>
        ))}
      </div>

      {cash > 0 && (
        <div className="text-xs text-ink-muted text-right">Cash: ${cash.toLocaleString()}</div>
      )}
    </div>
  );
}

function WatchlistTab() {
  const { entries, remove } = useWatchlistStore();

  if (entries.length === 0) {
    return (
      <EmptyPrompt
        message="Watchlist is empty."
        hint={'Ask the analyst to add tickers. Try: "Add MSFT to my watchlist."'}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {entries.map((e) => (
        <div key={e.id} className="bg-elevated border border-border rounded-xl px-4 py-3 flex items-start justify-between group">
          <div>
            <div className="font-mono text-sm font-bold text-ink">{e.ticker}</div>
            {e.name && <div className="text-xs text-ink-muted">{e.name}</div>}
            {e.notes && <div className="text-xs text-ink-secondary mt-1 leading-snug">{e.notes}</div>}
            {(e.alertAbove || e.alertBelow) && (
              <div className="flex gap-2 mt-1.5">
                {e.alertAbove && (
                  <span className="text-[10px] text-gain font-mono">↑ ${e.alertAbove}</span>
                )}
                {e.alertBelow && (
                  <span className="text-[10px] text-loss font-mono">↓ ${e.alertBelow}</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => remove(e.ticker)}
            className="opacity-0 group-hover:opacity-100 text-ink-muted hover:text-loss text-xs transition-all ml-2"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function OptionsTab() {
  const { analyses } = useOptionsStore();

  if (analyses.length === 0) {
    return (
      <EmptyPrompt
        message="No options analyses yet."
        hint={'Ask the analyst to analyze options. Try: "Analyze options chain for TSLA."'}
      />
    );
  }

  return (
    <div className="space-y-3">
      {analyses.map((a) => (
        <div key={a.id} className="bg-elevated border border-border rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="font-mono text-sm font-bold text-primary">{a.ticker}</span>
              {a.spotPrice > 0 && (
                <span className="ml-2 text-xs text-ink-muted font-mono">${a.spotPrice.toFixed(2)}</span>
              )}
            </div>
            <div className="text-right">
              {a.ivRank !== undefined && (
                <div className={`text-xs font-mono font-bold ${a.ivRank > 60 ? 'text-loss' : a.ivRank > 40 ? 'text-gold' : 'text-gain'}`}>
                  IVR {a.ivRank.toFixed(0)}
                </div>
              )}
              <div className="text-[10px] text-ink-muted">
                {new Date(a.analysisDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed mb-3">{a.summary}</p>

          {a.arbitrageFlags.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-semibold text-ink-muted tracking-wider">ARBITRAGE FLAGS</div>
              {a.arbitrageFlags.map((f, i) => (
                <div key={i} className="flex items-start gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                  <div className={`text-[10px] font-bold mt-0.5 ${
                    f.confidence === 'high' ? 'text-gain' : f.confidence === 'medium' ? 'text-gold' : 'text-ink-muted'
                  }`}>
                    {f.confidence.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-ink leading-snug">{f.description}</p>
                    <p className="text-[10px] text-ink-muted mt-0.5">
                      Edge: {f.edge > 0 ? '+' : ''}{f.edge.toFixed(2)}
                      {f.expiry && ` · ${f.expiry}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {a.skewNotes && (
            <p className="mt-2 text-[11px] text-ink-muted italic">{a.skewNotes}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyPrompt({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-ink-secondary mb-1">{message}</p>
      <p className="text-xs text-ink-muted max-w-xs">{hint}</p>
      <Link href="/chat" className="mt-4 text-xs text-primary hover:text-primary-light transition-colors">
        Open Analyst →
      </Link>
    </div>
  );
}
