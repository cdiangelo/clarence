import { NextRequest, NextResponse } from 'next/server';
import { INVESTMENT_TOOLS } from '@/lib/tools';
import { buildSystemPrompt, type InvestContext } from '@/lib/prompts';
import { makeChartSpec, processWaterfall, type ChartSpec } from '@/lib/charts';
import {
  fetchQuote,
  fetchFinancials,
  fetchPriceHistory,
  fetchOptionsChain,
  fetchUrl,
} from '@/lib/financial';
import { findArbitrageOpportunities, blackScholes, impliedVolatility } from '@/lib/options-math';
import { buildHtml } from '@/lib/reports';
import type { StoreMutation } from '@/lib/mutations';
import type { Thesis } from '@/stores/research';
import type { OptionsAnalysis } from '@/stores/options';

export const maxDuration = 120;

const MODEL = 'claude-opus-4-8';
const API_VERSION = '2023-06-01';

// In-memory options cache; resets on cold start but works across warm invocations
const optionsCache = new Map<string, Awaited<ReturnType<typeof fetchOptionsChain>>>();

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type TextBlock = { type: 'text'; text: string };
type ToolUseBlock = { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> };
type ContentBlock = TextBlock | ToolUseBlock | { type: string; [key: string]: unknown };
type ToolResultBlock = { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };
type Message =
  | { role: 'user' | 'assistant'; content: string }
  | { role: 'assistant'; content: ContentBlock[] }
  | { role: 'user'; content: ToolResultBlock[] };

interface AnthropicResponse {
  content: ContentBlock[];
  stop_reason: string;
}

async function callAnthropic(system: string, messages: Message[]): Promise<AnthropicResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in environment.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': API_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages,
      tools: INVESTMENT_TOOLS,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try { detail = JSON.parse(text)?.error?.message ?? text; } catch { /* */ }
    throw new Error(`Anthropic error ${res.status}: ${detail}`);
  }

  return res.json() as Promise<AnthropicResponse>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message: string;
      history: { role: string; content: string }[];
      context: InvestContext;
    };

    const { message, history, context } = body;
    const system = buildSystemPrompt(context);

    const charts: ChartSpec[] = [];
    const mutations: StoreMutation[] = [];
    const toolsUsed: string[] = [];

    async function handleTool(toolName: string, input: Record<string, unknown>): Promise<string> {
      switch (toolName) {

        case 'fetch_stock_data': {
          const ticker = input.ticker as string;
          try {
            return JSON.stringify(await fetchQuote(ticker), null, 2);
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'fetch_financial_statements': {
          const ticker = input.ticker as string;
          try {
            return JSON.stringify(await fetchFinancials(ticker), null, 2);
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'fetch_price_history': {
          const ticker = input.ticker as string;
          const period = (input.period as string) ?? '1y';
          const interval = (input.interval as string) ?? '1d';
          try {
            const history = await fetchPriceHistory(ticker, period, interval);
            const recent = history.slice(-90);
            return JSON.stringify({ ticker, period, interval, totalBars: history.length, bars: recent }, null, 2);
          } catch (e) { return `Error: ${(e as Error).message}`; }
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
          } catch (e) { return `Error: ${(e as Error).message}`; }
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

            const now = Date.now();
            const enriched = chain.contracts.map((c) => {
              const T = Math.max(0.001, (new Date(c.expiry).getTime() - now) / (365.25 * 24 * 3600 * 1000));
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

            const analysis: OptionsAnalysis = {
              id: uid(),
              ticker,
              spotPrice: chain.spotPrice,
              analysisDate: new Date().toISOString(),
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
            };
            mutations.push({ type: 'options.save', analysis });

            return JSON.stringify({ ticker, spotPrice: chain.spotPrice, atmIV: avgATMIV, arbitrageOpportunities: arbitrages, enrichedContractCount: enriched.length }, null, 2);
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'fetch_url': {
          try {
            return await fetchUrl(input.url as string);
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'save_thesis': {
          try {
            const now = new Date().toISOString();
            const id = uid();
            const thesis: Thesis = {
              id,
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
              createdAt: now,
              updatedAt: now,
            };
            mutations.push({ type: 'research.insert', thesis });
            return JSON.stringify({ success: true, thesisId: id, message: `Thesis saved: "${input.title}"` });
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'update_thesis': {
          try {
            mutations.push({
              type: 'research.update',
              id: input.thesisId as string,
              updates: {
                stage: input.stage as Thesis['stage'] | undefined,
                conviction: input.conviction as 1 | 2 | 3 | 4 | 5 | undefined,
                notes: input.notes as string | undefined,
                pressureTestNotes: input.pressureTestNotes as string | undefined,
                performanceNotes: input.performanceNotes as string | undefined,
                timingRange: input.timingRange as string | undefined,
                targetPrice: input.targetPrice as number | undefined,
              },
            });
            return JSON.stringify({ success: true, thesisId: input.thesisId });
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'add_to_watchlist': {
          try {
            const entry = {
              id: uid(),
              ticker: (input.ticker as string).toUpperCase(),
              name: input.name as string | undefined,
              notes: input.notes as string | undefined,
              alertAbove: input.alertAbove as number | undefined,
              alertBelow: input.alertBelow as number | undefined,
              tags: input.tags as string[] | undefined,
              addedAt: new Date().toISOString(),
            };
            mutations.push({ type: 'watchlist.insert', entry });
            return JSON.stringify({ success: true, message: `Added ${input.ticker} to watchlist` });
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'add_portfolio_position': {
          try {
            const position = {
              id: uid(),
              ticker: input.ticker as string,
              name: input.name as string | undefined,
              shares: input.shares as number,
              avgCost: input.avgCost as number,
              sector: input.sector as string | undefined,
              notes: input.notes as string | undefined,
              addedAt: new Date().toISOString(),
            };
            mutations.push({ type: 'portfolio.insert', position });
            return JSON.stringify({ success: true, message: `Added ${input.ticker} to portfolio` });
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'create_chart': {
          try {
            let processedData = input.data as Record<string, unknown>;
            if (input.type === 'waterfall') {
              const wdata = input.data as { items: { label: string; value: number; isTotal?: boolean; isSubtotal?: boolean }[] };
              processedData = { ...wdata, processed: processWaterfall(wdata.items) };
            }
            const spec = makeChartSpec(
              input.type as Parameters<typeof makeChartSpec>[0],
              input.title as string,
              processedData,
              input.config as import('@/lib/charts').ChartConfig | undefined,
            );
            if (input.subtitle) spec.subtitle = input.subtitle as string;
            charts.push(spec);
            return JSON.stringify({ success: true, chartId: spec.id, message: `Chart "${input.title}" ready` });
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        case 'generate_pdf_report': {
          try {
            const html = buildHtml({
              title: input.title as string,
              subtitle: input.subtitle as string | undefined,
              sections: input.sections as { title: string; content: string; isHtml?: boolean }[],
            });
            mutations.push({ type: 'pdf.generate', title: input.title as string, html });
            return JSON.stringify({ success: true, message: 'PDF prepared — opening print dialog' });
          } catch (e) { return `Error: ${(e as Error).message}`; }
        }

        default:
          return `Unknown tool: ${toolName}`;
      }
    }

    let messages: Message[] = [
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];

    // Claude tool-use loop
    while (true) {
      const response = await callAnthropic(system, messages);

      if (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter((b): b is ToolUseBlock => b.type === 'tool_use');
        const toolResults: ToolResultBlock[] = [];

        for (const block of toolUseBlocks) {
          toolsUsed.push(block.name);
          try {
            const result = await handleTool(block.name, block.input);
            toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
          } catch (err) {
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Error: ${err instanceof Error ? err.message : 'unknown'}`,
              is_error: true,
            });
          }
        }

        messages = [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ];
      } else {
        const text = (response.content.find((b): b is TextBlock => b.type === 'text'))?.text ?? '';
        return NextResponse.json({ text, charts, mutations, toolsUsed });
      }
    }
  } catch (err) {
    console.error('[/api/chat]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
