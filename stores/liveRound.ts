import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoundType } from './rounds';

export interface LiveHole {
  holeNumber: number;
  par: number;
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

interface LiveRoundState {
  active: boolean;
  course: LiveRoundCourse | null;
  holes: 9 | 18;
  roundType: RoundType;
  date: string;
  holeData: LiveHole[] | null;
  holeDataLoading: boolean;
  holeDataError: string;
  scores: (number | '')[];
  showMap: boolean;

  start: (course: LiveRoundCourse, holes: 9 | 18, roundType: RoundType) => Promise<void>;
  setScore: (index: number, value: number | '') => void;
  setShowMap: (v: boolean) => void;
  setRoundType: (t: RoundType) => void;
  setDate: (d: string) => void;
  discard: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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
      holeDataLoading: false,
      holeDataError: '',
      scores: [],
      showMap: false,

      start: async (course, holes, roundType) => {
        set({
          active: true, course, holes, roundType, date: todayISO(),
          holeData: null, holeDataLoading: !!course.id, holeDataError: '',
          scores: Array(holes).fill(''), showMap: false,
        });
        if (!course.id) {
          set({ holeDataLoading: false, holeDataError: 'No scorecard available for a custom course — enter your total at the end.' });
          return;
        }
        try {
          const res = await fetch(`/api/courses/${encodeURIComponent(course.id)}/holes`);
          const data = await res.json() as { holes: LiveHole[]; message?: string };
          const relevant = data.holes.filter((h) => h.holeNumber <= holes);
          if (relevant.length < holes) {
            set({ holeDataLoading: false, holeDataError: 'No complete scorecard available — enter your total at the end.' });
          } else {
            set({ holeData: relevant.slice(0, holes), holeDataLoading: false });
          }
        } catch {
          set({ holeDataLoading: false, holeDataError: 'Could not load scorecard — enter your total at the end.' });
        }
      },

      setScore: (index, value) => {
        const scores = [...get().scores];
        scores[index] = value;
        set({ scores });
      },

      setShowMap: (v) => set({ showMap: v }),
      setRoundType: (t) => set({ roundType: t }),
      setDate: (d) => set({ date: d }),

      discard: () => set({
        active: false, course: null, holeData: null, holeDataLoading: false,
        holeDataError: '', scores: [], showMap: false,
      }),
    }),
    { name: 'clarence-live-round' },
  ),
);
