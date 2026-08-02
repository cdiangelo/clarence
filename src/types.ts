export interface ShowtimeConfig {
  label: string;
  theaterId: number;
  showtimeId: number;
  movieId: number;
  starts: string; // ISO 8601, local to the theater
}

export interface AlertConfig {
  provider: 'pushover' | 'ntfy';
  priority: 'emergency' | 'normal';
}

export interface AppConfig {
  pollSeconds: number;
  minSaneSeats: number;
  showtimes: ShowtimeConfig[];
  alert: AlertConfig;
}

// The exact legend strings from the seat map page — the whole detection
// model keys off these, not colors or icon filenames (icons are movie-themed
// and change per film; this text is stable).
export const SEAT_LEGEND = {
  AVAILABLE: 'Available Seat',
  SELECTED: 'Selected Seat',
  UNAVAILABLE: 'Unavailable',
  WHEELCHAIR: 'Wheelchair Space (no seat)',
} as const;

export type SeatLegendValue = (typeof SEAT_LEGEND)[keyof typeof SEAT_LEGEND];

export interface ParsedSeats {
  available: { label: string }[];
  counts: Record<SeatLegendValue, number>;
  total: number;
}

export interface ShowtimeState {
  prevCount: number;
  lastAlertedCount: number;
  suppressUntil: number; // epoch ms; flap suppression window after an alert
  consecutiveParserFailures: number;
  consecutiveErrors: number;
  sessionExpiredAlerted: boolean;
}

export function initialState(): ShowtimeState {
  return {
    prevCount: 0,
    lastAlertedCount: 0,
    suppressUntil: 0,
    consecutiveParserFailures: 0,
    consecutiveErrors: 0,
    sessionExpiredAlerted: false,
  };
}
