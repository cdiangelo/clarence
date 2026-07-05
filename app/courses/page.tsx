'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useLiveRoundStore } from '@/stores/liveRound';
import { AppShell } from '@/components/layout/AppShell';

interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  par: number;
  rating18?: number;
  slope18?: number;
  rating9?: number;
  slope9?: number;
  holes: 9 | 18;
  verified: boolean;
}

export default function CoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const startLiveRound = useLiveRoundStore((s) => s.start);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
  }, [user, router]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/courses?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.courses ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  if (!user) return null;

  function logRound(c: Course) {
    const params = new URLSearchParams({
      courseId: c.id,
      courseName: c.name,
      par: String(c.par),
      holes: String(c.holes),
    });
    if (c.rating18) params.set('rating18', String(c.rating18));
    if (c.slope18)  params.set('slope18',  String(c.slope18));
    if (c.rating9)  params.set('rating9',  String(c.rating9));
    if (c.slope9)   params.set('slope9',   String(c.slope9));
    router.push(`/log?${params.toString()}`);
  }

  function askCaddie(c: Course) {
    const q = encodeURIComponent(`Tell me about ${c.name} in ${c.city}, ${c.state} — tips for strategy, tough holes, and how to score well there.`);
    router.push(`/chat?q=${q}`);
  }

  function startLive(c: Course) {
    startLiveRound(
      { id: c.id, name: c.name, lat: c.lat, lng: c.lng, par: c.par, rating18: c.rating18, slope18: c.slope18, rating9: c.rating9, slope9: c.slope9 },
      c.holes,
      'solo',
    );
    router.push('/log');
  }

  return (
    <AppShell>
      <div className="px-4 py-5 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-paper outline-none focus:border-turf transition-colors"
            placeholder="Search courses by name or city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-turf/30 border-t-turf rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-ink">{c.name}</span>
                      {!c.verified && (
                        <span className="text-[9px] text-gold font-display tracking-wider">~APPROX</span>
                      )}
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5">{c.city}, {c.state}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-semibold text-ink">Par {c.par} · {c.holes}H</div>
                    {c.rating18 && c.slope18 && (
                      <div className="text-[9px] text-ink-muted stat-num">{c.rating18}/{c.slope18}</div>
                    )}
                    {c.rating9 && c.slope9 && !c.rating18 && (
                      <div className="text-[9px] text-ink-muted stat-num">{c.rating9}/{c.slope9} (9H)</div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => startLive(c)}
                    className="w-full flex items-center justify-center gap-1.5 bg-turf text-white text-[10px] font-display tracking-wider py-1.5 rounded-lg hover:bg-turf-light transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    START LIVE ROUND
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => logRound(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-turf text-turf text-[10px] font-display tracking-wider py-1.5 rounded-lg hover:bg-turf-wash transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                      LOG ROUND
                    </button>
                    <button
                      onClick={() => askCaddie(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-border text-ink-soft text-[10px] font-display tracking-wider py-1.5 rounded-lg hover:border-turf/50 transition-colors"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M9 5C9 7.21 7.21 9 5 9c-.7 0-1.36-.16-1.93-.44L1 9l.48-2.1A4 4 0 0 1 1 5C1 2.79 2.79 1 5 1s4 1.79 4 4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                      </svg>
                      ASK CADDIE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-ink-soft">No courses found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-ink-muted mt-1">Try a different name or city</p>
          </div>
        )}

        {query.trim().length < 2 && (
          <div className="text-center py-8 space-y-2">
            <div className="text-ink-muted text-sm">Search 1,000s of courses</div>
            <div className="text-ink-muted text-xs">
              Type 2+ characters · then Log Round or Ask Caddie
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
