# .clarence — Persistent Research Data

This directory stores all research data that persists across sessions.

## Files

| File / Dir | Contents |
|-----------|----------|
| `portfolio.json` | Equity positions and cash |
| `watchlist.json` | Tracked tickers with notes and alerts |
| `theses/` | Investment thesis `.md` files (one per thesis) |
| `theses/closed/` | Closed theses with outcome notes |
| `analyses/` | Saved analysis snapshots |
| `artifacts/` | HTML chart files (open in browser) |
| `reports/` | Full HTML research reports (print → PDF) |

## Naming conventions

- Theses: `TICKER-direction-YYYY-MM-DD.md`
- Analyses: `TICKER-YYYY-MM-DD.md` or `TICKER-options-YYYY-MM-DD.md`
- Artifacts: `TICKER-analysis-YYYY-MM-DD.html`, `TICKER-options-YYYY-MM-DD.html`, `macro-YYYY-MM-DD.html`
- Reports: `TICKER-YYYY-MM-DD.html`, `portfolio-YYYY-MM-DD.html`

## Viewing artifacts and reports

Open any `.html` file in your browser. Reports are print-ready — Cmd+P (Mac) or Ctrl+P (Windows) exports to PDF.
