'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chat';
import { buildContext } from '@/lib/context';
import { MessageBubble } from './MessageBubble';

const QUICK_PROMPTS = [
  'Analyze NVDA — give me the contrarian view',
  'What are the softest consensus assumptions in mega-cap tech right now?',
  'Deep dive on AAPL — thesis, valuation, options positioning',
  'Map rate-sensitive sectors vs. current Fed trajectory',
  'Find options arbitrage opportunities on SPY',
  'Build a thesis framework for a macro regime shift trade',
];

export function ChatInterface() {
  const { messages, isLoading, send, clear } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [input]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    const ctx = buildContext();
    await send(text, ctx as unknown as Record<string, unknown>);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-gain animate-pulse-slow" />
          <span className="font-mono text-xs font-semibold tracking-widest text-ink-secondary">ANALYST</span>
          <span className="hidden sm:inline text-xs text-ink-muted">claude-opus-4-8</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-ink-muted hover:text-ink-secondary transition-colors px-2 py-1 rounded hover:bg-elevated"
          >
            Clear
          </button>
        )}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4 min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-ink mb-1">CLARENCE</div>
              <div className="text-sm text-ink-secondary max-w-sm text-center leading-relaxed">
                Private investment research. Contrarian analysis, live market data, options analytics — concise by default, full reports on demand.
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                  className="text-left text-xs text-ink-secondary bg-elevated border border-border hover:border-border-light hover:text-ink px-3 py-2.5 rounded-xl transition-colors leading-snug"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs font-bold">A</span>
                </div>
                <div className="bg-elevated border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-border bg-surface px-4 lg:px-6 py-3 pb-safe">
        <div className="flex items-end gap-2 bg-elevated border border-border rounded-2xl px-3 py-2 focus-within:border-border-light transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything — analysis, thesis, options, macro…"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-ink placeholder-ink-muted resize-none outline-none min-h-[24px] max-h-[200px] leading-relaxed disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary disabled:bg-primary/30 flex items-center justify-center transition-colors hover:bg-primary-light disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 12V2M2 7l5-5 5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-ink-muted text-right">
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
