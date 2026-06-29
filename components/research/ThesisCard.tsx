'use client';
import React, { useState } from 'react';
import type { Thesis } from '@/stores/research';

interface Props {
  thesis: Thesis;
  onDelete?: (id: string) => void;
}

const STAGE_COLORS: Record<string, string> = {
  developing: 'text-gold border-gold/50 bg-gold/10',
  active: 'text-gain border-gain/50 bg-gain/10',
  testing: 'text-primary border-primary/50 bg-primary/10',
  watching: 'text-ink-secondary border-border bg-elevated',
  closed: 'text-ink-muted border-border/50 bg-surface',
};

const STAGE_LEFT: Record<string, string> = {
  developing: 'border-l-gold',
  active: 'border-l-gain',
  testing: 'border-l-primary',
  watching: 'border-l-ink-secondary',
  closed: 'border-l-border',
};

const DIR_COLORS: Record<string, string> = {
  long: 'text-gain bg-gain/15',
  short: 'text-loss bg-loss/15',
  neutral: 'text-ink-secondary bg-elevated',
};

const CONF_COLORS: Record<string, string> = {
  high: 'bg-gain',
  medium: 'bg-gold',
  low: 'bg-loss',
};

export function ThesisCard({ thesis, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const stageClass = STAGE_COLORS[thesis.stage] ?? 'text-ink-muted';
  const leftBorder = STAGE_LEFT[thesis.stage] ?? 'border-l-border';

  return (
    <div
      className={`bg-elevated border border-border border-l-[3px] ${leftBorder} rounded-xl p-4 cursor-pointer select-none transition-colors hover:border-border-light`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {thesis.ticker && (
              <span className="font-mono text-xs font-bold text-primary">{thesis.ticker}</span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DIR_COLORS[thesis.direction] ?? ''}`}>
              {thesis.direction.toUpperCase()}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${stageClass}`}>
              {thesis.stage}
            </span>
          </div>
          <p className={`text-sm font-medium text-ink leading-snug ${!expanded ? 'line-clamp-2' : ''}`}>
            {thesis.title}
          </p>
        </div>

        {/* Conviction + date */}
        <div className="flex flex-col items-end flex-shrink-0">
          <span className="text-xs text-gold tracking-wider">
            {'★'.repeat(thesis.conviction)}
            <span className="opacity-30">{'★'.repeat(5 - thesis.conviction)}</span>
          </span>
          <span className="text-[10px] text-ink-muted mt-0.5">
            {new Date(thesis.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Timing range */}
      {thesis.timingRange && (
        <div className="mt-2 inline-flex items-center gap-1 bg-primary/10 rounded px-2 py-1">
          <span className="text-[11px] text-primary-light">⏱ {thesis.timingRange}</span>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
          {thesis.hypothesis && (
            <p className="text-xs text-ink-secondary leading-relaxed">{thesis.hypothesis}</p>
          )}

          {thesis.keyAssumptions.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-semibold text-ink-muted mb-1.5 tracking-wider">
                KEY ASSUMPTIONS
              </div>
              <div className="space-y-1.5">
                {thesis.keyAssumptions.slice(0, 3).map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${CONF_COLORS[a.confidence] ?? 'bg-border'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-ink leading-snug">{a.text}</p>
                      {a.softnessFlag && (
                        <p className="text-[10px] text-loss mt-0.5">⚠ {a.softnessFlag}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Target / stop */}
          {(thesis.targetPrice || thesis.stopLoss) && (
            <div className="flex gap-4">
              {thesis.targetPrice && (
                <span className="text-xs text-gain font-mono">Target ${thesis.targetPrice.toFixed(2)}</span>
              )}
              {thesis.stopLoss && (
                <span className="text-xs text-loss font-mono">Stop ${thesis.stopLoss.toFixed(2)}</span>
              )}
            </div>
          )}

          {/* Catalysts */}
          {thesis.catalysts.length > 0 && (
            <div>
              <div className="text-[10px] font-mono font-semibold text-ink-muted mb-1 tracking-wider">CATALYSTS</div>
              <ul className="space-y-0.5">
                {thesis.catalysts.slice(0, 3).map((c, i) => (
                  <li key={i} className="text-xs text-ink-secondary flex gap-1.5">
                    <span className="text-primary mt-0.5">→</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(thesis.id); }}
              className="text-[10px] text-ink-muted hover:text-loss transition-colors mt-1"
            >
              Delete thesis
            </button>
          )}
        </div>
      )}
    </div>
  );
}
