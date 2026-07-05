import { create } from 'zustand';

export interface Round {
  id: string;
  courseId?: string;
  courseName: string;
  date: string;             // ISO date
  holes: 9 | 18;
  score: number;
  courseRating?: number;
  slopeRating?: number;
  putts?: number;
  fir?: number;
  firTotal?: number;
  gir?: number;
  notes?: string;
}

interface RoundsStore {
  rounds: Round[];
  loaded: boolean;
  load: () => Promise<void>;
  addRound: (r: Omit<Round, 'id'>) => Promise<void>;
  deleteRound: (id: string) => Promise<void>;
}

export const useRoundsStore = create<RoundsStore>()((set, get) => ({
  rounds: [],
  loaded: false,

  load: async () => {
    try {
      const res = await fetch('/api/rounds');
      if (res.ok) {
        const data = await res.json();
        set({ rounds: data.rounds ?? [], loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  addRound: async (r) => {
    const res = await fetch('/api/rounds', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(r),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to save round');
    const data = await res.json();
    set((s) => ({ rounds: [data.round, ...s.rounds] }));
  },

  deleteRound: async (id) => {
    await fetch(`/api/rounds/${id}`, { method: 'DELETE' });
    set((s) => ({ rounds: s.rounds.filter((r) => r.id !== id) }));
  },
}));
