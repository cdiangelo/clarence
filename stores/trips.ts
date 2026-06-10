import { create } from 'zustand';

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export type TripStatus = 'planning' | 'booked' | 'completed';

export interface ItineraryItem {
  id: string;
  day: number;
  time?: string;
  activity: string;
  location?: string;
  notes?: string;
  lat?: number;
  lng?: number;
}

export interface Trip {
  id: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  status: TripStatus;
  notes?: string;
  lat?: number;
  lng?: number;
  itinerary: ItineraryItem[];
}

interface TripsStore {
  trips: Trip[];
  createTrip: (trip: Omit<Trip, 'id' | 'itinerary' | 'status'>) => string;
  addItineraryItem: (tripId: string, item: Omit<ItineraryItem, 'id'>) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
}

export const useTripsStore = create<TripsStore>((set, get) => ({
  trips: [],

  createTrip: (trip) => {
    const id = uid();
    set((s) => ({
      trips: [...s.trips, { ...trip, id, status: 'planning', itinerary: [] }],
    }));
    return id;
  },

  addItineraryItem: (tripId, item) =>
    set((s) => ({
      trips: s.trips.map((t) =>
        t.id === tripId
          ? { ...t, itinerary: [...t.itinerary, { ...item, id: uid() }] }
          : t,
      ),
    })),

  updateTrip: (id, updates) =>
    set((s) => ({
      trips: s.trips.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTrip: (id) => set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),
}));
