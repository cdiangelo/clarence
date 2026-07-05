'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { AppShell } from '@/components/layout/AppShell';

interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{c.name}</span>
                      {!c.verified && <span className="text-[9px] text-gold font-display tracking-wider">~APPROX</span>}
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
          <div className="text-center py-8">
            <div className="text-ink-muted text-sm">Search 1,000s of courses</div>
            <div className="text-ink-muted text-xs mt-1">Type 2+ characters to search</div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
