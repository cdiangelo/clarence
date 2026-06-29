'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/stores/chat';
import { ChartRenderer } from '@/components/charts/ChartRenderer';

const TOOL_LABELS: Record<string, string> = {
  fetch_stock_data: 'Quote',
  fetch_financial_statements: 'Financials',
  fetch_price_history: 'Price History',
  fetch_options_chain: 'Options Chain',
  analyze_options_arbitrage: 'Arbitrage',
  fetch_url: 'Web',
  save_thesis: 'Saved Thesis',
  update_thesis: 'Updated Thesis',
  add_to_watchlist: 'Watchlist',
  add_portfolio_position: 'Portfolio',
  create_chart: 'Chart',
  generate_pdf_report: 'PDF',
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'system') {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-ink-muted bg-surface px-3 py-1 rounded-full border border-border">
          {message.content}
        </span>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
        isUser
          ? 'bg-elevated border border-border text-ink-secondary'
          : 'bg-primary/20 border border-primary/40 text-primary'
      }`}>
        {isUser ? 'U' : 'A'}
      </div>

      <div className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
        {/* Tool use pills */}
        {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {[...new Set(message.toolsUsed)].map((tool) => (
              <span
                key={tool}
                className="text-[10px] font-mono text-ink-muted bg-surface border border-border/60 px-2 py-0.5 rounded-full"
              >
                ↳ {TOOL_LABELS[tool] ?? tool}
              </span>
            ))}
          </div>
        )}

        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[88%] ${
          isUser
            ? 'bg-primary/15 border border-primary/25 rounded-tr-sm text-ink'
            : message.error
            ? 'bg-loss/10 border border-loss/30 rounded-tl-sm text-loss'
            : 'bg-elevated border border-border rounded-tl-sm text-ink'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
                  em: ({ children }) => <em className="text-ink-secondary">{children}</em>,
                  code: ({ children, className }) => {
                    const isBlock = !!className;
                    return isBlock ? (
                      <code className="block bg-surface rounded-lg p-3 my-2 font-mono text-xs text-primary-light overflow-x-auto whitespace-pre">
                        {children}
                      </code>
                    ) : (
                      <code className="font-mono text-xs text-primary-light bg-surface px-1.5 py-0.5 rounded">
                        {children}
                      </code>
                    );
                  },
                  ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm leading-snug">{children}</li>,
                  h1: ({ children }) => <h1 className="text-base font-bold text-ink mb-2 mt-3 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold text-ink mb-1.5 mt-3 first:mt-0 border-b border-border pb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold text-ink-secondary mb-1 mt-2 first:mt-0">{children}</h3>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2 rounded-lg border border-border">
                      <table className="w-full text-xs border-collapse">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="text-left px-3 py-2 bg-surface font-semibold text-ink-secondary border-b border-border">{children}</th>,
                  td: ({ children }) => <td className="px-3 py-1.5 border-b border-border/40 last:border-0">{children}</td>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-ink-secondary italic text-sm">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="border-border my-3" />,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-light underline underline-offset-2">
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Charts rendered below the bubble */}
        {message.charts && message.charts.length > 0 && (
          <div className="w-full space-y-3 chart-wrap">
            {message.charts.map((chart) => (
              <ChartRenderer key={chart.id} spec={chart} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-ink-muted">
          {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
