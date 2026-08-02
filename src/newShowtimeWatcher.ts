// OPTIONAL, NOT WIRED UP BY DEFAULT.
//
// The build spec calls for "a second, slower watcher on the movie page that
// pings when a ShowtimeId appears that isn't in the config." That needs a
// URL for Cinemark's movie/showtimes-listing page, and unlike the seat map
// URL (given verbatim in the brief), no such URL was provided or verified
// here — guessing one risks polling the wrong page entirely, or worse,
// polling a real page incorrectly and drawing conclusions from garbage.
//
// To wire this up for real:
//   1. Open the movie's page on cinemark.com in a browser (the one listing
//      showtimes/theaters for "The Odyssey (IMAX 70mm)" or similar).
//   2. Note the exact URL pattern and, if showtimes load via XHR rather than
//      being present in the initial HTML, capture that request the same way
//      phase 2 captures the seat-data endpoint (DevTools → Network → find
//      the request → Copy as cURL).
//   3. Replace fetchKnownShowtimeIds() below with real parsing of that page
//      or endpoint, extracting each ShowtimeId it lists.
//   4. Call checkForNewShowtimes() on its own slower interval (e.g. every
//      10-15 minutes — this doesn't need 30s freshness) from a second loop
//      in index.ts, or as a standalone `npm run watch-new-showtimes` script.
//
// Until then this is a documented no-op, not a silently-wrong scraper.

export async function fetchKnownShowtimeIds(_movieId: number): Promise<number[]> {
  throw new Error(
    'fetchKnownShowtimeIds() is unimplemented — see the comment at the top of src/newShowtimeWatcher.ts for what to capture before wiring this up.',
  );
}

export async function checkForNewShowtimes(movieId: number, configuredIds: Set<number>): Promise<number[]> {
  const known = await fetchKnownShowtimeIds(movieId);
  return known.filter((id) => !configuredIds.has(id));
}
