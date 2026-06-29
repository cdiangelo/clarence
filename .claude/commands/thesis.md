Build a structured investment thesis. Arguments: $ARGUMENTS

Parse arguments as: [TICKER] [long|short|neutral] [optional free-text title or context]
Examples: `NVDA long`, `AAPL short overvalued on services multiple`, `MSFT neutral`

---

## 1. Load Context

First, check for existing data:
- Read `.clarence/analyses/` — find any recent analysis file for this ticker
- Read `.clarence/watchlist.json` — check if ticker is already watched
- Read `.clarence/portfolio.json` — check if ticker is held (affects thesis framing)

If a recent analysis exists (< 30 days), use it as your data foundation. Otherwise fetch:
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/TICKER?modules=price,financialData,defaultKeyStatistics,summaryDetail`
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/TICKER?modules=incomeStatementHistory,cashflowStatementHistory`

---

## 2. Thesis Construction Framework

Think through the thesis rigorously before writing. Apply:

**Assumption mapping**: Every thesis pillar must have an explicit assumption underneath it. Rate each assumption:
- Confidence: HIGH (multiple independent data sources) / MEDIUM (directionally supported) / LOW (hypothesis only)
- Softness flag: Is this assumption (a) widely held and untested, (b) recent-data extrapolation, (c) narrative-driven, (d) single data point? If yes, mark it soft with a one-line flag.

**Timing discipline**: Don't give precise dates. Give probability-weighted windows tied to specific catalysts with observable triggers.

**Direction integrity**: If SHORT — the thesis must explain why the market is wrong, not just that the stock is "expensive." If LONG — must survive the bear case's best argument.

---

## 3. Thesis Document

Write a complete thesis in the format below, then save it.

```
# [TICKER] — [DIRECTION] — [TITLE]

**Created:** YYYY-MM-DD  
**Stage:** developing  
**Conviction:** X/5  
**Direction:** long | short | neutral  
**Timing Range:** [e.g., "Q3 2025 – Q1 2026"]  
**Target Price:** $X (base) | $X (bull) | $X (bear)  
**Stop / Invalidation:** $X or [specific condition]

---

## Hypothesis
[2-4 sentences: what you believe, why the market is wrong, what would prove you right]

---

## Key Assumptions

| # | Assumption | Confidence | Soft? | Flag |
|---|-----------|------------|-------|------|
| 1 | | HIGH/MED/LOW | Y/N | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

---

## Catalysts
- **[Catalyst 1]** — Expected: [timing range] — Observable trigger: [what to watch]
- **[Catalyst 2]** — Expected: [timing range] — Observable trigger: [what to watch]
- **[Catalyst 3]** — Expected: [timing range] — Observable trigger: [what to watch]

---

## Risks & Invalidators
- **[Risk 1]** — Trigger: [what would make this wrong] — Severity: HIGH/MED/LOW
- **[Risk 2]** — ...
- **[Risk 3]** — ...

---

## Valuation
| Scenario | Key Assumption | Multiple | Price Target | Weight |
|----------|---------------|---------|--------------|--------|
| Bull | | | $X | X% |
| Base | | | $X | X% |
| Bear | | | $X | X% |

Weighted expected value: $X vs. current $X = X% upside/downside

---

## Bull vs. Bear — Steelman Both

**Best bull argument:** [strongest version of the long case, even if you're short]

**Best bear argument:** [strongest version of the short case, even if you're long]

**Why my direction survives the opposing steelman:**

---

## What Would Change My Mind
[Specific observable conditions — not vague — that would flip conviction]

---

## Notes
[Any additional context, comparable situations, analogues]
```

---

## 4. Save & Update

1. Save thesis to `.clarence/theses/TICKER-DIRECTION-YYYY-MM-DD.md`
2. Read `.clarence/watchlist.json`, add ticker if not present (tag: "thesis"), write back
3. Confirm save paths

---

After saving, output a 4-bullet summary: hypothesis, conviction rationale, top catalyst, top risk. Keep it tight.
