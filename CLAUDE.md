# Seat Drop Watcher

A personal polling daemon: watches a Cinemark seat map for a sold-out
showtime and pushes a phone notification the moment a real seat opens up.
Buying is manual — this only watches and alerts. Full detail in `README.md`.

## Stack

- Node + TypeScript, run directly via `tsx` (no build step for normal use)
- Playwright (Chromium, persistent context) for DOM scraping — phase 1;
  see `README.md`'s "Upgrading to phase 2" for the planned direct-API path
- Pushover or ntfy.sh for alerts (emergency priority, breaks through silent
  mode)

## Key files

- `config.yaml` — showtimes to watch, poll interval, alert provider. One
  line per showtime.
- `src/index.ts` — main loop: staggers checks across configured showtimes,
  drops expired ones, backs off on errors
- `src/watcher.ts` — one showtime's check: session-expiry detection, parser
  sanity check, flap-suppressed alerting
- `src/seatParser.ts` — the actual DOM scrape. Keys off exact legend text
  (`Available Seat` / `Selected Seat` / `Unavailable` / `Wheelchair Space (no
  seat)`), not colors or icon filenames, since icons are movie-themed and
  change per film.
- `src/alert.ts` — Pushover/ntfy dispatch
- `src/state.ts` — per-showtime alert state, persisted to `data/state.json`
  so restarts don't lose flap-suppression windows
- `src/login.ts` — one-time interactive login (`npm run login`) that seeds
  `data/browser-profile/` with a real session

## Non-negotiables carried over from the build spec

- **30-second poll floor.** `/TicketSeatMap/` is disallowed in Cinemark's
  robots.txt; this is a personal watcher on a page the user could open
  himself, but the rate has to stay polite. `config.ts`'s zod schema
  enforces this — don't loosen it without the user explicitly asking.
- **Never fabricate a nonzero seat count.** The known baseline for the
  seeded showtime is zero available seats. If a change makes the parser
  report anything else, verify against the live page before trusting it —
  see `README.md`'s "Before you trust it".
- **No auto-purchasing, ever**, without the user explicitly asking for it
  as a separate, later decision. It's called out as deliberately out of
  scope in the original brief.
- **Never parallelize requests across showtimes** — `index.ts`'s stagger
  gap exists specifically to keep requests serial.

## Known-unverified pieces

Built without access to the live Cinemark DOM (network to cinemark.com is
blocked from this dev sandbox). Two things are flagged inline as needing
real-DOM verification before being fully trusted:

1. `seatParser.ts`'s `SEAT_SCAN_ROOT_SELECTOR` — scans the whole page for
   legend-labeled elements, which likely double-counts the legend key's own
   ~4 reference icons alongside the real seat grid.
2. `seatParser.ts`'s `looksLikeSignIn()` — guesses at what an expired-session
   redirect looks like; hasn't been observed against a real one.

`src/newShowtimeWatcher.ts` is an intentional stub (not wired into
`index.ts`) — the spec's "second, slower watcher for new showtimes" needs a
movie-listing page URL that was never given or verified, so it's documented
rather than guessed at.
