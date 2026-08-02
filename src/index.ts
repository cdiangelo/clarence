import 'dotenv/config';
import { loadConfig } from './config.js';
import { getPersistentContext } from './browser.js';
import { checkShowtime, backoffMultiplier } from './watcher.js';
import { loadState, saveState } from './state.js';

// Requests are never fired concurrently across showtimes — even when
// several come due in the same tick, each is checked in turn with this gap
// between them, per the "don't parallelize, stagger" constraint.
const STAGGER_GAP_MS = 3000;
const TICK_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const configPath = process.argv[2] ?? 'config.yaml';
  const config = loadConfig(configPath);
  const states = loadState(config.showtimes.map((s) => s.showtimeId));
  const nextCheckAt = new Map<number, number>(config.showtimes.map((s) => [s.showtimeId, 0]));
  const active = new Set(config.showtimes.map((s) => s.showtimeId));

  console.log(
    `Seat Drop Watcher — ${config.showtimes.length} showtime(s), poll floor ${config.pollSeconds}s, alerts via ${config.alert.provider}`,
  );

  const context = await getPersistentContext(true);

  try {
    while (active.size > 0) {
      const now = Date.now();

      for (const showtime of config.showtimes) {
        if (!active.has(showtime.showtimeId)) continue;
        if (Date.parse(showtime.starts) <= now) {
          console.log(`[${showtime.label}] showtime has passed — no longer polling`);
          active.delete(showtime.showtimeId);
        }
      }

      const due = config.showtimes.filter(
        (s) => active.has(s.showtimeId) && (nextCheckAt.get(s.showtimeId) ?? 0) <= now,
      );

      for (const showtime of due) {
        const state = states.get(showtime.showtimeId)!;
        await checkShowtime(context, showtime, state, config.alert, config.minSaneSeats);
        saveState(states);

        const backoff = backoffMultiplier(state.consecutiveErrors);
        nextCheckAt.set(showtime.showtimeId, Date.now() + config.pollSeconds * 1000 * backoff);
        await sleep(STAGGER_GAP_MS);
      }

      await sleep(TICK_MS);
    }

    console.log('All configured showtimes have passed. Exiting.');
  } finally {
    await context.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
