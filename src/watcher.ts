import type { BrowserContext } from 'playwright';
import { buildSeatMapUrl } from './config.js';
import { parseSeats, looksLikeSignIn } from './seatParser.js';
import { sendAlert } from './alert.js';
import { SEAT_LEGEND, type AlertConfig, type ShowtimeConfig, type ShowtimeState } from './types.js';

const FLAP_SUPPRESSION_MS = 10 * 60 * 1000;
const PARSER_FAILURE_ALERT_THRESHOLD = 3; // consecutive bad reads before alerting — don't fire on one blip
const PAGE_LOAD_TIMEOUT_MS = 20_000;

// One check of one showtime. Never throws — errors are logged and folded
// into the showtime's own error backoff so one bad cycle doesn't take down
// the whole loop.
export async function checkShowtime(
  context: BrowserContext,
  showtime: ShowtimeConfig,
  state: ShowtimeState,
  alertConfig: AlertConfig,
  minSaneSeats: number,
): Promise<void> {
  const url = buildSeatMapUrl(showtime);
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: PAGE_LOAD_TIMEOUT_MS });
    await page.waitForSelector('[alt], [aria-label], [title]', { timeout: 15_000 }).catch(() => {});

    if (await looksLikeSignIn(page)) {
      if (!state.sessionExpiredAlerted) {
        await sendAlert(alertConfig, {
          title: `Seat watcher: session expired`,
          message: `Cinemark bounced "${showtime.label}" to a sign-in page. Log back in (npm run login) — the watcher can't see seats until then.`,
          url,
          urlTitle: 'Open seat map',
          emergency: true,
        });
        state.sessionExpiredAlerted = true;
      }
      state.consecutiveErrors = 0;
      return;
    }
    state.sessionExpiredAlerted = false;

    const parsed = await parseSeats(page);

    if (parsed.total < minSaneSeats) {
      state.consecutiveParserFailures++;
      console.warn(`[${showtime.label}] parser sanity check failed: total=${parsed.total} (want > ${minSaneSeats})`);
      if (state.consecutiveParserFailures === PARSER_FAILURE_ALERT_THRESHOLD) {
        await sendAlert(alertConfig, {
          title: `Seat watcher: parser may be broken`,
          message: `"${showtime.label}" has only parsed ${parsed.total} seat elements across ${PARSER_FAILURE_ALERT_THRESHOLD} checks — expected > ${minSaneSeats}. The page layout may have changed; the watcher could be silently reporting zero seats forever.`,
          url,
          urlTitle: 'Open seat map',
          emergency: true,
        });
      }
      state.consecutiveErrors = 0;
      return;
    }
    state.consecutiveParserFailures = 0;

    const count = parsed.available.length;
    console.log(
      `[${showtime.label}] available=${count} total=${parsed.total} ` +
        `(unavailable=${parsed.counts[SEAT_LEGEND.UNAVAILABLE]}, wheelchair=${parsed.counts[SEAT_LEGEND.WHEELCHAIR]})`,
    );

    const now = Date.now();
    const isZeroToN = state.prevCount === 0 && count > 0;
    const isIncreasing = count > state.lastAlertedCount;
    const shouldAlert = (isZeroToN && now > state.suppressUntil) || (count > 0 && isIncreasing);

    if (shouldAlert) {
      const seatList = parsed.available
        .slice(0, 12)
        .map((s) => s.label)
        .join('; ');
      await sendAlert(alertConfig, {
        title: `${count} seat${count === 1 ? '' : 's'} open — ${showtime.label}`,
        message: `${seatList}${parsed.available.length > 12 ? ` (+${parsed.available.length - 12} more)` : ''}`,
        url,
        urlTitle: 'Open seat map',
        emergency: true,
      });
      state.lastAlertedCount = count;
      state.suppressUntil = now + FLAP_SUPPRESSION_MS;
    }
    state.prevCount = count;
    state.consecutiveErrors = 0;
  } catch (e) {
    state.consecutiveErrors++;
    console.error(`[${showtime.label}] check failed (consecutive errors: ${state.consecutiveErrors})`, e);
  } finally {
    await page.close().catch(() => {});
  }
}

// Backoff multiplier for a showtime's next check after N consecutive
// errors — capped at 10x the base poll interval so a prolonged outage
// doesn't storm Cinemark forever, but recovers fast once it's back.
export function backoffMultiplier(consecutiveErrors: number): number {
  return Math.min(2 ** consecutiveErrors, 10);
}
