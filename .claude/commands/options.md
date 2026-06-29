Deep options analysis. Arguments: $ARGUMENTS

---

## 0. Parse Intent First

Before fetching anything, classify the argument:

**Case A — Single ticker** (1-5 uppercase chars, no spaces, e.g. "NVDA", "SPY", "AAPL"):
→ Proceed directly to Step 1 with that ticker.

**Case B — Natural language query** (e.g. "stocks similar to DFTX", "fintech ETFs", "find opportunities in semis"):
→ First, identify 3-5 specific liquid tickers relevant to the query using your training knowledge and any web searches you can run.
→ Briefly explain each ticker's relevance (1 line).
→ Then run the full options analysis below for EACH ticker, clearly separated by headers.
→ At the end, add a cross-ticker comparison: which has the most interesting IV setup, best skew opportunity, or cleanest arbitrage flag.

**Case C — Ticker + context** (e.g. "NVDA earnings play", "SPY hedge"):
→ Use the ticker, but weight the analysis toward the stated intent (event vol, directional hedge, etc.).

---

## 1. Fetch Options Data

For each ticker to analyze:

**Quote (fetch this first — it is the data gate):**
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/TICKER?modules=price,summaryDetail`

**If this fetch fails (403, timeout, empty, any error): STOP. Do not proceed. Say exactly:**
> "Cannot fetch live data for TICKER. Run this command locally where network access to Yahoo Finance is available. No analysis without data."

**Do not use training knowledge or estimates as a substitute for live options data. Stale IV numbers are worse than no numbers.**

If the quote fetch succeeds, continue:

**Options chain:**
`https://query1.finance.yahoo.com/v7/finance/options/TICKER`

**Price history for HV20 (6mo daily):**
`https://query1.finance.yahoo.com/v8/finance/chart/TICKER?interval=1d&range=6mo`

For additional expirations: `https://query1.finance.yahoo.com/v7/finance/options/TICKER?date=UNIX_TIMESTAMP` for the next 2-3 expiry dates from the first call.

---

## 2. Calculations

Perform these calculations from the fetched data:

**Realized volatility (HV20):**
- Take last 20 daily close prices from price history
- Calculate daily log returns: ln(P_t / P_{t-1})
- Annualized vol = std(returns) × √252

**IV Rank:**
- From the ATM options (strike nearest to spot), extract implied vol
- Compare to the 52w IV high/low if available in summaryDetail
- IV Rank = (current IV − 52w low) / (52w high − 52w low) × 100

**Skew analysis:**
- Compare 10-delta put IV vs. 10-delta call IV for nearest expiry
- Elevated put skew = market paying for downside protection (fear premium)
- Inverted skew = unusual, often pre-event or meme dynamics

**Put-call parity check (for liquid near-ATM strikes):**
- C − P = S − K × e^(−rT)
- Flag any violation > 0.5% of spot as a potential arbitrage

**Expected move:**
- ATM straddle price ÷ spot price = implied 1σ move for that expiry

**Term structure:**
- Compare IV across expirations
- Contango (near < far): normal, market calm
- Backwardation (near > far): event risk or panic in near-term

---

## 3. Output Structure

### OPTIONS SNAPSHOT
| Metric | Value |
|--------|-------|
| Spot Price | |
| HV20 (realized) | |
| ATM IV (nearest expiry) | |
| IV Rank | |
| Expected 1σ Move | |
| Put/Call Skew | |
| Term Structure | Contango / Backwardation / Flat |

### SKEW ANALYSIS
Describe what the skew is telling you about market positioning. Is the fear premium elevated, depressed, or neutral vs. historical norms? What does this imply about consensus expectations?

### TERM STRUCTURE
List IV by expiry. Note any kinks (elevated IV at a specific expiry = event risk priced in there). Identify the event if known.

### ARBITRAGE FLAGS
For each potential inefficiency found:
```
Type: [put-call parity / calendar spread / box spread / skew extreme]
Description: [what the opportunity is]
Strikes/Expiry: 
Edge: ~$X per contract (before transaction costs)
Confidence: HIGH / MED / LOW
Caveat: [liquidity, bid-ask, assignment risk, etc.]
```

### POSITIONING READ
Based on the full picture: What is the options market pricing in? Does it diverge from your fundamental view? What does that divergence suggest as a trade setup?

### TRADE IDEAS (if edge exists)
For each idea: structure, strikes, expiry, rationale, max risk, max reward, breakeven(s). Flag if IV-selling or IV-buying environment.

---

## 4. Generate IV Scatter Chart

For single-ticker analysis, write `.clarence/artifacts/TICKER-options-YYYY-MM-DD.html`.
For multi-ticker analysis, write a single combined file: `.clarence/artifacts/options-scan-YYYY-MM-DD.html` with one section per ticker.

Standalone HTML file with Chart.js (CDN: `https://cdn.jsdelivr.net/npm/chart.js`):

**Chart 1 — IV by Strike (Volatility Smile/Skew)**
- X-axis: strike prices (show 80% to 120% of spot, step by $2-5)
- Y-axis: implied volatility %
- Two datasets: calls (blue) and puts (red) for the nearest expiry
- Vertical dashed line at spot price
- Title: "TICKER Options — IV Surface (nearest expiry)"

**Chart 2 — Term Structure**
- X-axis: expiration dates
- Y-axis: ATM IV %
- Line chart showing IV across next 4-6 expirations
- Title: "TICKER — IV Term Structure"

For multi-ticker scans, add Chart 3: a bar chart comparing IV Rank across all analyzed tickers — immediately shows which has richest/cheapest vol.

Style: dark theme (#060A14 bg, #111926 chart, #3B82F6 / #EF4444 accents).

---

## 5. Save Summary

For single ticker: `.clarence/analyses/TICKER-options-YYYY-MM-DD.md`
For multi-ticker scan: `.clarence/analyses/options-scan-YYYY-MM-DD.md` with a ranked opportunity table at the top.

Include: spot, IV rank, skew read, arbitrage flags, trade ideas, artifact path.

Confirm save. Output: top 3 observations from the options market in plain English.
