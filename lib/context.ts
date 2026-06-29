import type { InvestContext } from './prompts';
import type { ChartSpec } from './charts';
import { makeChartSpec, processWaterfall } from './charts';
import { fetchQuote, fetchFinancials, fetchPriceHistory, fetchOptionsChain, fetchUrl } from './financial';
import { findArbitrageOpportunities, blackScholes, impliedVolatility } from './options-math';
import { generateAndSharePdf } from './reports';
import { usePortfolioStore } from '../stores/portfolio';
import { useResearchStore } from '../stores/research';
import { useWatchlistStore } from '../stores/watchlist';
import { useOptionsStore } from '../stores/options';
import type { ToolHandler } from './claude';

const optionsCache = new Map<string, Awaited<ReturnType<typeof fetchOptionsChain>>>();

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

export function buildToolHandler(pendingCharts: ChartSpec[]): ToolHandler {
  return async (toolName: string, input: Record<string, unknown>): Promise<string> => {
    switch (toolName) {
      case 'fetch_stock_data': {
        const ticker = input.ticker as string;
        try {
          const quote = await fetchQuote(ticker);
          return JSON.stringify(quote, null, 2);
        } catch (e) {
          return `Error fetching ${ticker}: ${(e as Error).message}`;
        }
      }

      case 'fetch_financial_statements': {
        const ticker = input.ticker as string;
        try {
          const financials = await fetchFinancials(ticker);
          return JSON.stringify(financials, null, 2);
        } catch (e) {
          return `Error fetching financials for ${ticker}: ${(e as Error).message}`;
        }
      }

      case 'fetch_price_history': {
        const ticker = input.ticker as string;
        const period = (input.period as string) ?? '1y';
        const interval = (input.interval as string) ?? '1d';
        try {
          const history = await fetchPriceHistory(ticker, period, interval);
          const recent = history.slice(-90);
          return JSON.stringify({ ticker, period, interval, totalBars: history.length, bars: recent }, null, 2);
        } catch (e) {
          return `Error fetching price history for ${ticker}: ${(e as Error).message}`;
        }
      }

      case 'fetch_options_chain': {
        const ticker = input.ticker as string;
        try {
          const chain = await fetchOptionsChain(ticker);
          optionsCache.set(ticker.toUpperCase(), chain);
          const calls = chain.contracts.filter((c) => c.type === 'call').slice(0, 15);
          const puts = chain.contracts.filter((c) => c.type === 'put').slice(0, 15);
          return JSON.stringify({
            ticker: chain.ticker,
            spotPrice: chain.spotPrice,
            expiryDates: chain.expiryDates,
            callCount: chain.contracts.filter((c) => c.type === 'call').length,
            putCount: chain.contracts.filter((c) => c.type === 'put').length,
            sampleCalls: calls,
            samplePuts: puts,
          }, null, 2);
        } catch (e) {
          return `Error fetching options for ${ticker}: ${(e as Error).message}`;
        }
      }

      case 'analyze_options_arbitrage': {
        const ticker = (input.ticker as string).toUpperCase();
        const r = (input.riskFreeRate as number) ?? 0.05;
        try {
          let chain = optionsCache.get(ticker);
          if (!chain) {
            chain = await fetchOptionsChain(ticker);
            optionsCache.set(ticker, chain);
          }

          const today = Date.now();
          const enriched = chain.contracts.map((c) => {
            const T = Math.max(0.001, (new Date(c.expiry).getTime() - today) / (365.25 * 24 * 3600 * 1000));
            const mid = (c.bid + c.ask) / 2;
            const iv = mid > 0.01 ? (impliedVolatility(mid, chain!.spotPrice, c.strike, T, r, c.type) ?? c.impliedVol) : c.impliedVol;
            const greeks = blackScholes(chain!.spotPrice, c.strike, T, r, Math.max(0.01, iv), c.type);
            return { ...c, impliedVol: iv, delta: greeks.delta, gamma: greeks.gamma, theta: greeks.theta, vega: greeks.vega };
          });

          const arbitrages = findArbitrageOpportunities(
            enriched.map((c) => ({ strike: c.strike, expiry: c.expiry, type: c.type, bid: c.bid, ask: c.ask, last: c.last, impliedVol: c.impliedVol })),
            chain.spotPrice,
            r,
          );

          const atmCalls = enriched.filter((c) => c.type === 'call' && Math.abs(c.strike / chain!.spotPrice - 1) < 0.03);
          const avgATMIV = atmCalls.length > 0 ? atmCalls.reduce((s, c) => s + c.impliedVol, 0) / atmCalls.length : null;

          useOptionsStore.getState().saveAnalysis({
            ticker,
            spotPrice: chain.spotPrice,
            summary: `${arbitrages.length} edges found. ATM IV: ${avgATMIV ? (avgATMIV * 100).toFixed(0) + '%' : 'N/A'}`,
            arbitrageFlags: arbitrages.map((a) => ({
              type: a.type as 'put_call_parity' | 'calendar_spread' | 'box_spread' | 'skew_extreme',
              description: a.description,
              edge: a.edge,
              confidence: a.confidence,
              expiry: a.expiry,
              strikes: a.strike ? [a.strike] : undefined,
            })),
            skewNotes: '',
            ivRank: undefined,
          });

          return JSON.stringify({
            ticker,
            spotPrice: chain.spotPrice,
            atmIV: avgATMIV,
            arbitrageOpportunities: arbitrages,
            enrichedContractCount: enriched.length,
          }, null, 2);
        } catch (e) {
          return `Error analyzing options for ${ticker}: ${(e as Error).message}`;
        }
      }

      case 'fetch_url': {
        const url = input.url as string;
        try {
          return await fetchUrl(url);
        } catch (e) {
          return `Error fetching URL: ${(e as Error).message}`;
        }
      }

      case 'save_thesis': {
        try {
          const id = useResearchStore.getState().saveThesis({
            ticker: input.ticker as string | undefined,
            title: input.title as string,
            direction: input.direction as 'long' | 'short' | 'neutral',
            stage: input.stage as 'developing' | 'active' | 'testing' | 'watching',
            conviction: input.conviction as 1 | 2 | 3 | 4 | 5,
            hypothesis: input.hypothesis as string,
            keyAssumptions: (input.keyAssumptions as { text: string; confidence: 'high' | 'medium' | 'low'; softnessFlag?: string }[]) ?? [],
            catalysts: (input.catalysts as string[]) ?? [],
            risks: (input.risks as string[]) ?? [],
            targetPrice: input.targetPrice as number | undefined,
            stopLoss: input.stopLoss as number | undefined,
            timingRange: input.timingRange as string | undefined,
            notes: (input.notes as string) ?? '',
            pressureTestNotes: undefined,
            performanceNotes: undefined,
          });
          return JSON.stringify({ success: true, thesisId: id, message: `Thesis saved: "${input.title}"` });
        } catch (e) {
          return `Error saving thesis: ${(e as Error).message}`;
        }
      }

      case 'update_thesis': {
        try {
          useResearchStore.getState().updateThesis(input.thesisId as string, {
            stage: input.stage as 'developing' | 'active' | 'testing' | 'watching' | 'closed' | undefined,
            conviction: input.conviction as 1 | 2 | 3 | 4 | 5 | undefined,
            notes: input.notes as string | undefined,
            pressureTestNotes: input.pressureTestNotes as string | undefined,
            performanceNotes: input.performanceNotes as string | undefined,
            timingRange: input.timingRange as string | undefined,
            targetPrice: input.targetPrice as number | undefined,
          });
          return JSON.stringify({ success: true, thesisId: input.thesisId });
        } catch (e) {
          return `Error updating thesis: ${(e as Error).message}`;
        }
      }

      case 'add_to_watchlist': {
        try {
          useWatchlistStore.getState().add({
            ticker: input.ticker as string,
            name: input.name as string | undefined,
            notes: input.notes as string | undefined,
            alertAbove: input.alertAbove as number | undefined,
            alertBelow: input.alertBelow as number | undefined,
            tags: input.tags as string[] | undefined,
          });
          return JSON.stringify({ success: true, message: `Added ${input.ticker} to watchlist` });
        } catch (e) {
          return `Error adding to watchlist: ${(e as Error).message}`;
        }
      }

      case 'add_portfolio_position': {
        try {
          usePortfolioStore.getState().addPosition({
            ticker: input.ticker as string,
            name: input.name as string | undefined,
            shares: input.shares as number,
            avgCost: input.avgCost as number,
            sector: input.sector as string | undefined,
            notes: input.notes as string | undefined,
          });
          return JSON.stringify({ success: true, message: `Added ${input.ticker} to portfolio` });
        } catch (e) {
          return `Error adding portfolio position: ${(e as Error).message}`;
        }
      }

      case 'create_chart': {
        try {
          let processedData = input.data as Record<string, unknown>;
          // Pre-process waterfall items into computed start/end positions
          if (input.type === 'waterfall') {
            const wdata = input.data as { items: { label: string; value: number; isTotal?: boolean; isSubtotal?: boolean }[] };
            processedData = { ...wdata, processed: processWaterfall(wdata.items) };
          }
          const spec = makeChartSpec(
            input.type as Parameters<typeof makeChartSpec>[0],
            input.title as string,
            processedData,
            input.config as import('./charts').ChartConfig | undefined,
          );
          if (input.subtitle) spec.subtitle = input.subtitle as string;
          pendingCharts.push(spec);
          return JSON.stringify({ success: true, chartId: spec.id, message: `Chart "${input.title}" queued for display` });
        } catch (e) {
          return `Error creating chart: ${(e as Error).message}`;
        }
      }

      case 'generate_pdf_report': {
        try {
          const uri = await generateAndSharePdf({
            title: input.title as string,
            subtitle: input.subtitle as string | undefined,
            sections: input.sections as { title: string; content: string; isHtml?: boolean }[],
          });
          return JSON.stringify({ success: true, uri, message: 'PDF generated and share sheet opened' });
        } catch (e) {
          return `Error generating PDF: ${(e as Error).message}`;
        }
      }

      default:
        return `Unknown tool: ${toolName}`;
    }
  };
}
