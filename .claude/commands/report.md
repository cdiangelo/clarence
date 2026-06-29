Generate a comprehensive, print-ready HTML research report. Arguments: $ARGUMENTS

Parse the intent:
- `TICKER` → Full stock research report (fetch fresh data)
- `thesis TICKER` or `thesis [filename]` → Thesis report from saved thesis file
- `portfolio` → Portfolio review report
- `options TICKER` → Options analysis report
- `macro` → Current macro regime report

---

## 1. Gather All Available Data

**Always read first** — don't re-fetch what already exists:
- `.clarence/analyses/TICKER-*.md` (most recent)
- `.clarence/theses/TICKER-*.md` (most recent active)
- `.clarence/portfolio.json` (if relevant)
- `.clarence/watchlist.json` (if relevant)

**Fetch fresh data for any missing pieces** using the same URLs as in `/analyze` and `/options`.

---

## 2. Report Structure by Type

### Full Stock Report (default):
1. Cover: Ticker, company name, date, direction/conviction rating, analyst (you)
2. Executive Summary (3 bullets — the thesis in plain English)
3. Business Overview (what they do, moat, competitive position)
4. Financial Analysis (revenue trend, margins, FCF, balance sheet)
5. Valuation (bear/base/bull DCF or multiples, comps table)
6. Investment Thesis (hypothesis, assumption map, catalysts)
7. Risk Register (ranked risks with triggers)
8. Options Positioning (IV rank, skew, any opportunities)
9. Conclusion + Price Target

### Thesis Report:
1. Cover with thesis metadata (created date, stage, conviction, direction)
2. Hypothesis
3. Full assumption map (table with confidence + softness flags)
4. Catalysts timeline
5. Valuation scenarios
6. Risk register
7. Update log (all prior updates appended)
8. Bull vs. Bear steelman

### Portfolio Report:
1. Cover
2. Portfolio summary stats
3. Position table (full with P&L)
4. Sector allocation breakdown
5. Concentration analysis
6. Cross-reference with active theses
7. Rebalancing observations

---

## 3. Build the HTML Report

Write a complete, standalone HTML file to `.clarence/reports/SUBJECT-YYYY-MM-DD.html`.

The HTML must:
- Be self-contained (no external dependencies except Chart.js via CDN)
- Print correctly (print-friendly CSS: @media print)
- Use professional styling — dark screen view, clean light print view

### HTML Template Structure:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>[Ticker/Subject] Research Report — [Date]</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    /* Screen: dark theme */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #060A14; color: #F0F6FF; margin: 0; padding: 0; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px 48px; }
    .cover { border-bottom: 2px solid #1A2335; padding-bottom: 32px; margin-bottom: 40px; }
    .ticker { font-family: monospace; font-size: 48px; font-weight: 700; color: #3B82F6; }
    .meta { color: #7B8FB0; font-size: 13px; margin-top: 8px; }
    h2 { font-size: 13px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7B8FB0; border-bottom: 1px solid #1A2335; padding-bottom: 6px; margin-top: 40px; margin-bottom: 16px; }
    h3 { font-size: 15px; font-weight: 600; color: #F0F6FF; margin-top: 24px; margin-bottom: 8px; }
    p { color: #C4D4EE; line-height: 1.7; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; }
    th { background: #0B1120; color: #7B8FB0; font-weight: 600; text-align: left; padding: 8px 12px; border-bottom: 1px solid #1A2335; font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase; }
    td { padding: 8px 12px; border-bottom: 1px solid #1A233540; color: #C4D4EE; }
    tr:hover td { background: #111926; }
    .gain { color: #10B981; }
    .loss { color: #EF4444; }
    .gold { color: #F59E0B; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-long { background: #10B98120; color: #10B981; }
    .badge-short { background: #EF444420; color: #EF4444; }
    .badge-neutral { background: #3D4E6B40; color: #7B8FB0; }
    .assumption-high { color: #10B981; }
    .assumption-med { color: #F59E0B; }
    .assumption-low { color: #EF4444; }
    .chart-container { background: #111926; border: 1px solid #1A2335; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .summary-box { background: #0B1120; border: 1px solid #1A2335; border-left: 3px solid #3B82F6; border-radius: 4px; padding: 16px 20px; margin: 16px 0; }
    ul { color: #C4D4EE; line-height: 1.8; font-size: 14px; padding-left: 20px; }
    li { margin-bottom: 4px; }

    /* Print: clean light theme */
    @media print {
      body { background: white; color: #111; }
      .page { padding: 20px 24px; }
      .ticker { color: #1d4ed8; }
      h2 { color: #374151; border-bottom-color: #e5e7eb; }
      p, ul, td { color: #374151; }
      th { background: #f9fafb; color: #6b7280; border-bottom-color: #e5e7eb; }
      td { border-bottom-color: #e5e7ebaa; }
      .chart-container { background: #f9fafb; border-color: #e5e7eb; }
      .summary-box { background: #eff6ff; border-color: #bfdbfe; }
      .gain { color: #059669; }
      .loss { color: #dc2626; }
      tr:hover td { background: transparent; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- COVER -->
    <div class="cover">
      <div class="ticker">[TICKER]</div>
      <div style="font-size: 22px; font-weight: 600; margin-top: 8px;">[Company Name]</div>
      <div class="meta">
        Research Report &nbsp;·&nbsp; [Date] &nbsp;·&nbsp; 
        <span class="badge badge-[direction]">[DIRECTION]</span>
        &nbsp;·&nbsp; Conviction: [X]/5
      </div>
    </div>

    <!-- Report sections go here -->

    <!-- Charts (Canvas elements with JS) -->

  </div>
  <script>
    // Chart.js initialization code here
  </script>
</body>
</html>
```

Populate all sections from the gathered data. Include all relevant charts (use canvas elements with Chart.js). Make it complete — this should stand alone as a polished research document.

---

## 4. Confirm and Output

After writing the HTML file:
1. Confirm the file path: `.clarence/reports/SUBJECT-YYYY-MM-DD.html`
2. Tell the user: "Open in your browser to view, Cmd+P / Ctrl+P to print/export as PDF"
3. Give a 2-sentence executive summary of the report's core conclusion
