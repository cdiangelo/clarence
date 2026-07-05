'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useRoundsStore, type RoundType } from '@/stores/rounds';
import { AppShell } from '@/components/layout/AppShell';
import { ComboChart } from '@/components/charts/ComboChart';
import { calcHandicapIndex, calcSeasonStats } from '@/lib/handicap';
import type { RoundInput } from '@/lib/handicap';
import Link from 'next/link';

type Filter = 'all' | RoundType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'solo', label: 'Solo' },
  { key: 'scramble', label: 'Scramble' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { rounds, loaded, load } = useRoundsStore();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (!loaded) load();
  }, [user, loaded, load, router]);

  if (!user) return null;

  const filteredRounds = filter === 'all' ? rounds : rounds.filter((r) => r.roundType === filter);

  const roundInputs: RoundInput[] = filteredRounds
    .filter((r) => r.courseRating && r.slopeRating)
    .map((r) => ({
      id: r.id, date: r.date, score: r.score, holes: r.holes,
      courseRating: r.courseRating!, slopeRating: r.slopeRating!,
    }));

  // calcHandicapIndex already enforces a 3-round minimum on whatever
  // population it's given — filtering by round type before calling it
  // means the minimum is naturally scoped to the selected bucket
  const hcp = calcHandicapIndex(roundInputs);
  const season = calcSeasonStats(roundInputs);
  const recent = filteredRounds.slice(0, 6);

  // Build combo chart data (last 12 months)
  const chartData = season.monthlyData.map((m) => ({
    month: m.month,
    count: m.count,
    avgScore: m.avgScore,
    handicap: null as number | null,
  }));

  return (
    <AppShell>
      <div className="px-4 py-4 space-y-4 pb-4">
        {/* Round type filter */}
        <div className="flex gap-1.5">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                filter === key
                  ? key === 'scramble'
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-turf bg-turf-wash text-turf'
                  : 'border-border text-ink-soft hover:border-turf/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Handicap hero + stats, consolidated into one card */}
        <div className="bg-turf text-white rounded-2xl overflow-hidden flex">
          <div className="flex-1 basis-1/3 px-5 py-4 min-w-0">
            <div className="text-[10px] font-display tracking-widest opacity-70 mb-1">HANDICAP INDEX</div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-display tracking-wider">
                {hcp.handicapIndex != null ? hcp.handicapIndex.toFixed(1) : '—'}
              </span>
              {hcp.handicapIndex == null && (
                <span className="text-xs opacity-70 mb-1">
                  {hcp.message ?? 'Log more rounds'}
                </span>
              )}
            </div>
            <div className="text-[9px] opacity-60 mt-1 font-display tracking-wider">
              {hcp.roundsUsed > 0 ? `BEST ${hcp.roundsUsed} OF ${Math.min(filteredRounds.length, 20)} DIFFERENTIALS` : 'WORLD HANDICAP SYSTEM'}
            </div>
            {filter === 'scramble' && (
              <div className="text-[9px] opacity-60 mt-1.5 leading-snug">
                Scramble/team rounds aren&rsquo;t WHS-eligible — reference only, not an official index.
              </div>
            )}
          </div>

          {/* Softer green stats panel — 3 equal-width columns filling the right 2/3 */}
          <div className="flex-1 basis-2/3 flex-shrink-0 bg-white/10 flex divide-x divide-white/15">
            <MiniStat value={season.roundsYTD.toString()} label="Rounds" sub={new Date().getFullYear().toString()} />
            <MiniStat value={season.avgScore != null ? season.avgScore.toFixed(1) : '—'} label="Avg Score" />
            <MiniStat value={season.lowestDiff != null ? season.lowestDiff.toFixed(1) : '—'} label="Best Diff" />
          </div>
        </div>

        {/* Season chart */}
        {season.roundsYTD > 0 && (
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="eyebrow mb-2">Season Overview</div>
            <ComboChart data={chartData} />
          </div>
        )}

        {/* Recent rounds */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="eyebrow">Recent Rounds</span>
            <Link href="/log" className="text-[10px] font-display tracking-wider text-turf">+ LOG ROUND</Link>
          </div>
          {recent.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-xl px-4 py-6 text-center">
              <p className="text-sm text-ink-soft mb-3">
                {filter === 'all' ? 'No rounds logged yet.' : `No ${filter} rounds logged yet.`}
              </p>
              <Link href="/log" className="inline-block bg-turf text-white font-display tracking-wider text-xs px-4 py-2 rounded-lg">
                LOG YOUR FIRST ROUND
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((r) => {
                const diff = r.courseRating && r.slopeRating
                  ? (((r.score - r.courseRating) * 113) / r.slopeRating).toFixed(1)
                  : null;
                return (
                  <div key={r.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-sm font-semibold text-ink truncate">{r.courseName}</div>
                        {r.roundType === 'scramble' && (
                          <span className="flex-shrink-0 text-[8px] font-display tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded">
                            SCRAMBLE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-ink-muted mt-0.5">
                        {new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{r.holes}H
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg stat-num font-bold text-ink">{r.score}</div>
                      {diff && <div className="text-[10px] text-ink-muted">{diff} diff</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick links */}
        {rounds.length === 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            <QuickLink href="/bag" label="Set Up Bag" desc="Add your clubs" />
            <QuickLink href="/chat" label="Ask Caddie" desc="Get started" />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MiniStat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-2 py-1.5 text-center min-h-0">
      <div className="text-base stat-num font-bold text-white leading-tight">{value}</div>
      <div className="text-[7px] font-display tracking-wider text-white/70 leading-tight">{label.toUpperCase()}</div>
      {sub && <div className="text-[7px] text-white/50 leading-tight">{sub}</div>}
    </div>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="bg-card border border-border hover:border-turf/50 rounded-xl px-4 py-3 transition-colors">
      <div className="text-sm font-semibold text-ink">{label}</div>
      <div className="text-xs text-ink-muted mt-0.5">{desc}</div>
    </Link>
  );
}
