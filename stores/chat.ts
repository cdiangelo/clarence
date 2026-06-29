import { create } from 'zustand';
import { sendMessage, type ConversationMessage, type ToolHandler } from '../lib/claude';
import type { InvestContext } from '../lib/prompts';
import type { ChartSpec } from '../lib/charts';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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
  pendingCharts: ChartSpec[];
  send: (content: string, ctx: InvestContext, onToolCall: ToolHandler) => Promise<void>;
  addPendingChart: (chart: ChartSpec) => void;
  clear: () => void;
  addSystemMessage: (content: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  pendingCharts: [],

  addPendingChart: (chart) =>
    set((s) => ({ pendingCharts: [...s.pendingCharts, chart] })),

  send: async (content, ctx, onToolCall) => {
    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true, pendingCharts: [] }));

    const history: ConversationMessage[] = get()
      .messages.filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const result = await sendMessage(content, history, ctx, onToolCall);
      const charts = get().pendingCharts;
      const assistantMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: result.text,
        timestamp: new Date().toISOString(),
        toolsUsed: result.toolsUsed.length ? result.toolsUsed : undefined,
        charts: charts.length ? charts : undefined,
      };
      set((s) => ({ messages: [...s.messages, assistantMsg], isLoading: false, pendingCharts: [] }));
    } catch (err) {
      const errMsg: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong.',
        timestamp: new Date().toISOString(),
        error: true,
      };
      set((s) => ({ messages: [...s.messages, errMsg], isLoading: false, pendingCharts: [] }));
    }
  },

  clear: () => set({ messages: [], pendingCharts: [] }),

  addSystemMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: uid(), role: 'system', content, timestamp: new Date().toISOString() },
      ],
    })),
}));
