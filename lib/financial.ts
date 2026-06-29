const YF_BASE = 'https://query1.finance.yahoo.com';
const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

export interface Quote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  forwardPE: number | null;
  eps: number | null;
  beta: number | null;
  week52High: number;
  week52Low: number;
  dividendYield: number | null;
  shortFloat: number | null;
  currency: string;
}

export interface IncomeStatement {
  date: string;
  revenue: number;
  grossProfit: number;
  ebit: number;
  ebitda: number | null;
  netIncome: number;
  eps: number | null;
}

export interface BalanceSheet {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  cash: number;
  totalDebt: number;
  netDebt: number;
}

export interface CashFlow {
  date: string;
  operatingCashFlow: number;
  capex: number;
  freeCashFlow: number;
}

export interface Financials {
  ticker: string;
  incomeStatements: IncomeStatement[];
  balanceSheets: BalanceSheet[];
  cashFlows: CashFlow[];
}

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionContract {
  strike: number;
  expiry: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  impliedVol: number;
  openInterest: number;
  volume: number;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  inTheMoney: boolean;
}

export interface OptionsChain {
  ticker: string;
  spotPrice: number;
  expiryDates: string[];
  contracts: OptionContract[];
}

async function yfFetch(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`Yahoo Finance error ${res.status} for ${url}`);
  return res.json();
}

export async function fetchQuote(ticker: string): Promise<Quote> {
  const url = `${YF_BASE}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=price,defaultKeyStatistics,summaryDetail,financialData`;
  const data = (await yfFetch(url)) as { quoteSummary?: { result?: unknown[] } };
  const result = data?.quoteSummary?.result?.[0] as Record<string, Record<string, { raw?: number; fmt?: string }>> | undefined;
  if (!result) throw new Error(`No data found for ${ticker}`);

  const p = result.price ?? {};
  const ks = result.defaultKeyStatistics ?? {};
  const sd = result.summaryDetail ?? {};

  function raw(obj: Record<string, { raw?: number; fmt?: string }>, key: string): number | null {
    return obj[key]?.raw ?? null;
  }

  return {
    ticker: ticker.toUpperCase(),
    name: (p.longName as unknown as string) ?? (p.shortName as unknown as string) ?? ticker,
    price: raw(p, 'regularMarketPrice') ?? 0,
    change: raw(p, 'regularMarketChange') ?? 0,
    changePct: (raw(p, 'regularMarketChangePercent') ?? 0) * 100,
    volume: raw(p, 'regularMarketVolume') ?? 0,
    avgVolume: raw(p, 'averageDailyVolume10Day') ?? 0,
    marketCap: raw(p, 'marketCap') ?? 0,
    peRatio: raw(sd, 'trailingPE'),
    forwardPE: raw(sd, 'forwardPE'),
    eps: raw(ks, 'trailingEps'),
    beta: raw(ks, 'beta'),
    week52High: raw(sd, 'fiftyTwoWeekHigh') ?? 0,
    week52Low: raw(sd, 'fiftyTwoWeekLow') ?? 0,
    dividendYield: raw(sd, 'dividendYield'),
    shortFloat: raw(ks, 'shortPercentOfFloat'),
    currency: (p.currency as unknown as string) ?? 'USD',
  };
}

export async function fetchFinancials(ticker: string): Promise<Financials> {
  const url = `${YF_BASE}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory`;
  const data = (await yfFetch(url)) as { quoteSummary?: { result?: unknown[] } };
  const result = data?.quoteSummary?.result?.[0] as Record<string, { incomeStatementHistory?: unknown[]; balanceSheetStatements?: unknown[]; cashflowStatements?: unknown[] }> | undefined;
  if (!result) throw new Error(`No financials for ${ticker}`);

  function r(obj: Record<string, { raw?: number }>, key: string): number {
    return obj[key]?.raw ?? 0;
  }

  const rawIS = (result.incomeStatementHistory?.incomeStatementHistory ?? []) as Record<string, { raw?: number }>[];
  const rawBS = (result.balanceSheetHistory?.balanceSheetStatements ?? []) as Record<string, { raw?: number }>[];
  const rawCF = (result.cashflowStatementHistory?.cashflowStatements ?? []) as Record<string, { raw?: number }>[];

  const incomeStatements: IncomeStatement[] = rawIS.map((s) => ({
    date: new Date((r(s as Record<string, { raw?: number }>, 'endDate') || 0) * 1000).toISOString().slice(0, 10),
    revenue: r(s, 'totalRevenue'),
    grossProfit: r(s, 'grossProfit'),
    ebit: r(s, 'ebit'),
    ebitda: r(s, 'ebitda') || null,
    netIncome: r(s, 'netIncome'),
    eps: r(s, 'basicEps') || null,
  }));

  const balanceSheets: BalanceSheet[] = rawBS.map((s) => {
    const assets = r(s, 'totalAssets');
    const liabilities = r(s, 'totalLiabilities');
    const cash = r(s, 'cash');
    const debt = r(s, 'longTermDebt') + r(s, 'shortLongTermDebt');
    return {
      date: new Date((r(s as Record<string, { raw?: number }>, 'endDate') || 0) * 1000).toISOString().slice(0, 10),
      totalAssets: assets,
      totalLiabilities: liabilities,
      totalEquity: assets - liabilities,
      cash,
      totalDebt: debt,
      netDebt: debt - cash,
    };
  });

  const cashFlows: CashFlow[] = rawCF.map((s) => {
    const ocf = r(s, 'totalCashFromOperatingActivities');
    const capex = Math.abs(r(s, 'capitalExpenditures'));
    return {
      date: new Date((r(s as Record<string, { raw?: number }>, 'endDate') || 0) * 1000).toISOString().slice(0, 10),
      operatingCashFlow: ocf,
      capex,
      freeCashFlow: ocf - capex,
    };
  });

  return { ticker: ticker.toUpperCase(), incomeStatements, balanceSheets, cashFlows };
}

export async function fetchPriceHistory(ticker: string, period = '1y', interval = '1d'): Promise<OHLCVBar[]> {
  const url = `${YF_BASE}/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&range=${period}`;
  const data = (await yfFetch(url)) as { chart?: { result?: unknown[] } };
  const result = data?.chart?.result?.[0] as {
    timestamp?: number[];
    indicators?: { quote?: { open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] }[] };
  } | undefined;
  if (!result?.timestamp) throw new Error(`No price history for ${ticker}`);

  const ts = result.timestamp;
  const q = result.indicators?.quote?.[0];
  if (!q) throw new Error(`No quote data for ${ticker}`);

  return ts.map((t, i) => ({
    date: new Date(t * 1000).toISOString().slice(0, 10),
    open: q.open[i] ?? 0,
    high: q.high[i] ?? 0,
    low: q.low[i] ?? 0,
    close: q.close[i] ?? 0,
    volume: q.volume[i] ?? 0,
  })).filter((b) => b.close > 0);
}

export async function fetchOptionsChain(ticker: string, expiryTimestamp?: number): Promise<OptionsChain> {
  let url = `${YF_BASE}/v7/finance/options/${encodeURIComponent(ticker)}`;
  if (expiryTimestamp) url += `?date=${expiryTimestamp}`;

  const data = (await yfFetch(url)) as {
    optionChain?: {
      result?: {
        quote?: { regularMarketPrice?: number };
        expirationDates?: number[];
        options?: {
          calls?: unknown[];
          puts?: unknown[];
          expirationDate?: number;
        }[];
      }[];
    };
  };

  const result = data?.optionChain?.result?.[0];
  if (!result) throw new Error(`No options data for ${ticker}`);

  const spot = result.quote?.regularMarketPrice ?? 0;
  const expiryDates = (result.expirationDates ?? []).map((ts) =>
    new Date(ts * 1000).toISOString().slice(0, 10),
  );

  function parseContracts(raw: unknown[], type: 'call' | 'put', expiryDate: string): OptionContract[] {
    return (raw as Record<string, { raw?: number } | boolean | string>[]).map((c) => {
      function rv(key: string): number {
        const val = c[key];
        if (typeof val === 'object' && val !== null && 'raw' in val) return (val as { raw?: number }).raw ?? 0;
        return 0;
      }
      return {
        strike: rv('strike'),
        expiry: expiryDate,
        type,
        bid: rv('bid'),
        ask: rv('ask'),
        last: rv('lastPrice'),
        impliedVol: rv('impliedVolatility'),
        openInterest: rv('openInterest'),
        volume: rv('volume'),
        delta: null,
        gamma: null,
        theta: null,
        vega: null,
        inTheMoney: !!(c.inTheMoney),
      };
    });
  }

  const contracts: OptionContract[] = [];
  for (const opts of result.options ?? []) {
    const exp = opts.expirationDate
      ? new Date(opts.expirationDate * 1000).toISOString().slice(0, 10)
      : expiryDates[0] ?? '';
    contracts.push(...parseContracts(opts.calls ?? [], 'call', exp));
    contracts.push(...parseContracts(opts.puts ?? [], 'put', exp));
  }

  return { ticker: ticker.toUpperCase(), spotPrice: spot, expiryDates, contracts };
}

export async function fetchUrl(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const text = await res.text();
  // Strip HTML tags and return readable text, capped at 8000 chars
  const stripped = text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, 8000);
}

export function formatLargeNumber(n: number): string {
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}
