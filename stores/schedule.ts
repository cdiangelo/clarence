import { create } from 'zustand';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type EventCategory = 'work' | 'personal' | 'health' | 'social' | 'finance';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  duration?: number;
  description?: string;
  category?: EventCategory;
}

interface ScheduleStore {
  events: CalendarEvent[];
  addEvent: (event: Omit<CalendarEvent, 'id'>) => string;
  deleteEvent: (id: string) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  getEventsForDate: (date: string) => CalendarEvent[];
  getUpcoming: (days?: number) => CalendarEvent[];
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  events: [],

  addEvent: (event) => {
    const id = uid();
    set((s) => ({ events: [...s.events, { ...event, id }] }));
    return id;
  },

  deleteEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  updateEvent: (id, updates) =>
    set((s) => ({
      events: s.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  getEventsForDate: (date) => get().events.filter((e) => e.date === date),

  getUpcoming: (days = 7) => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return get()
      .events.filter((e) => {
        const d = new Date(e.date);
        return d >= now && d <= cutoff;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  },
}));
