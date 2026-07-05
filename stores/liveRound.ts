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

// A tee set the player can choose at round start — each carries its own
// rating/slope, which is what actually determines the WHS differential, so
// picking the wrong one (or always defaulting to one) skews the round's
// handicap math even if the yardages shown are just cosmetic.
export interface TeeChoice {
  id: string;
  name: string;
  gender?: 'male' | 'female';
  rating18?: number;
  slope18?: number;
  par: number;
  holesCount: 9 | 18;
  holes: LiveHole[];
}

interface LiveRoundState {
  active: boolean;
  course: LiveRoundCourse | null;
  holes: 9 | 18;
  roundType: RoundType;
  date: string;
  teeOptions: TeeChoice[] | null;
  teeOptionsSource: HoleSource | null;
  teeOptionsLoading: boolean;
  selectedTeeId: string | null;
  holeData: LiveHole[] | null;
  holeDataSource: HoleSource | null;
  holeDataLoading: boolean;
  scores: (number | '')[];

  start: (course: LiveRoundCourse, holes: 9 | 18, roundType: RoundType) => Promise<void>;
  selectTee: (teeId: string) => void;
  setScore: (index: number, value: number | '') => void;
  setRoundType: (t: RoundType) => void;
  setDate: (d: string) => void;
  discard: () => void;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Real hole data only. When no scorecard exists anywhere (db, GCA, or
// OpenGolfAPI), we still populate bare hole-number placeholders so by-hole
// score entry always works — but we never invent par or yardage for them.
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
      teeOptions: null,
      teeOptionsSource: null,
      teeOptionsLoading: false,
      selectedTeeId: null,
      holeData: null,
      holeDataSource: null,
      holeDataLoading: false,
      scores: [],

      // Fetches every real tee set available for the course (real data only)
      // and auto-selects when there's exactly one — otherwise the player
      // picks via selectTee(). No scorecard anywhere still ends in a usable
      // bare hole-number layout so by-hole entry always works.
      start: async (course, holes, roundType) => {
        set({
          active: true, course, holes, roundType, date: todayISO(),
          teeOptions: null, teeOptionsSource: null, teeOptionsLoading: !!course.id, selectedTeeId: null,
          holeData: null, holeDataSource: null, holeDataLoading: !!course.id,
          scores: Array(holes).fill(''),
        });

        if (!course.id) {
          set({ holeData: bareHoles(holes), holeDataSource: 'none', holeDataLoading: false, teeOptionsLoading: false });
          return;
        }

        try {
          const res = await fetch(`/api/courses/${encodeURIComponent(course.id)}/tees`);
          const data = await res.json() as { tees: TeeChoice[]; source: HoleSource };
          const usable = data.tees.filter((t) => t.holes.length >= holes);

          if (usable.length === 0) {
            set({ holeData: bareHoles(holes), holeDataSource: 'none', holeDataLoading: false, teeOptionsLoading: false });
            return;
          }

          set({ teeOptions: usable, teeOptionsSource: data.source, teeOptionsLoading: false, holeDataLoading: false });
          if (usable.length === 1) get().selectTee(usable[0].id);
        } catch {
          set({ holeData: bareHoles(holes), holeDataSource: 'none', holeDataLoading: false, teeOptionsLoading: false });
        }
      },

      // Applies the chosen tee's holes AND its rating/slope to the round —
      // the rating/slope is what actually drives the WHS differential, so
      // this has to track the tee actually played, not a course-level default.
      selectTee: (teeId) => {
        const { teeOptions, teeOptionsSource, holes, course } = get();
        const tee = teeOptions?.find((t) => t.id === teeId);
        if (!tee || !course) return;

        const relevant = tee.holes.filter((h) => h.holeNumber <= holes).slice(0, holes);
        set({
          selectedTeeId: teeId,
          holeData: relevant,
          holeDataSource: teeOptionsSource,
          course: { ...course, rating18: tee.rating18 ?? course.rating18, slope18: tee.slope18 ?? course.slope18 },
        });
      },

      setScore: (index, value) => {
        const scores = [...get().scores];
        scores[index] = value;
        set({ scores });
      },

      setRoundType: (t) => set({ roundType: t }),
      setDate: (d) => set({ date: d }),

      discard: () => set({
        active: false, course: null, teeOptions: null, teeOptionsSource: null, teeOptionsLoading: false, selectedTeeId: null,
        holeData: null, holeDataSource: null, holeDataLoading: false, scores: [],
      }),
    }),
    { name: 'clarence-live-round' },
  ),
);
