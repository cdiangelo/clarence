Update, pressure-test, or evolve an existing investment thesis. Arguments: $ARGUMENTS

Parse as: [TICKER or partial filename] [optional: new stage | pressure-test | close | note "text"]

Examples:
- `NVDA` — review and pressure-test existing thesis
- `NVDA active` — promote stage to active
- `NVDA close` — mark closed with outcome notes
- `NVDA note "Q2 earnings beat, raising conviction"` — append a note
- `NVDA pressure-test` — force a full assumption challenge

---

## 1. Load Existing Thesis

Search `.clarence/theses/` for files matching the ticker (case-insensitive). If multiple exist, list them and use the most recent unless a specific filename is given. Read the full file.

Also fetch fresh data to compare against the thesis assumptions:
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/TICKER?modules=price,financialData,defaultKeyStatistics`

---

## 2. Pressure-Test Protocol

Run this against every key assumption in the thesis, regardless of whether pressure-test was explicitly requested:

For each assumption:
1. **Has the underlying data changed since thesis creation?** (check fresh fetch vs. thesis date)
2. **Has the catalyst timeline shifted?** Did expected catalysts fire? Were they positive or negative?
3. **Did the bear case get stronger or weaker?** What new information exists?
4. **Is the softness flag still valid?** Or has the assumption been confirmed/disproved by events?
5. **Price move since thesis**: Did it move toward or away from target? Does that change anything?

Rate each assumption as: CONFIRMED / WEAKENED / DISPROVED / UNCHANGED / INSUFFICIENT DATA

---

## 3. Update the Thesis Document

Preserve the original thesis content. Append an **Update Log** section at the bottom:

```
---

## Update Log

### YYYY-MM-DD Update

**Price at update:** $X (vs. $X at thesis creation, X% change)  
**Stage change:** [old] → [new] (if applicable)  
**Conviction change:** X/5 → X/5 (if applicable)

**Assumption Review:**
| # | Assumption | Prior Status | Current Status | Evidence |
|---|-----------|-------------|----------------|---------|
| 1 | | | CONFIRMED/WEAKENED/DISPROVED | |

**Catalyst Update:**
- [Catalyst 1]: Fired / Pending / Invalidated — [outcome note]

**New information since last update:**
- [Point 1]
- [Point 2]

**Conviction rationale (updated):**
[Why conviction went up/down/stayed, or why stage changed]

**What to watch next:**
- [Specific trigger or event to monitor with approximate timing]

**Notes:**
[Free text from command argument if provided]
```

---

## 4. Handle Stage Changes

If closing the thesis (`close` argument or conviction drops to 1):
- Add outcome section: Was the thesis right? What was the return (price change since creation)? What assumption proved most/least correct?
- Move file to `.clarence/theses/closed/TICKER-outcome-YYYY-MM-DD.md` (create directory if needed)

If promoting to active (`active`):
- Update the `Stage:` field in the header
- Note what triggered the promotion

---

## 5. Save & Confirm

Write updated content back to the same file. Confirm the path.

Output: 3-bullet summary of what changed, current conviction/stage, and the next specific thing to watch.
