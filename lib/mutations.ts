import type { Thesis } from '../stores/research';
import type { Position } from '../stores/portfolio';
import type { WatchlistEntry } from '../stores/watchlist';
import type { OptionsAnalysis } from '../stores/options';

export type StoreMutation =
  | { type: 'research.insert'; thesis: Thesis }
  | { type: 'research.update'; id: string; updates: Partial<Omit<Thesis, 'id' | 'createdAt'>> }
  | { type: 'portfolio.insert'; position: Position }
  | { type: 'watchlist.insert'; entry: WatchlistEntry }
  | { type: 'options.save'; analysis: OptionsAnalysis }
  | { type: 'pdf.generate'; title: string; html: string };

export function applyMutations(mutations: StoreMutation[]): void {
  if (!mutations?.length) return;

  const { useResearchStore } = require('../stores/research');
  const { usePortfolioStore } = require('../stores/portfolio');
  const { useWatchlistStore } = require('../stores/watchlist');
  const { useOptionsStore } = require('../stores/options');

  for (const m of mutations) {
    switch (m.type) {
      case 'research.insert':
        useResearchStore.getState().insertThesis(m.thesis);
        break;
      case 'research.update':
        useResearchStore.getState().updateThesis(m.id, m.updates);
        break;
      case 'portfolio.insert':
        usePortfolioStore.getState().insertPosition(m.position);
        break;
      case 'watchlist.insert':
        useWatchlistStore.getState().insertEntry(m.entry);
        break;
      case 'options.save':
        useOptionsStore.getState().insertAnalysis(m.analysis);
        break;
      case 'pdf.generate': {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(m.html);
          w.document.close();
          setTimeout(() => w.print(), 500);
        }
        break;
      }
    }
  }
}
