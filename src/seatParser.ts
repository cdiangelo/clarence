import type { Page } from 'playwright';
import { SEAT_LEGEND, type ParsedSeats, type SeatLegendValue } from './types.js';

// KNOWN GOTCHA, unverified against the live DOM: the legend/key itself
// (the little "Available Seat / Selected Seat / ..." reference shown
// somewhere on the page) almost certainly has its own elements carrying
// these exact same alt/aria-label/title strings, separate from the actual
// seat grid. Scanning `document` wholesale will double-count those ~4
// phantom entries into the totals. If a real run's counts look off by a
// small constant, narrow this selector to the seat grid's container once
// you've inspected the real DOM (devtools → find the grid's wrapping
// element → give it an id/class → change SEAT_SCAN_ROOT_SELECTOR below).
const SEAT_SCAN_ROOT_SELECTOR = 'body';

const LEGEND_VALUES: SeatLegendValue[] = Object.values(SEAT_LEGEND);

export async function parseSeats(page: Page): Promise<ParsedSeats> {
  return page.evaluate(
    ({ rootSelector, legendValues, availableValue }) => {
      const root = document.querySelector(rootSelector) ?? document.body;
      const attrs = ['alt', 'aria-label', 'title'];
      const els = Array.from(root.querySelectorAll('[alt], [aria-label], [title]'));

      const counts: Record<string, number> = {};
      for (const v of legendValues) counts[v] = 0;
      const available: { label: string }[] = [];

      for (const el of els) {
        let label: string | null = null;
        for (const attr of attrs) {
          const v = el.getAttribute(attr);
          if (v && legendValues.some((lv) => v.includes(lv))) {
            label = v;
            break;
          }
        }
        if (!label) continue;

        const matched = legendValues.find((lv) => label!.includes(lv));
        if (!matched) continue;

        counts[matched] = (counts[matched] ?? 0) + 1;
        if (matched === availableValue) available.push({ label });
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { available, counts, total } as {
        available: { label: string }[];
        counts: Record<string, number>;
        total: number;
      };
    },
    { rootSelector: SEAT_SCAN_ROOT_SELECTOR, legendValues: LEGEND_VALUES, availableValue: SEAT_LEGEND.AVAILABLE },
  ) as Promise<ParsedSeats>;
}

// True if the page looks like it bounced to a sign-in flow instead of
// rendering the seat map — detected two ways since neither is fully
// reliable alone: the URL no longer being the seat map, or a password
// field present. Exact sign-in URL/markup is unverified; tighten this
// once you've seen a real expired-session redirect.
export async function looksLikeSignIn(page: Page): Promise<boolean> {
  const urlDrifted = !page.url().includes('/TicketSeatMap/');
  const hasPasswordField = await page
    .evaluate(() => !!document.querySelector('input[type="password"]'))
    .catch(() => false);
  return urlDrifted || hasPasswordField;
}
