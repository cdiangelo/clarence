// One-time interactive login. Opens a real (headed) browser window against
// the persistent profile the watcher will reuse — log into the Cinemark
// Movie Fan account by hand, then close the window. Credentials never touch
// this codebase; Playwright just saves the resulting session cookies into
// data/browser-profile.
import { getPersistentContext } from './browser.js';

async function main() {
  console.log('Opening a browser window. Sign into your Cinemark account, then close the window when done.');
  const context = await getPersistentContext(false);
  const page = await context.newPage();
  await page.goto('https://www.cinemark.com/');

  await new Promise<void>((resolve) => {
    context.on('close', () => resolve());
  });

  console.log('Session saved to data/browser-profile. Run `npm run watch` to start polling.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
