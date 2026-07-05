import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoundType } from './rounds';
import { extrapolateHoles } from '@/lib/holeExtrapolation';

export interface LiveHole {
  holeNumber: number;
  par: number;
  yardsBlue?: number;
  yardsWhite?: number;
  handicap?: number;
  estimated?: boolean;
}

export interface LiveRoundCourse {
  id?: string;
  name: string;
  lat?: number;
  lng?: number;
  par?: number;
  rating18?: number;
  slope18?: number;
  rating9?: number;
  slope9?: number;
}

type HoleSource = 'db' | 'gca' | 'estimated';

interface LiveRoundState {
  active: boolean;
  course: LiveRoundCourse | null;
  holes: 9 | 18;
  roundType: RoundType;
  date: string;
  holeData: LiveHole[] | null;
  holeDataSource: HoleSource | null;
  holeDataLoading: boolean;
  scores: (number | '')[];
  showLayout: boolean;

  start: (course: LiveRoundCourse, holes: 9 | 18, roundType: RoundType) => Promise<void>;
  setScore: (index: number, value: number | '') => void;
  setShowLayout: (v: boolean) => void;
  setRoundType: (t: RoundType) => void;
  setDate: (d: string) => void;
  discard: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// extrapolateHoles() returns { yardage }, but LiveHole (matching the API's
// wire shape) uses { yardsBlue } — the API route remaps this server-side,
// but this client-side fallback path (no course.id to fetch from) has to
// do it itself or the yardage bars in the layout view silently render empty.
function toLiveHoles(par: number, holes: 9 | 18): LiveHole[] {
  return extrapolateHoles(par, holes).map((h) => ({
    holeNumber: h.holeNumber, par: h.par, yardsBlue: h.yardage, estimated: h.estimated,
  }));
}

export const useLiveRoundStore = create<LiveRoundState>()(
  persist(
    (set, get) => ({
      active: false,
      course: null,
      holes: 18,
      roundType: 'solo',
      date: todayISO(),
      holeData: null,
      holeDataSource: null,
      holeDataLoading: false,
      scores: [],
      showLayout: false,

      // Always ends with a usable hole-by-hole layout — real (db/gca) when
      // available, otherwise a clearly-flagged estimate from the course's
      // total par. There's no more "no scorecard, enter a total" fallback.
      start: async (course, holes, roundType) => {
        set({
          active: true, course, holes, roundType, date: todayISO(),
          holeData: null, holeDataSource: null, holeDataLoading: !!course.id,
          scores: Array(holes).fill(''), showLayout: false,
        });

        if (!course.id) {
          set({ holeData: toLiveHoles(course.par ?? 72, holes), holeDataSource: 'estimated', holeDataLoading: false });
          return;
        }

        try {
          const params = new URLSearchParams({ holes: String(holes) });
          if (course.par) params.set('par', String(course.par));
          const res = await fetch(`/api/courses/${encodeURIComponent(course.id)}/holes?${params}`);
          const data = await res.json() as { holes: LiveHole[]; source: HoleSource };
          const relevant = data.holes.filter((h) => h.holeNumber <= holes).slice(0, holes);
          set({ holeData: relevant, holeDataSource: data.source, holeDataLoading: false });
        } catch {
          // Even a network failure still gets a usable estimated layout
          set({ holeData: toLiveHoles(course.par ?? 72, holes), holeDataSource: 'estimated', holeDataLoading: false });
        }
      },

      setScore: (index, value) => {
        const scores = [...get().scores];
        scores[index] = value;
        set({ scores });
      },

      setShowLayout: (v) => set({ showLayout: v }),
      setRoundType: (t) => set({ roundType: t }),
      setDate: (d) => set({ date: d }),

      discard: () => set({
        active: false, course: null, holeData: null, holeDataSource: null,
        holeDataLoading: false, scores: [], showLayout: false,
      }),
    }),
    { name: 'clarence-live-round' },
  ),
);
