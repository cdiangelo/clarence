import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OptionsAnalysis {
  id: string;
  ticker: string;
  spotPrice: number;
  analysisDate: string;
  summary: string;
  arbitrageFlags: ArbitrageFlag[];
  skewNotes: string;
  ivRank?: number;
}

export interface ArbitrageFlag {
  type: 'put_call_parity' | 'calendar_spread' | 'box_spread' | 'skew_extreme';
  description: string;
  edge: number;
  expiry?: string;
  strikes?: number[];
  confidence: 'high' | 'medium' | 'low';
}

export interface OptionsPosition {
  id: string;
  ticker: string;
  type: 'call' | 'put';
  strike: number;
  expiry: string;
  contracts: number;
  premiumPaid: number;
  openDate: string;
  notes?: string;
}

interface OptionsStore {
  analyses: OptionsAnalysis[];
  positions: OptionsPosition[];
  saveAnalysis: (a: Omit<OptionsAnalysis, 'id' | 'analysisDate'>) => string;
  insertAnalysis: (analysis: OptionsAnalysis) => void;
  addPosition: (p: Omit<OptionsPosition, 'id' | 'openDate'>) => string;
  closePosition: (id: string) => void;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const useOptionsStore = create<OptionsStore>()(
  persist(
    (set) => ({
      analyses: [],
      positions: [],

      saveAnalysis: (a) => {
        const id = uid();
        set((s) => ({
          analyses: [{ ...a, id, analysisDate: new Date().toISOString() }, ...s.analyses.slice(0, 49)],
        }));
        return id;
      },

      insertAnalysis: (analysis) =>
        set((s) => ({
          analyses: s.analyses.some((a) => a.id === analysis.id)
            ? s.analyses
            : [analysis, ...s.analyses.slice(0, 49)],
        })),

      addPosition: (p) => {
        const id = uid();
        set((s) => ({
          positions: [...s.positions, { ...p, id, openDate: new Date().toISOString() }],
        }));
        return id;
      },

      closePosition: (id) =>
        set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),
    }),
    { name: 'clarence-options' },
  ),
);
