'use client';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/stores/chat';

const TOOL_LABELS: Record<string, string> = {
  get_weather: 'Weather',
  search_courses: 'Courses',
  get_course_holes: 'Scorecard',
  get_user_rounds: 'Rounds',
  get_user_bag: 'Bag',
};

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="text-[10px] font-display tracking-wider text-ink-muted bg-sand px-3 py-1 rounded-full">{message.content}</span>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-display ${
        isUser ? 'bg-sand border border-border text-ink-soft' : 'bg-turf/10 border border-turf/30 text-turf'
      }`}>
        {isUser ? 'ME' : 'C'}
      </div>

      <div className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
        {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {[...new Set(message.toolsUsed)].map((tool) => (
              <span key={tool}
                className="text-[9px] font-display tracking-wider text-ink-muted bg-turf-wash border border-turf/20 px-2 py-0.5 rounded-full">
                ↳ {TOOL_LABELS[tool] ?? tool}
              </span>
            ))}
          </div>
        )}

        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[90%] ${
          isUser
            ? 'bg-turf/10 border border-turf/20 rounded-tr-sm text-ink'
            : message.error
            ? 'bg-flag/5 border border-flag/20 rounded-tl-sm text-flag'
            : 'bg-card border border-border rounded-tl-sm text-ink shadow-card'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
                  code: ({ children, className }) => {
                    const block = !!className;
                    return block
                      ? <code className="block bg-paper rounded-lg p-3 my-2 font-mono text-xs overflow-x-auto whitespace-pre">{children}</code>
                      : <code className="font-mono text-xs bg-sand px-1.5 py-0.5 rounded">{children}</code>;
                  },
                  ul: ({ children }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  h2: ({ children }) => <h2 className="font-display text-sm tracking-wider text-turf mt-3 first:mt-0 mb-1.5">{children}</h2>,
                  h3: ({ children }) => <h3 className="font-semibold text-sm text-ink mt-2 first:mt-0 mb-1">{children}</h3>,
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2 rounded-lg border border-border">
                      <table className="w-full text-xs border-collapse">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="text-left px-3 py-2 bg-paper font-display text-[10px] tracking-wider text-ink-soft border-b border-border">{children}</th>,
                  td: ({ children }) => <td className="px-3 py-1.5 border-b border-border/50 last:border-0">{children}</td>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-turf/50 pl-3 my-2 text-ink-soft italic text-sm">{children}</blockquote>
                  ),
                  hr: () => <hr className="border-border my-3" />,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-turf underline underline-offset-2 hover:text-turf-light">{children}</a>
                  ),
                }}
              >{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        <span className="text-[9px] stat-num text-ink-muted">
          {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
