Watchlist management and monitoring. Arguments: $ARGUMENTS

Parse the intent:
- `add TICKER [notes] [tags]` → Add ticker to watchlist
- `remove TICKER` → Remove from watchlist
- `list` or no argument → Show full watchlist with current prices
- `review TICKER` → Single ticker quick review (price + recent news + thesis link)
- `review all` → Batch review of all watchlist entries (prices + flags)
- `tag TICKER tag1 tag2` → Add or update tags on an entry
- `alert TICKER above X` or `alert TICKER below X` → Set price alerts
- `note TICKER "text"` → Add or update notes on an entry

---

## Watchlist JSON format

`.clarence/watchlist.json`:
```json
{
  "entries": [
    {
      "ticker": "NVDA",
      "name": "NVIDIA Corporation",
      "addedAt": "2025-01-15",
      "notes": "Monitoring AI infrastructure spend cycle; thesis in progress",
      "tags": ["ai", "semis", "thesis"],
      "alertAbove": null,
      "alertBelow": null
    }
  ]
}
```

---

## For add / remove / tag / alert / note:

Read `.clarence/watchlist.json`. Apply the change. If adding, also fetch the company name:
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/TICKER?modules=price`
Use `longName` from the price module. Write the updated JSON back. Confirm.

---

## For list (no argument):

Read `.clarence/watchlist.json`. Fetch current price and 1-day change for each entry:
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/TICKER?modules=price`

Output a clean table:
| Ticker | Name | Price | Day % | Added | Tags | Alert |
|--------|------|-------|-------|-------|------|-------|

Check `.clarence/theses/` — for any ticker with a thesis file, add a "↳ thesis" tag.
Check `.clarence/analyses/` — for any ticker with a recent analysis (< 14 days), flag with "↳ analyzed".

Flag any price alerts triggered (current price above alertAbove or below alertBelow).

---

## For review TICKER:

Quick, focused review — not a full /analyze but enough to know if action is warranted.

Fetch:
`https://query1.finance.yahoo.com/v10/finance/quoteSummary/TICKER?modules=price,summaryDetail,financialData`

Search web for: "TICKER recent news" — look for anything material in the past 2 weeks.

Output:
- **Price**: current, 1d%, 1w%, 1m%, 52w range position (where in the range?)
- **Valuation snapshot**: P/E, EV/EBITDA, FCF yield
- **Recent news**: 2-3 bullets on what's moved or could move
- **Thesis link**: If a thesis exists in `.clarence/theses/`, show its current stage and conviction
- **Watchlist context**: When added, original notes, any active alerts
- **Flag**: Does this warrant a full `/analyze` or `/thesis` run? Why or why not?

---

## For review all:

Batch mode. Fetch price for every ticker. Output a single table sorted by 1-week performance.

Flag entries that look worth deeper investigation:
- Price near a 52w high or low
- Significant 1-week move (> 5% either direction) without an obvious news reason
- Alert level triggered
- Thesis exists but hasn't been updated in > 30 days

For each flagged entry, add one sentence on why it's flagged. Suggest the next action (`/analyze`, `/update-thesis`, `/options`, etc.).
