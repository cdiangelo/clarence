# NUCLEAR — LONG — Nuclear Renaissance: Demand Certainty Collides With Supply Uncertainty

**Created:** 2025-06-29
**Stage:** developing
**Conviction:** 4/5
**Direction:** long
**Timing Range:** H2 2025 – Q2 2027
**Lead tickers:** CEG (Constellation Energy), VST (Vistra), NNE (Nano Nuclear), SMR (NuScale Power), CCJ (Cameco — uranium)
**Target Price:** Requires `/analyze [ticker]` with live data
**Stop / Invalidation:** Hyperscaler capex guidance cuts signaling AI buildout rationalization, OR NRC issues systemic safety finding blocking SMR licensing pathway

---

## Hypothesis

The market understands that AI data centers need enormous amounts of power but is underpricing the structural supply constraint: the US grid cannot deliver that power reliably at scale without nuclear. Renewables + batteries cannot provide the 24/7 baseload that hyperscalers need for 99.99% uptime on inference workloads. The demand side is locked in — Microsoft, Google, Amazon, and Meta have all signed or announced nuclear PPAs. The uncertainty — and therefore the opportunity — is entirely on the supply side: which companies can actually *deliver* megawatts by 2027, and at what cost? The market is pricing nuclear as a long-cycle infrastructure story when it's increasingly a near-term contracted revenue story for the incumbents.

---

## Key Assumptions

| # | Assumption | Confidence | Soft? | Flag |
|---|-----------|------------|-------|------|
| 1 | Hyperscaler AI capex continues at current or higher trajectory through 2027 | HIGH | N | All four major hyperscalers have given multi-year capex guidance; not a soft assumption |
| 2 | Existing nuclear fleet (CEG, VST) can negotiate power price uplift on contract renewals | HIGH | N | Microsoft Three Mile Island PPA at ~$115/MWh proves market; capacity is constrained |
| 3 | SMR licensing (NuScale, X-energy, Kairos) proceeds on current NRC timeline | MED | Y | NRC has never licensed an SMR at commercial scale; timeline extrapolation from Design Certification is soft |
| 4 | Uranium supply tightness persists through 2027 — benefiting CCJ | MED | Y | Kazakhstan/Cameco production is ramping; assume supply remains below demand through 2027 |
| 5 | Existing fleet doesn't face premature retirement from competitive power prices | MED | N | Paradoxically, high power prices protect nuclear economics; the risk is the opposite of historical |

---

## Catalysts

- **Additional hyperscaler nuclear PPAs announced** — Expected: ongoing through 2026 — Observable trigger: press releases from MSFT, GOOGL, AMZN, META nuclear procurement
- **NRC issues first SMR Design Certification or construction permit** — Expected: 2026-2027 — Observable trigger: NRC docket milestones for NuScale, Kairos, or X-energy
- **US grid emergency declaration / executive action on nuclear** — Expected: 2025-2026 — Observable trigger: DOE emergency orders, NERC reliability warnings, Congressional action on nuclear permitting
- **CEG/VST multi-year PPA renewals at premium pricing** — Expected: 2025-2026 — Observable trigger: quarterly earnings calls, 8-K filings on contract announcements
- **Uranium spot price breakout above $110/lb** — Expected: 2026 — Observable trigger: spot and term contract price reporting (Cameco/UxC)

---

## Risks & Invalidators

- **AI capex rationalization** — Trigger: two consecutive quarters of hyperscaler capex guidance cuts — Severity: HIGH — Removes the demand anchor; the whole thesis collapses
- **SMR cost overruns / cancellations** — Trigger: NuScale or equivalent project cancels due to cost inflation (already happened once with NuScale's Carbon Free Power Project) — Severity: MED — Doesn't hurt CEG/VST but decimates pure-play SMR names
- **Grid policy change enabling large-scale battery storage** — Trigger: FERC ruling that makes 4-hour battery storage eligible for baseload capacity payments — Severity: MED — Reduces nuclear's competitive advantage on reliability
- **Uranium supply surprise** — Trigger: Kazakhstan production significantly exceeds guidance — Severity: MED — Hurts CCJ specifically, not the equity nuclear plays

---

## Valuation

Price targets require live data. Run `/analyze CEG`, `/analyze VST`, `/analyze CCJ` locally.

Framework:
- **CEG / VST (operating fleet)**: Value on contracted power price × capacity factor × fleet size. Bear = current contracts roll at flat prices. Base = 20-30% contract price uplift on renewals. Bull = hyperscaler PPA pricing ($100-120/MWh) becomes the reference rate for the whole fleet.
- **SMR plays (NNE, SMR)**: Pure option value — no DCF until licensed. Value as probability × TAM. Bear = $0 (license failure). Bull = first-mover in a market with >$1T addressable power demand.
- **CCJ**: Commodity play. Uranium price sensitivity. At $100/lb uranium, CCJ generates significantly higher margins than current models assume.

---

## Bull vs. Bear — Steelman Both

**Best bull argument:** The constraint is physical and takes years to resolve. You cannot build a gas plant fast enough, you cannot permit enough transmission for renewables fast enough, and batteries don't work for multi-day baseload. Nuclear is the only answer that works at the required scale and reliability. The hyperscalers know this and are signing 20-year PPAs. CEG and VST own the only operating fleet in the US and have pricing power they haven't had in 20 years. The 2027 horizon is *early* — this is a decade-long story and you're getting in before the market prices the duration.

**Best bear argument:** The entire thesis is built on a single-point-of-failure assumption: that AI capex is durable. If AI monetization disappoints — if inference revenue growth slows, if model commoditization kills margins, if there's a data center oversupply event like 2001 — then demand for 24/7 baseload nuclear power from hyperscalers reverses. The PPAs are long-term but have break clauses. Hyperscalers don't build 20-year nuclear commitments for a product line that's underperforming. The demand narrative could unravel faster than the supply narrative.

**Why the long survives the bear:** Even if AI capex normalizes, the US has a structural grid reliability problem that predates AI. Electrification of transportation, industrial heat, and HVAC creates long-run baseload demand growth regardless of data center demand. Nuclear is the answer to that problem too. The thesis doesn't depend entirely on AI — AI is the accelerant, not the foundation.

---

## What Would Change My Mind

- Two consecutive quarters of hyperscaler capex cuts with explicit references to AI ROI concerns
- FERC or DOE policy change that makes alternative baseload solutions (long-duration storage) economically viable at scale before 2027
- Significant unexpected nuclear safety event at a US operating plant triggering public backlash and legislative pressure for early retirement

---

## Notes

The Three Mile Island restart (Constellation / Microsoft PPA, signed 2024) is the definitive proof point. A plant that was shut down for economic reasons — not safety — was restarted specifically to serve a single hyperscaler customer at a price 3x the previous market rate. That's not a marginal signal; it's a structural market change.

Comparable situation: LNG export terminals 2013-2017. Everyone knew US LNG was coming but the supply build (engineering, permitting, construction) took longer than expected while demand locked in via long-term offtake contracts. The companies that had existing infrastructure (Cheniere) captured most of the value because they could *deliver* while everyone else was still in permitting.
