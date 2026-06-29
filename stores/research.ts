import { create } from 'zustand';

export type ThesisStage = 'developing' | 'active' | 'testing' | 'watching' | 'closed';
export type ThesisDirection = 'long' | 'short' | 'neutral';

export interface ThesisAssumption {
  id?: string;
  text: string;
  confidence: 'high' | 'medium' | 'low';
  softnessFlag?: string;
}

export interface Thesis {
  id: string;
  ticker?: string;
  title: string;
  direction: ThesisDirection;
  stage: ThesisStage;
  conviction: 1 | 2 | 3 | 4 | 5;
  hypothesis: string;
  keyAssumptions: ThesisAssumption[];
  catalysts: string[];
  risks: string[];
  targetPrice?: number;
  stopLoss?: number;
  timingRange?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  pressureTestNotes?: string;
  performanceNotes?: string;
}

interface ResearchStore {
  theses: Thesis[];
  saveThesis: (t: Omit<Thesis, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateThesis: (id: string, updates: Partial<Omit<Thesis, 'id' | 'createdAt'>>) => void;
  deleteThesis: (id: string) => void;
  getThesis: (id: string) => Thesis | undefined;
  getByTicker: (ticker: string) => Thesis[];
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useResearchStore = create<ResearchStore>((set, get) => ({
  theses: [],

  saveThesis: (t) => {
    const id = uid();
    const now = new Date().toISOString();
    set((s) => ({
      theses: [...s.theses, { ...t, id, createdAt: now, updatedAt: now }],
    }));
    return id;
  },

  updateThesis: (id, updates) =>
    set((s) => ({
      theses: s.theses.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t,
      ),
    })),

  deleteThesis: (id) =>
    set((s) => ({ theses: s.theses.filter((t) => t.id !== id) })),

  getThesis: (id) => get().theses.find((t) => t.id === id),

  getByTicker: (ticker) =>
    get().theses.filter((t) => t.ticker?.toUpperCase() === ticker.toUpperCase()),
}));
