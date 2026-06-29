import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChartSpec } from '../lib/charts';
import type { StoreMutation } from '../lib/mutations';
import { applyMutations } from '../lib/mutations';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  error?: boolean;
  charts?: ChartSpec[];
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  send: (content: string, context: Record<string, unknown>) => Promise<void>;
  clear: () => void;
  addSystemMessage: (content: string) => void;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,

      send: async (content, context) => {
        const userMsg: ChatMessage = {
          id: uid(),
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        };

        set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));

        const history = get()
          .messages.filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-20)
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ message: content, history, context }),
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(err.error ?? `HTTP ${res.status}`);
          }

          const data: {
            text: string;
            charts: ChartSpec[];
            mutations: StoreMutation[];
            toolsUsed: string[];
          } = await res.json();

          applyMutations(data.mutations ?? []);

          const assistantMsg: ChatMessage = {
            id: uid(),
            role: 'assistant',
            content: data.text,
            timestamp: new Date().toISOString(),
            toolsUsed: data.toolsUsed?.length ? data.toolsUsed : undefined,
            charts: data.charts?.length ? data.charts : undefined,
          };
          set((s) => ({ messages: [...s.messages, assistantMsg], isLoading: false }));
        } catch (err) {
          const errMsg: ChatMessage = {
            id: uid(),
            role: 'assistant',
            content: err instanceof Error ? err.message : 'Something went wrong.',
            timestamp: new Date().toISOString(),
            error: true,
          };
          set((s) => ({ messages: [...s.messages, errMsg], isLoading: false }));
        }
      },

      clear: () => set({ messages: [] }),

      addSystemMessage: (content) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { id: uid(), role: 'system', content, timestamp: new Date().toISOString() },
          ],
        })),
    }),
    {
      name: 'clarence-chat',
      partialize: (state) => ({ messages: state.messages.slice(-100) }),
    },
  ),
);
