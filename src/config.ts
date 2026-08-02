import { readFileSync } from 'node:fs';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import type { AppConfig } from './types.js';

const showtimeSchema = z.object({
  label: z.string().min(1),
  theater_id: z.number().int().positive(),
  showtime_id: z.number().int().positive(),
  movie_id: z.number().int().positive(),
  starts: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'starts must be a valid ISO datetime'),
});

const configSchema = z.object({
  poll_seconds: z.number().int().min(30, 'poll_seconds floor is 30 — Cinemark disallows /TicketSeatMap/ in robots.txt; stay polite'),
  min_sane_seats: z.number().int().positive().default(50),
  showtimes: z.array(showtimeSchema).min(1, 'configure at least one showtime'),
  alert: z.object({
    provider: z.enum(['pushover', 'ntfy']),
    priority: z.enum(['emergency', 'normal']).default('emergency'),
  }),
});

export function loadConfig(path = 'config.yaml'): AppConfig {
  const raw = readFileSync(path, 'utf8');
  const parsed = configSchema.parse(parseYaml(raw));

  const seen = new Set<number>();
  for (const s of parsed.showtimes) {
    if (seen.has(s.showtime_id)) throw new Error(`duplicate showtime_id in config: ${s.showtime_id}`);
    seen.add(s.showtime_id);
  }

  return {
    pollSeconds: parsed.poll_seconds,
    minSaneSeats: parsed.min_sane_seats,
    showtimes: parsed.showtimes.map((s) => ({
      label: s.label,
      theaterId: s.theater_id,
      showtimeId: s.showtime_id,
      movieId: s.movie_id,
      starts: s.starts,
    })),
    alert: parsed.alert,
  };
}

export function buildSeatMapUrl(s: { theaterId: number; showtimeId: number; movieId: number; starts: string }): string {
  // Built by template rather than URLSearchParams to match Cinemark's own
  // unencoded query format exactly (raw colons in Showtime=...) — unverified
  // whether their server cares, but no reason to risk it.
  return `https://www.cinemark.com/TicketSeatMap/?TheaterId=${s.theaterId}&ShowtimeId=${s.showtimeId}&CinemarkMovieId=${s.movieId}&Showtime=${s.starts}`;
}
