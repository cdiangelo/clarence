import { create } from 'zustand';
import type { ClubModel } from '@/data/clubs';

export interface BagClub {
  id: string;
  catalogId?: string;
  slot: string;      // driver|3w|5w|3h|4h|3i|4i|5i|6i|7i|8i|9i|PW|GW|SW|LW|putter
  brand?: string;
  model?: string;
  carry?: number;
  carryIsEstimate: boolean;
  loft?: number;
  catalog?: ClubModel; // populated client-side for display
}

export type BagSection = 'driver' | 'woods' | 'irons' | 'wedges' | 'putter';

export const SLOT_TO_SECTION: Record<string, BagSection> = {
  driver: 'driver',
  '3w': 'woods', '5w': 'woods', '7w': 'woods',
  '3h': 'woods', '4h': 'woods', '5h': 'woods',
  '2i': 'irons', '3i': 'irons', '4i': 'irons', '5i': 'irons',
  '6i': 'irons', '7i': 'irons', '8i': 'irons', '9i': 'irons', 'PW': 'irons',
  'GW': 'wedges', 'SW': 'wedges', 'LW': 'wedges', 'AW': 'wedges',
  '46w': 'wedges', '48w': 'wedges', '50w': 'wedges', '52w': 'wedges',
  '54w': 'wedges', '56w': 'wedges', '58w': 'wedges', '60w': 'wedges',
  putter: 'putter',
};

export const SLOT_ORDER = ['driver','3w','5w','7w','3h','4h','5h','2i','3i','4i','5i','6i','7i','8i','9i','PW','GW','AW','46w','48w','50w','52w','54w','56w','58w','60w','SW','LW','putter'];

interface BagStore {
  clubs: BagClub[];
  loaded: boolean;
  load: () => Promise<void>;
  addClub: (c: Omit<BagClub, 'id'>) => Promise<void>;
  updateClub: (id: string, updates: Partial<BagClub>) => Promise<void>;
  removeClub: (id: string) => Promise<void>;
  bySection: (section: BagSection) => BagClub[];
}

export const useBagStore = create<BagStore>()((set, get) => ({
  clubs: [],
  loaded: false,

  load: async () => {
    try {
      const res = await fetch('/api/bag');
      if (res.ok) {
        const data = await res.json();
        set({ clubs: data.clubs ?? [], loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  addClub: async (c) => {
    const res = await fetch('/api/bag', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(c),
    });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed to add club');
    const data = await res.json();
    set((s) => ({ clubs: [...s.clubs, data.club] }));
  },

  updateClub: async (id, updates) => {
    await fetch(`/api/bag/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(updates),
    });
    set((s) => ({ clubs: s.clubs.map((c) => (c.id === id ? { ...c, ...updates } : c)) }));
  },

  removeClub: async (id) => {
    await fetch(`/api/bag/${id}`, { method: 'DELETE' });
    set((s) => ({ clubs: s.clubs.filter((c) => c.id !== id) }));
  },

  bySection: (section) => {
    const all = get().clubs;
    return all
      .filter((c) => SLOT_TO_SECTION[c.slot] === section)
      .sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  },
}));
