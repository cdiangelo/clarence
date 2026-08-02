import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { initialState, type ShowtimeState } from './types.js';

const STATE_PATH = path.resolve(process.cwd(), 'data', 'state.json');

export function loadState(showtimeIds: number[]): Map<number, ShowtimeState> {
  const map = new Map<number, ShowtimeState>();
  let saved: Record<string, ShowtimeState> = {};

  if (existsSync(STATE_PATH)) {
    try {
      saved = JSON.parse(readFileSync(STATE_PATH, 'utf8'));
    } catch (e) {
      console.warn('[state] could not parse data/state.json, starting fresh', e);
    }
  }

  for (const id of showtimeIds) {
    map.set(id, saved[String(id)] ?? initialState());
  }
  return map;
}

export function saveState(states: Map<number, ShowtimeState>): void {
  const dir = path.dirname(STATE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const out: Record<string, ShowtimeState> = {};
  for (const [id, state] of states) out[String(id)] = state;
  writeFileSync(STATE_PATH, JSON.stringify(out, null, 2));
}
