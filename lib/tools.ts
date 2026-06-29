export interface ToolDef {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const INVESTMENT_TOOLS: ToolDef[] = [
  {
    name: 'fetch_stock_data',
    description: 'Fetch real-time quote and key statistics for a stock ticker. Always call this before discussing price or valuation specifics.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string', description: 'Stock ticker symbol (e.g., AAPL, NVDA, MSFT)' },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'fetch_financial_statements',
    description: 'Fetch 3-4 years of income statement, balance sheet, and cash flow statement data for a company. Use for earnings quality analysis, trend analysis, and DCF inputs.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string', description: 'Stock ticker symbol' },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'fetch_price_history',
    description: 'Fetch OHLCV price history for charting, technical analysis, and volatility calculations.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string' },
        period: {
          type: 'string',
          description: 'Time period',
          enum: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'],
        },
        interval: {
          type: 'string',
          description: 'Bar interval',
          enum: ['1m', '5m', '15m', '1h', '1d', '1wk', '1mo'],
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'fetch_options_chain',
    description: 'Fetch the full options chain for a ticker including IV, OI, Greeks. Use for options analytics, IV rank, and pre-screening arbitrage.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string' },
        expiry: {
          type: 'string',
          description: 'Optional specific expiry date YYYY-MM-DD. If omitted, fetches nearest expiry.',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'analyze_options_arbitrage',
    description: 'Run put-call parity checks, box spread detection, and skew analysis on the options chain to identify statistical edges. Requires fetch_options_chain to have been called first.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string' },
        riskFreeRate: {
          type: 'number',
          description: 'Annual risk-free rate as decimal (default 0.05)',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'fetch_url',
    description: 'Fetch and extract text content from any URL — earnings call transcripts, investor presentations, company websites, news articles, SEC filings on EDGAR.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Full URL to fetch' },
      },
      required: ['url'],
    },
  },
  {
    name: 'save_thesis',
    description: 'Persist an investment thesis to the research store after developing it. Include explicit assumption mapping and softness flags — these are the core of the contrarian edge.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string', description: 'Ticker symbol (omit for macro/thematic theses)' },
        title: { type: 'string', description: 'Concise thesis title' },
        direction: { type: 'string', enum: ['long', 'short', 'neutral'] },
        stage: { type: 'string', enum: ['developing', 'active', 'testing', 'watching'] },
        conviction: { type: 'number', description: '1–5 conviction score', minimum: 1, maximum: 5 },
        hypothesis: {
          type: 'string',
          description: 'The contrarian view: what does the market believe, and why is that belief soft or wrong?',
        },
        keyAssumptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              softnessFlag: { type: 'string', description: 'The weakest link in this assumption' },
            },
            required: ['text', 'confidence'],
          },
        },
        catalysts: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' }, description: 'What would invalidate this thesis' },
        targetPrice: { type: 'number' },
        stopLoss: { type: 'number' },
        timingRange: {
          type: 'string',
          description: 'Probability-weighted window, e.g. "Q2-Q3 2025 driven by earnings revision cycle"',
        },
        notes: { type: 'string' },
      },
      required: ['title', 'direction', 'stage', 'conviction', 'hypothesis', 'keyAssumptions', 'catalysts', 'risks', 'notes'],
    },
  },
  {
    name: 'update_thesis',
    description: 'Update an existing thesis — stage change, new data, pressure test results, or performance tracking.',
    input_schema: {
      type: 'object',
      properties: {
        thesisId: { type: 'string' },
        stage: { type: 'string', enum: ['developing', 'active', 'testing', 'watching', 'closed'] },
        conviction: { type: 'number', minimum: 1, maximum: 5 },
        notes: { type: 'string' },
        pressureTestNotes: { type: 'string' },
        performanceNotes: { type: 'string' },
        timingRange: { type: 'string' },
        targetPrice: { type: 'number' },
      },
      required: ['thesisId'],
    },
  },
  {
    name: 'add_to_watchlist',
    description: 'Add a security to the watchlist for ongoing monitoring.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string' },
        name: { type: 'string' },
        notes: { type: 'string', description: 'Why this is on the watchlist' },
        alertAbove: { type: 'number' },
        alertBelow: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'add_portfolio_position',
    description: 'Record a position in the portfolio for performance tracking.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string' },
        name: { type: 'string' },
        shares: { type: 'number' },
        avgCost: { type: 'number' },
        sector: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['ticker', 'shares', 'avgCost'],
    },
  },
  {
    name: 'create_chart',
    description: 'Create a data visualization to display inline in chat. Use for: price history (candlestick/line), financial trends (bar/combo), valuation comps (scatter), multi-factor analysis (radar), financial bridges (waterfall).',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['bar', 'line', 'waterfall', 'radar', 'scatter', 'candlestick', 'combo', 'slope', 'heatmap', 'annotated_line'],
        },
        title: { type: 'string' },
        subtitle: { type: 'string' },
        data: {
          type: 'object',
          description: `Chart data schemas by type:
- bar/line: {labels:string[], datasets:[{label,values:number[],color?}]}
- waterfall: {items:[{label,value,isTotal?,isSubtotal?}]} — use for financial bridges (revenue→EBIT→NI)
- radar: {axes:string[], datasets:[{label,values:number[]}], maxValue?} — multi-factor scoring
- scatter: {points:[{x,y,label?,highlight?}]} — valuation comps, risk/return
- candlestick: {bars:[{date,open,high,low,close,volume?}]}
- combo: {labels, bars:{label,values}, lines:[{label,values,color?}]} — revenue bars + margin line
- slope: {items:[{label,before,after,color?}], beforeLabel, afterLabel} — before/after comparison e.g. pre/post earnings, sector rotation
- heatmap: {rowLabels, colLabels, values:number[][], colorScale?:'rg'|'diverging'|'sequential'} — correlation matrix, factor exposures, return calendar
- annotated_line: {labels:string[], values:number[], annotations?:[{x:string|number, label, type?:'fed'|'earnings'|'macro'|'news'}], secondaryValues?, secondaryLabel?} — price/metric with contextual event markers; excellent for layering macro/political/social context onto financial data`,
        },
        config: {
          type: 'object',
          properties: {
            xLabel: { type: 'string' },
            yLabel: { type: 'string' },
            formatY: { type: 'string', enum: ['number', 'percent', 'currency', 'billions'] },
            showValues: { type: 'boolean' },
          },
        },
      },
      required: ['type', 'title', 'data'],
    },
  },
  {
    name: 'generate_pdf_report',
    description: 'Generate and share a professionally formatted PDF research report. Use when user asks for a full report, deep dive, or PDF output.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        subtitle: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string', description: 'Section content. May include basic HTML for tables.' },
              isHtml: { type: 'boolean', description: 'Set true if content contains HTML markup' },
            },
            required: ['title', 'content'],
          },
        },
      },
      required: ['title', 'sections'],
    },
  },
];
