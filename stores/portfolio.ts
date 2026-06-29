import { create } from 'zustand';

export interface Position {
  id: string;
  ticker: string;
  name?: string;
  shares: number;
  avgCost: number;
  sector?: string;
  notes?: string;
  addedAt: string;
}

export interface PortfolioSnapshot {
  date: string;
  totalValue: number;
}

interface PortfolioStore {
  positions: Position[];
  cash: number;
  snapshots: PortfolioSnapshot[];
  addPosition: (p: Omit<Position, 'id' | 'addedAt'>) => void;
  updatePosition: (id: string, updates: Partial<Omit<Position, 'id'>>) => void;
  removePosition: (id: string) => void;
  setCash: (amount: number) => void;
  addSnapshot: (totalValue: number) => void;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const usePortfolioStore = create<PortfolioStore>((set) => ({
  positions: [],
  cash: 0,
  snapshots: [],

  addPosition: (p) =>
    set((s) => ({
      positions: [...s.positions, { ...p, id: uid(), addedAt: new Date().toISOString() }],
    })),

  updatePosition: (id, updates) =>
    set((s) => ({
      positions: s.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removePosition: (id) =>
    set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),

  setCash: (amount) => set({ cash: amount }),

  addSnapshot: (totalValue) =>
    set((s) => ({
      snapshots: [...s.snapshots.slice(-365), { date: new Date().toISOString(), totalValue }],
    })),
}));
