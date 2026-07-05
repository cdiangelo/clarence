import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoundType } from './rounds';

export interface LiveHole {
  holeNumber: number;
  par?: number;
  yardsBlue?: number;
  yardsWhite?: number;
  handicap?: number;
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

type HoleSource = 'db' | 'gca' | 'opengolf' | 'none';

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

  start: (course: LiveRoundCourse, holes: 9 | 18, roundType: RoundType) => Promise<void>;
  setScore: (index: number, value: number | '') => void;
  setRoundType: (t: RoundType) => void;
  setDate: (d: string) => void;
  discard: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Real hole data only. When no scorecard exists anywhere (db or GCA), we
// still populate bare hole-number placeholders so by-hole score entry always
// works — but we never invent par or yardage for them.
function bareHoles(holes: 9 | 18): LiveHole[] {
  return Array.from({ length: holes }, (_, i) => ({ holeNumber: i + 1 }));
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

      // Always ends with a usable hole-by-hole layout — real (db/gca) data
      // when available, otherwise bare hole numbers with no par/yardage
      // claimed. Nothing here is ever fabricated.
      start: async (course, holes, roundType) => {
        set({
          active: true, course, holes, roundType, date: todayISO(),
          holeData: null, holeDataSource: null, holeDataLoading: !!course.id,
          scores: Array(holes).fill(''),
        });

        if (!course.id) {
          set({ holeData: bareHoles(holes), holeDataSource: 'none', holeDataLoading: false });
          return;
        }

        try {
          const params = new URLSearchParams({ holes: String(holes) });
          if (course.par) params.set('par', String(course.par));
          const res = await fetch(`/api/courses/${encodeURIComponent(course.id)}/holes?${params}`);
          const data = await res.json() as { holes: LiveHole[]; source: HoleSource };
          const relevant = data.holes.filter((h) => h.holeNumber <= holes).slice(0, holes);
          if (relevant.length >= holes) {
            set({ holeData: relevant, holeDataSource: data.source, holeDataLoading: false });
          } else {
            set({ holeData: bareHoles(holes), holeDataSource: 'none', holeDataLoading: false });
          }
        } catch {
          set({ holeData: bareHoles(holes), holeDataSource: 'none', holeDataLoading: false });
        }
      },

      setScore: (index, value) => {
        const scores = [...get().scores];
        scores[index] = value;
        set({ scores });
      },

      setRoundType: (t) => set({ roundType: t }),
      setDate: (d) => set({ date: d }),

      discard: () => set({
        active: false, course: null, holeData: null, holeDataSource: null,
        holeDataLoading: false, scores: [],
      }),
    }),
    { name: 'clarence-live-round' },
  ),
);
