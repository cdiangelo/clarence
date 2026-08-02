import { chromium, type BrowserContext } from 'playwright';
import path from 'node:path';

const USER_DATA_DIR = path.resolve(process.cwd(), 'data', 'browser-profile');

// A persistent context (not a fresh incognito one) so the Cinemark login
// session survives process restarts. All showtime checks share one context
// and open/close their own page — see index.ts for why they're never run
// concurrently against Cinemark.
export async function getPersistentContext(headless: boolean): Promise<BrowserContext> {
  return chromium.launchPersistentContext(USER_DATA_DIR, {
    headless,
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
}
