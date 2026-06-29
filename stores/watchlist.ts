import { create } from 'zustand';

export interface WatchlistEntry {
  id: string;
  ticker: string;
  name?: string;
  notes?: string;
  alertAbove?: number;
  alertBelow?: number;
  addedAt: string;
  tags?: string[];
}

interface WatchlistStore {
  entries: WatchlistEntry[];
  add: (e: Omit<WatchlistEntry, 'id' | 'addedAt'>) => void;
  update: (ticker: string, updates: Partial<Omit<WatchlistEntry, 'id' | 'ticker'>>) => void;
  remove: (ticker: string) => void;
  has: (ticker: string) => boolean;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  entries: [],

  add: (e) =>
    set((s) => {
      if (s.entries.find((x) => x.ticker.toUpperCase() === e.ticker.toUpperCase())) return s;
      return {
        entries: [
          ...s.entries,
          {
            ...e,
            ticker: e.ticker.toUpperCase(),
            id: Math.random().toString(36).slice(2) + Date.now().toString(36),
            addedAt: new Date().toISOString(),
          },
        ],
      };
    }),

  update: (ticker, updates) =>
    set((s) => ({
      entries: s.entries.map((e) =>
        e.ticker === ticker.toUpperCase() ? { ...e, ...updates } : e,
      ),
    })),

  remove: (ticker) =>
    set((s) => ({ entries: s.entries.filter((e) => e.ticker !== ticker.toUpperCase()) })),

  has: (ticker) => !!get().entries.find((e) => e.ticker === ticker.toUpperCase()),
}));
