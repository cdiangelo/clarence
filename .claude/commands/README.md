# Clarence — Investment Research Skills

Eight slash commands for Claude Code. Data persists in `.clarence/`.

## Commands

| Command | Description |
|---------|-------------|
| `/analyze TICKER` | Full stock deep-dive: live data, contrarian framework, charts |
| `/thesis TICKER long\|short\|neutral` | Build a structured thesis with assumption map, save to file |
| `/update-thesis TICKER` | Pressure-test and update an existing thesis |
| `/options TICKER` | Options chain, IV rank, skew, arbitrage scan |
| `/macro [topic]` | Macro regime, sector rotation, rate sensitivity |
| `/portfolio [add\|remove\|review\|rebalance]` | Portfolio management and allocation analysis |
| `/watchlist [add\|remove\|list\|review]` | Watchlist CRUD and batch monitoring |
| `/report TICKER\|thesis\|portfolio` | Generate print-ready HTML/PDF research report |

## Examples

```
/analyze NVDA
/analyze AAPL — give me the contrarian view

/thesis NVDA long AI infrastructure cycle isn't over
/thesis TSLA short margin compression underpriced

/update-thesis NVDA
/update-thesis NVDA active
/update-thesis NVDA close
/update-thesis NVDA note "beat Q2, raising conviction"

/options SPY
/options TSLA

/macro
/macro banks and yield curve
/macro what happens to REITs if 10yr hits 5.5%
/macro NVDA tailwinds

/portfolio review
/portfolio add NVDA 50 875.00 Technology
/portfolio remove TSLA
/portfolio rebalance reduce tech exposure
/portfolio cash 25000

/watchlist list
/watchlist add MSFT cloud re-acceleration thesis
/watchlist review NVDA
/watchlist review all
/watchlist alert AAPL below 170

/report NVDA
/report thesis NVDA
/report portfolio
/report options TSLA
/report macro
```

## Data files

All persistent data lives in `.clarence/`:
- `portfolio.json` — positions
- `watchlist.json` — watchlist entries  
- `theses/` — thesis markdown files
- `artifacts/` — HTML charts (open in browser)
- `reports/` — full HTML reports (print → PDF)

## Using in Claude.ai Projects

These skill files also work as Project instructions in claude.ai chat:
1. In a Claude Project, go to **Project Instructions**
2. Paste the contents of any skill file you want always available
3. Or upload the `.md` files as **Project Knowledge**

In chat, trigger them naturally: *"Analyze NVDA using the contrarian framework"* or *"Build a thesis on AAPL short"* — Claude will follow the same structured workflow without the slash command syntax.

## Installation (global access)

To use these skills in any Claude Code project, copy to your user commands directory:

```bash
cp .claude/commands/*.md ~/.claude/commands/
```
