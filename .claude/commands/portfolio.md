Portfolio management and analysis. Arguments: $ARGUMENTS

Parse the intent:
- `add TICKER SHARES PRICE [sector] [notes]` → Add or update a position
- `remove TICKER` → Remove a position  
- `review` or no argument → Full portfolio analysis
- `rebalance [target e.g. "equal weight" or "reduce tech"]` → Rebalancing analysis
- `cash AMOUNT` → Update cash balance
- `note TICKER "text"` → Add notes to a position

---

## For add / remove / cash / note operations:

Read `.clarence/portfolio.json`. Make the requested change. Write it back.

Portfolio JSON format:
```json
{
  "positions": [
    {
      "ticker": "AAPL",
      "shares": 100,
      "avgCost": 185.00,
      "sector": "Technology",
      "addedAt": "2025-01-15",
      "notes": ""
    }
  ],
  "cash": 10000,
  "notes": ""
}
```

After writing, confirm the change and show the updated position or cash balance.

---

## For review:

### 1. Load & Enrich

Read `.clarence/portfolio.json`. For each ticker, fetch current price:
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/TICKER?modules=price`

Build a working table with: ticker, sector, shares, avg cost, current price, market value, cost basis, unrealized P&L ($), unrealized P&L (%), weight.

### 2. Portfolio Summary

| Metric | Value |
|--------|-------|
| Total Market Value | |
| Total Cost Basis | |
| Unrealized P&L | $ + % |
| Cash | |
| Total Portfolio Value | |
| # Positions | |
| Largest Position Weight | |
| Portfolio Beta (estimated) | |

### 3. Position Table

| Ticker | Sector | Shares | Avg Cost | Current | MktVal | P&L $ | P&L % | Weight |
|--------|--------|--------|----------|---------|--------|-------|-------|--------|

Sort by weight descending.

### 4. Concentration Analysis

- Top 3 positions as % of portfolio
- Sector concentration: list sectors with total weight each
- Correlation risk: flag any obvious pairs that move together (e.g., two semis, two mega-cap tech)
- Single-stock risk: any position > 20% is a flag

### 5. Performance Attribution
If there are gains and losses, break down: which positions drove P&L? Which are the biggest drags?

### 6. Cross-Reference With Theses

Check `.clarence/theses/` — are there active theses for any held positions? If so, note whether the current price is above/below thesis target and current stage.

### 7. Generate Charts

Write `.clarence/artifacts/portfolio-YYYY-MM-DD.html` with Chart.js:

**Chart 1 — Sunburst / Nested Allocation**
Since Chart.js doesn't have native sunburst, use a doughnut chart for sector allocation and a second doughnut for individual positions. Side by side.
- Outer ring: sectors (by total weight)
- Inner table: positions within each sector
- Title: "Portfolio Allocation — [Date]"

**Chart 2 — P&L Bar Chart**
- Horizontal bars: each position, colored green (gain) or red (loss)
- X-axis: unrealized P&L %
- Title: "Position P&L"

Dark theme. Save path: `.clarence/artifacts/portfolio-YYYY-MM-DD.html`.

---

## For rebalance:

Read current portfolio. Parse the rebalancing target from arguments. Then:

1. Show current vs. target allocation
2. Calculate trades needed ($ amounts and share counts at current prices) to reach target
3. Flag: which trades are largest, any tax considerations (short vs. long-term if dates suggest < 1yr hold)
4. Show resulting portfolio after rebalance

Output as a clean trade list:
| Action | Ticker | Shares | Approx. Value | Reason |
|--------|--------|--------|--------------|--------|

Don't execute anything — this is analysis only.
