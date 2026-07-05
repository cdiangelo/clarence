'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useChatStore } from '@/stores/chat';
import { MessageBubble } from './MessageBubble';
import { ChatHistory } from './ChatHistory';

const QUICK_PROMPTS = [
  'What should I work on to lower my handicap?',
  'Analyze my gapping and suggest a wedge setup',
  'Plan my round at Cog Hill 4 — tips for each nine',
  'What are my weakest stats and how do I improve?',
  'Suggest a practice routine for the next month',
  'How do I approach a tight par 4 playing into the wind?',
];

export function ChatInterface({ initialMessage }: { initialMessage?: string }) {
  const { messages, isLoading, send, startNew, loadSession } = useChatStore();
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const didSendInitial = useRef(false);

  // Auto-send initial message from URL param (e.g. from courses page)
  useEffect(() => {
    if (initialMessage && !didSendInitial.current && !isLoading && messages.length === 0) {
      didSendInitial.current = true;
      send(initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    await send(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-turf animate-pulse" />
          <span className="eyebrow text-turf">Caddie AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(true)}
            className="text-[10px] font-display tracking-wider text-ink-muted hover:text-turf"
          >
            HISTORY
          </button>
          {messages.length > 0 && (
            <button onClick={startNew} className="text-[10px] font-display tracking-wider text-ink-muted hover:text-flag">
              NEW CHAT
            </button>
          )}
        </div>
      </div>

      {showHistory && (
        <ChatHistory
          onClose={() => setShowHistory(false)}
          onSelect={(id) => { loadSession(id); setShowHistory(false); }}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="text-center">
              <div className="font-display text-2xl tracking-widest text-turf mb-2">CADDIE</div>
              <p className="text-sm text-ink-soft max-w-xs text-center leading-relaxed">
                Your personal golf advisor — course strategy, practice plans, stat analysis, and round planning.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                  className="text-left text-xs text-ink-soft bg-card border border-border hover:border-turf/50 hover:bg-turf-wash px-3 py-2.5 rounded-xl transition-colors"
                >{p}</button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
            {isLoading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-turf/10 border border-turf/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-turf text-[10px] font-display">C</span>
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 rounded-full bg-turf/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card px-4 py-3 pb-safe">
        <div className="flex items-end gap-2 bg-paper border border-border rounded-2xl px-3 py-2 focus-within:border-turf/60 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your caddie…"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-ink placeholder-ink-muted resize-none outline-none min-h-[24px] max-h-[160px] leading-relaxed disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 rounded-xl bg-turf disabled:bg-turf/30 flex items-center justify-center transition-colors hover:bg-turf-light disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 12V2M2 7l5-5 5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="mt-1 text-[9px] font-display tracking-wider text-ink-muted text-right">
          ENTER TO SEND · SHIFT+ENTER FOR NEW LINE
        </div>
      </div>
    </div>
  );
}
