# Seat Drop Watcher

Polls a Cinemark seat map for a sold-out showtime and pushes a phone alert
within ~30 seconds of a seat opening up. Buying stays manual — this only
watches and notifies.

## How it works

Headless Chromium (Playwright) loads the seat map, reads each seat's legend
text (`Available Seat`, `Selected Seat`, `Unavailable`, `Wheelchair Space (no
seat)`) from its `alt`/`aria-label`/`title` attribute, and counts how many
read `Available Seat`. The moment that count goes from 0 to something — or
climbs higher than it already alerted on — it fires a push notification with
a tap-through link straight to the seat map.

This is phase 1 of a two-phase plan (see "Upgrading to phase 2" below):
browser automation now, a lighter direct API call later once that endpoint is
reverse-engineered.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # fill in Pushover or ntfy credentials
```

Edit `config.yaml` to list the showtime(s) to watch — see the shape already
in the file for the known example (`TheaterId=276`, Cinemark Seven Bridges
and IMAX, "The Odyssey" IMAX 70mm).

### One-time login

The watcher needs a signed-in session (some seat data may differ logged in
vs. out, and the account is a Movie Fan account). Run:

```bash
npm run login
```

A real browser window opens. Sign into Cinemark by hand, then close the
window. Credentials never touch this codebase — Playwright just saves the
resulting cookies into `data/browser-profile/`, which the headless watcher
reuses on every run. Re-run this whenever the watcher alerts that the
session expired.

### Running

```bash
npm run watch
```

Logs each cycle's seat count per showtime. Leave it running — see "Where to
run this" below for how to keep it alive.

## Before you trust it

The brief that scoped this out is explicit: **at the time this was written,
the target auditorium was 100% `Unavailable` except two `Wheelchair Space`
slots — the correct baseline is zero available seats.** If a first run
reports anything nonzero, that's almost certainly a parser bug, not a real
opening. Open the seat map in a browser yourself and compare before trusting
a nonzero count.

Two things in `src/seatParser.ts` are flagged as unverified against the real
DOM, because this was built without being able to load the live page:

1. **The legend key itself** likely has its own elements carrying these same
   four strings, separate from the actual seat grid — scanning the whole
   page will double-count those few phantom entries. If counts look off by a
   small constant, narrow `SEAT_SCAN_ROOT_SELECTOR` to the seat grid's actual
   container (inspect the real DOM, find the wrapping element).
2. **The sign-in detection** (`looksLikeSignIn` in the same file) guesses at
   how an expired session shows up. Watch the logs the first time your
   session actually expires and tighten it if it doesn't fire correctly.

The sanity check (`min_sane_seats` in `config.yaml`, default 50) guards
against exactly this class of bug: if fewer than that many seat elements
parse at all, the watcher assumes something broke and alerts separately from
the seat-available alert, rather than reporting a confident zero forever.

## Upgrading to phase 2 (direct endpoint)

While phase 1 runs, capture the request the seat map page itself makes for
seat data:

- Safari on Mac: Develop → Web Inspector → Network, load the seat map, find
  the JSON/XHR call carrying seat data, "Copy as cURL"
- Or add a one-line `page.on('response', ...)` in `src/watcher.ts` that logs
  any response whose URL or body matches `/seat/i`

Once you have it, replace the Playwright page load in `checkShowtime()`
(`src/watcher.ts`) with a plain `fetch` against that endpoint, carrying
whatever cookies/headers it needs. That drops the per-check cost by orders
of magnitude and makes tighter polling trivial. Keep the Playwright path
around (e.g. behind a flag) as a fallback for when the response shape
changes — it's slower but it's reading the same thing a human sees, so it's
harder to silently break.

## Where to run this

Needs to be always on:

- **Mac, always awake** — simplest to start with.
  ```bash
  caffeinate -i npm run watch
  ```
- **Fly.io / small VPS / Raspberry Pi** — the right answer for running with
  the laptop closed. Phase 2 (plain `fetch`, no browser) makes this cheap to
  host; phase 1 needs enough RAM for headless Chromium (a small VPS handles
  it fine, a Pi Zero might not).
- **Not GitHub Actions.** Scheduled runs have a ~5 minute floor and drift
  under load — a seat can be gone in that window.

## Config shape

```yaml
poll_seconds: 30 # floor is 30 — /TicketSeatMap/ is disallowed in Cinemark's
# robots.txt; this is a personal watcher on a page you could
# open yourself, but keep the rate polite.
min_sane_seats: 50 # parser sanity floor — see "Before you trust it" above

showtimes:
  - label: "Odyssey 70mm — Sun 8/2 7:00p"
    theater_id: 276
    showtime_id: 601720
    movie_id: 104867
    starts: "2026-08-02T19:00:00"
  # add more entries for more showtimes — each is polled in turn, staggered,
  # never in parallel

alert:
  provider: pushover # pushover | ntfy
  priority: emergency # repeats until acknowledged, ignores silent mode
```

Add a showtime by adding another entry under `showtimes:`. Each `showtime_id`
must be unique.

## Behavior worth knowing

- **Flap suppression.** If someone else holds a seat in their cart and it
  reappears as unavailable a minute later, that's not re-alerted — the
  watcher alerts on the 0→N transition, then suppresses repeats for 10
  minutes unless the available count climbs *higher* than what it already
  alerted on.
- **Showtimes expire.** Once a showtime's start time passes, the watcher
  stops polling it. When every configured showtime has passed, the process
  exits.
- **Errors back off.** A failed check (network error, timeout) doubles that
  showtime's next-check delay, up to 10x the base interval, and resets to
  normal on the next success — so a Cinemark outage doesn't turn into a
  request storm.
- **Session expiry gets its own alert**, separate from the seat alert, so
  you know to run `npm run login` again rather than the watcher silently
  polling a sign-in page forever.
- **New showtimes appearing isn't wired up yet.** `src/newShowtimeWatcher.ts`
  is a documented stub — see the comment at its top for what needs
  capturing before it can work. Guessing the movie-listing URL risked
  building something that looked like it worked but silently scraped the
  wrong page.

## Deliberately out of scope

No auto-purchasing, and nothing here adds a seat to cart automatically.
Holding a seat automatically would buy a few minutes of reaction time, but
it's automated interaction with Cinemark's booking flow against an explicit
robots directive, and a bug that grabs the wrong seat is a real cost. That's
a separate decision for later, not part of this.
