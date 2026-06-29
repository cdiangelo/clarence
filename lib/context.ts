import type { InvestContext } from './prompts';
import { usePortfolioStore } from '../stores/portfolio';
import { useResearchStore } from '../stores/research';
import { useWatchlistStore } from '../stores/watchlist';

export function buildContext(): InvestContext {
  const portfolio = usePortfolioStore.getState();
  const research = useResearchStore.getState();
  const watchlist = useWatchlistStore.getState();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return {
    date: today,
    portfolio: {
      positions: portfolio.positions.map((p) => ({
        ticker: p.ticker,
        shares: p.shares,
        avgCost: p.avgCost,
        sector: p.sector,
        notes: p.notes,
      })),
      cash: portfolio.cash,
    },
    watchlist: watchlist.entries.map((e) => ({
      ticker: e.ticker,
      notes: e.notes,
      tags: e.tags,
    })),
    activeTheses: research.theses
      .filter((t) => t.stage !== 'closed')
      .map((t) => ({
        id: t.id,
        ticker: t.ticker,
        title: t.title,
        direction: t.direction,
        stage: t.stage,
        conviction: t.conviction,
        timingRange: t.timingRange,
      })),
  };
}
