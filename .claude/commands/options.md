Deep options analysis on $ARGUMENTS. Cover IV landscape, skew, term structure, and arbitrage opportunities.

---

## 1. Fetch Options Data

**Current quote:**
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/$ARGUMENTS?modules=price,summaryDetail`

**Options chain (nearest expiry — returns all available expirations):**
`https://query1.finance.yahoo.com/v7/finance/options/$ARGUMENTS`

**Price history for realized vol calculation (6mo daily):**
`https://query1.finance.yahoo.com/v8/finance/chart/$ARGUMENTS?interval=1d&range=6mo`

For additional expirations, fetch: `https://query1.finance.yahoo.com/v7/finance/options/$ARGUMENTS?date=UNIX_TIMESTAMP` for the next 2-3 expiry dates returned in the first call.

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

Write `.clarence/artifacts/$ARGUMENTS-options-YYYY-MM-DD.html` — a standalone HTML file with Chart.js:

**Chart 1 — IV by Strike (Volatility Smile/Skew)**
- X-axis: strike prices (show 80% to 120% of spot, step by $2-5)
- Y-axis: implied volatility %
- Two datasets: calls (blue) and puts (red) for the nearest expiry
- Vertical dashed line at spot price
- Title: "$ARGUMENTS Options — IV Surface (nearest expiry)"

**Chart 2 — Term Structure**
- X-axis: expiration dates
- Y-axis: ATM IV %
- Line chart showing IV across next 4-6 expirations
- Title: "$ARGUMENTS — IV Term Structure"

Style: dark theme matching the rest of the system (#060A14 bg, #111926 chart, #3B82F6 / #EF4444 accents).

---

## 5. Save Summary

Write `.clarence/analyses/$ARGUMENTS-options-YYYY-MM-DD.md` with: spot, IV rank, skew read, any arbitrage flags, trade ideas. Include artifact path.

Confirm save. Output: top 3 observations from the options market in plain English.
