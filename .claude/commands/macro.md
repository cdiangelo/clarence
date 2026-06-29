Macro regime analysis and cross-asset positioning. Topic or question: $ARGUMENTS

This skill covers: rate environment, sector rotation, factor exposure, cross-asset correlations, and how current macro context maps to specific equities or trades.

---

## 1. Determine Scope from Arguments

Parse the intent from "$ARGUMENTS":

- **No arguments or "overview"** → Full current macro regime snapshot
- **Sector name** (e.g., "banks", "tech", "energy") → Sector-specific macro mapping
- **Rate-related** (e.g., "rates", "fed", "yield curve") → Rate sensitivity deep dive  
- **Specific question** (e.g., "what happens to REITs if 10yr hits 5%") → Scenario analysis
- **Ticker-linked** (e.g., "NVDA macro tailwinds") → Map macro to specific equity thesis

---

## 2. Fetch Current Macro Data

Use WebFetch to get current readings:

**Fetch the 10yr yield first — it is the data gate:**
`https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=3mo` (10yr)

**If this fails: STOP. Say:** "Cannot fetch live macro data. Run locally where Yahoo Finance is accessible. No analysis without data."

**Do not substitute training-knowledge macro figures for live data.**

Also fetch:
`https://query1.finance.yahoo.com/v8/finance/chart/%5EIRX?interval=1d&range=3mo` (13w)
`https://query1.finance.yahoo.com/v8/finance/chart/%5ETYX?interval=1d&range=3mo` (30yr)

**Key indices:**
`https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1wk&range=1y` (SPX)
`https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=3mo` (VIX)
`https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=3mo` (DXY)
`https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=3mo` (Gold)

**Sector ETFs for rotation read (pick relevant ones):**
XLF (financials), XLK (tech), XLE (energy), XLV (health), XLI (industrials), XLRE (real estate), XLU (utilities), XLY (consumer disc), XLP (consumer staples)

Also search the web for: latest Fed meeting statement or minutes, current CPI/PCE reading, and any recent macro regime-defining data points.

---

## 3. Analytical Framework

### Regime Classification
Classify the current environment:
- **Growth**: accelerating / decelerating / recessionary
- **Inflation**: above-target / at-target / disinflationary / deflationary
- **Policy**: tightening / on-hold / easing / emergency
- **Credit**: spreads tight / normal / widening / crisis
- **Risk appetite**: risk-on / mixed / risk-off

Label the regime type (e.g., "Late-cycle disinflation with policy pivot underway").

### Rate Sensitivity Map
For each major sector, assess: how does it perform in the current rate regime vs. historical base rates?

| Sector | Rate Sensitivity | Current Regime Headwind/Tailwind | Relative Strength |
|--------|-----------------|----------------------------------|-------------------|
| Tech (growth) | High negative | | |
| Financials | Complex (NIM vs. credit) | | |
| Real Estate | High negative | | |
| Utilities | High negative | | |
| Energy | Low (commodity-driven) | | |
| Industrials | Moderate | | |
| Consumer Disc | Moderate negative | | |
| Consumer Staples | Low, defensive | | |
| Healthcare | Low, defensive | | |

### Sector Rotation Signal
Based on regime: which sectors are early/mid/late cycle? Where is the consensus positioned? Where is the contrarian opportunity (i.e., a sector sold off for macro reasons but fundamentals are improving)?

### Cross-Asset Signals
- Yield curve shape and what it historically precedes
- DXY trend and what it implies for multinationals vs. domestics
- VIX level and what the options market is pricing for equity risk
- Gold signal (real rates, inflation expectations, tail risk)

### Key Risks to the Current Regime
What would cause a regime shift? What are the 2-3 macro variables to watch with their inflection thresholds?

---

## 4. Scenario Analysis (if specific question given)

If $ARGUMENTS contains a conditional ("what if", "if X happens", "scenario"):
- Define the scenario precisely (e.g., "10yr yield reaches 5.5% within 6 months")
- Map impact across: equities (by sector), fixed income, dollar, commodities
- Identify winners and losers with specific ETFs or tickers
- Assign rough probability to the scenario

---

## 5. Generate Macro Charts

Write `.clarence/artifacts/macro-YYYY-MM-DD.html` with Chart.js:

**Chart 1 — Annotated Rate + Equity Chart**
- Dual axis: 10yr yield (line, right) vs. SPX (line, left), weekly, 1yr
- Annotate 3-5 key policy decisions or macro events as vertical markers
- Title: "10yr Yield vs. SPX — [Date]"

**Chart 2 — Sector Heatmap**
- Color-coded table: sectors (rows) vs. macro factors (columns: Rate up, Rate down, USD up, Inflation up, Growth slow)
- Green = tailwind, red = headwind, yellow = neutral
- Use actual recent sector performance data where available
- Title: "Sector Factor Sensitivity"

**Chart 3 — Radar: Current Regime Scorecard**
- 6 axes: Growth Momentum, Inflation Pressure, Policy Accommodation, Credit Conditions, Risk Appetite, Earnings Revision
- Score each 1-10 (10 = max positive for equities)
- Title: "Macro Regime Scorecard"

Dark theme (#060A14 bg, #111926 chart area). Save to `.clarence/artifacts/macro-YYYY-MM-DD.html`.

---

## 6. Actionable Output

Close with:
- **The regime call** in one sentence
- **Top 2 sector trades** from current macro (long/short with rationale)
- **The single biggest macro risk** that isn't in consensus pricing
- **What to watch** — 2-3 specific data releases or events with dates if known
