import { create } from 'zustand';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface MealEntry {
  id: string;
  timestamp: string;
  meal: string;
  calories?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  notes?: string;
}

export interface WorkoutEntry {
  id: string;
  timestamp: string;
  type: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  notes?: string;
}

export interface MoodEntry {
  id: string;
  timestamp: string;
  score: number;
  notes?: string;
}

interface HealthStore {
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  moods: MoodEntry[];
  logMeal: (entry: Omit<MealEntry, 'id' | 'timestamp'>) => void;
  logWorkout: (entry: Omit<WorkoutEntry, 'id' | 'timestamp'>) => void;
  logMood: (entry: Omit<MoodEntry, 'id' | 'timestamp'>) => void;
  getTodayMeals: () => MealEntry[];
  getTodayWorkouts: () => WorkoutEntry[];
  getLatestMood: () => MoodEntry | undefined;
  getWorkoutStreak: () => number;
}

function isToday(timestamp: string): boolean {
  const d = new Date(timestamp);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export const useHealthStore = create<HealthStore>((set, get) => ({
  meals: [],
  workouts: [],
  moods: [],

  logMeal: (entry) =>
    set((s) => ({
      meals: [{ ...entry, id: uid(), timestamp: new Date().toISOString() }, ...s.meals],
    })),

  logWorkout: (entry) =>
    set((s) => ({
      workouts: [{ ...entry, id: uid(), timestamp: new Date().toISOString() }, ...s.workouts],
    })),

  logMood: (entry) =>
    set((s) => ({
      moods: [{ ...entry, id: uid(), timestamp: new Date().toISOString() }, ...s.moods],
    })),

  getTodayMeals: () => get().meals.filter((m) => isToday(m.timestamp)),

  getTodayWorkouts: () => get().workouts.filter((w) => isToday(w.timestamp)),

  getLatestMood: () => get().moods[0],

  getWorkoutStreak: () => {
    const workouts = [...get().workouts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    if (!workouts.length) return 0;
    let streak = 0;
    const now = new Date();
    let cursor = new Date(now);
    cursor.setHours(0, 0, 0, 0);

    const byDay = new Set(
      workouts.map((w) => {
        const d = new Date(w.timestamp);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    );

    while (true) {
      const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`;
      if (!byDay.has(key)) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  },
}));
