Deep-dive investment analysis on $ARGUMENTS. Apply the full contrarian research framework below.

---

## 1. Fetch Live Data

Use WebFetch (or Bash curl as fallback) to pull:

**Quote + key stats:**
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/$ARGUMENTS?modules=price,summaryDetail,financialData,defaultKeyStatistics`

**Financial statements (3-5yr history):**
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/$ARGUMENTS?modules=incomeStatementHistory,balanceSheetHistory,cashflowStatementHistory`

**Price history (2yr weekly):**
`https://query1.finance.yahoo.com/v8/finance/chart/$ARGUMENTS?interval=1wk&range=2y`

Also search the web for 2-3 recent items: latest earnings call highlights, recent analyst upgrades/downgrades, any major news in the past 60 days.

---

## 2. Contrarian Framework — Run This Before Writing Anything

Answer these questions internally before structuring the output:

1. **What is the consensus view?** What does the current price imply the market believes about growth, margins, and longevity?
2. **Which consensus assumptions are softest?** Rate each: (a) widely accepted but untested, (b) driven by recent extrapolation, (c) rests on narrative not data, (d) assumes a short historical window continues.
3. **Where is the asymmetry?** If consensus is wrong, which direction does the error go, and by how much?
4. **What would a bear miss about the bull case? What would a bull miss about the bear case?**
5. **Options lens**: What is IV implying about expected move? Does that diverge from your fundamental assessment?

---

## 3. Output Structure

### SNAPSHOT
| Metric | Value |
|--------|-------|
| Price | |
| Market Cap | |
| EV/EBITDA | |
| P/E (fwd) | |
| FCF Yield | |
| 52w Range | |
| YTD | |

### BUSINESS QUALITY
- Revenue trend (3yr): growth rate, acceleration/deceleration
- Margin trajectory: gross, operating, net — direction matters more than level
- FCF conversion: net income → FCF gap (quality flag if wide)
- Balance sheet: net cash/debt, leverage ratio, any off-balance-sheet items

### CONTRARIAN THESIS
The 2-3 things the market is likely mispricing. Lead with the highest-conviction point. Flag confidence [HIGH] / [MED] / [LOW] on each.

### VALUATION
| Scenario | EV/EBITDA | P/FCF | Implied Price | Probability |
|----------|-----------|-------|---------------|-------------|
| Bear | | | | |
| Base | | | | |
| Bull | | | | |

State your assumptions: risk-free rate, terminal growth, tax rate. One sentence on the biggest valuation sensitivity.

### CATALYSTS & RISKS
**Catalysts** (ranked probability × impact):
- Catalyst 1 — timing range — [confidence]
- ...

**Risks** (what would invalidate the thesis):
- Risk 1 — trigger to watch — [severity]
- ...

### OPTIONS POSITIONING
- IV rank vs 52w range
- Term structure note (contango / backwardation)
- Skew note (put premium elevated / depressed vs. history)
- Any positioning opportunity (e.g., "IV elevated relative to expected move — selling premium favored")

---

## 4. Generate HTML Chart Artifact

Write a complete standalone HTML file to `.clarence/artifacts/$ARGUMENTS-analysis.html` containing three charts using Chart.js (load via CDN: `https://cdn.jsdelivr.net/npm/chart.js`):

**Chart 1 — Combo: Revenue & Margins**
- Bar chart: annual revenue last 4 years (in billions)
- Line chart overlay: gross margin % on right axis
- Title: "$ARGUMENTS — Revenue & Margin Trend"

**Chart 2 — Annotated Line: Price History**
- Weekly close price, 2yr
- Annotate 3-5 key events (earnings beats/misses, major news) as vertical dashed lines with labels
- Title: "$ARGUMENTS — Price History (2yr)"

**Chart 3 — Radar: Quality Scorecard**
Score 1-10 across 6 dimensions based on data: Revenue Growth, Margin Quality, FCF Conversion, Balance Sheet Strength, Valuation Attractiveness, Momentum
- Title: "$ARGUMENTS — Quality Radar"

Style: dark background (#060A14), chart area (#111926), accent color #3B82F6, gain #10B981, loss #EF4444, text #F0F6FF. All three charts on one page with the ticker and analysis date as the page title.

---

## 5. Save Analysis Summary

Write `.clarence/analyses/$ARGUMENTS-YYYY-MM-DD.md` (use today's date) with:
- Ticker, date, price at analysis
- One-sentence thesis
- Conviction (1-5) with rationale
- Top 3 assumptions (with confidence rating)
- Top 3 risks
- Target price range (bear/base/bull)
- Link to artifact file

---

After writing both files, confirm paths and share the key takeaway in 3 bullets.
