import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  error?: boolean;
}

interface ChatStore {
  messages: ChatMessage[];
  isLoading: boolean;
  send: (content: string) => Promise<void>;
  clear: () => void;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  messages: [],
  isLoading: false,

  send: async (content) => {
    const userMsg: ChatMessage = { id: uid(), role: 'user', content, timestamp: new Date().toISOString() };
    set((s) => ({ messages: [...s.messages, userMsg], isLoading: true }));

    const history = get().messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-20)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      const data: { text: string; toolsUsed?: string[] } = await res.json();
      const assistantMsg: ChatMessage = {
        id: uid(), role: 'assistant', content: data.text,
        timestamp: new Date().toISOString(),
        toolsUsed: data.toolsUsed?.length ? data.toolsUsed : undefined,
      };
      set((s) => ({ messages: [...s.messages, assistantMsg], isLoading: false }));
    } catch (err) {
      set((s) => ({
        messages: [...s.messages, { id: uid(), role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong.', timestamp: new Date().toISOString(), error: true }],
        isLoading: false,
      }));
    }
  },

  clear: () => set({ messages: [] }),
}));
