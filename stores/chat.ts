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
  sessionId: string | null;
  isLoading: boolean;
  send: (content: string) => Promise<void>;
  clear: () => void;
  startNew: () => void;
  loadSession: (id: string) => Promise<void>;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  messages: [],
  sessionId: null,
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
        body: JSON.stringify({ message: content, history, sessionId: get().sessionId ?? undefined }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      const data: { text: string; toolsUsed?: string[]; sessionId?: string } = await res.json();
      const assistantMsg: ChatMessage = {
        id: uid(), role: 'assistant', content: data.text,
        timestamp: new Date().toISOString(),
        toolsUsed: data.toolsUsed?.length ? data.toolsUsed : undefined,
      };
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isLoading: false,
        sessionId: data.sessionId ?? s.sessionId,
      }));
    } catch (err) {
      set((s) => ({
        messages: [...s.messages, { id: uid(), role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong.', timestamp: new Date().toISOString(), error: true }],
        isLoading: false,
      }));
    }
  },

  // Wipes the current view without touching the archive — the next message
  // sent (if any) will still belong to whatever session was active
  clear: () => set({ messages: [] }),

  // Starts a genuinely fresh conversation — the next message creates a new
  // chat_sessions row, and the old one just becomes part of the archive
  startNew: () => set({ messages: [], sessionId: null }),

  loadSession: async (id) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      if (!res.ok) throw new Error('Failed to load conversation');
      const data: {
        session: { id: string };
        messages: { id: string; role: 'user' | 'assistant'; content: string; toolsUsed?: string[]; timestamp: string }[];
      } = await res.json();
      set({
        sessionId: data.session.id,
        messages: data.messages.map((m) => ({
          id: m.id, role: m.role, content: m.content, timestamp: m.timestamp, toolsUsed: m.toolsUsed,
        })),
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
