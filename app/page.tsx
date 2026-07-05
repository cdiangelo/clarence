'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useRoundsStore } from '@/stores/rounds';
import { AppShell } from '@/components/layout/AppShell';
import { ComboChart } from '@/components/charts/ComboChart';
import { calcHandicapIndex, calcSeasonStats } from '@/lib/handicap';
import type { RoundInput } from '@/lib/handicap';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { rounds, loaded, load } = useRoundsStore();

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (!loaded) load();
  }, [user, loaded, load, router]);

  if (!user) return null;

  const roundInputs: RoundInput[] = rounds
    .filter((r) => r.courseRating && r.slopeRating)
    .map((r) => ({
      id: r.id, date: r.date, score: r.score, holes: r.holes,
      courseRating: r.courseRating!, slopeRating: r.slopeRating!,
    }));

  const hcp = calcHandicapIndex(roundInputs);
  const season = calcSeasonStats(roundInputs);
  const recent = rounds.slice(0, 6);

  // Build combo chart data (last 12 months)
  const chartData = season.monthlyData.map((m) => ({
    month: m.month,
    count: m.count,
    avgScore: m.avgScore,
    handicap: null as number | null,
  }));

  return (
    <AppShell>
      <div className="px-4 py-5 space-y-5 pb-4">
        {/* Handicap hero */}
        <div className="bg-turf text-white rounded-2xl px-5 py-4">
          <div className="text-[10px] font-display tracking-widest opacity-70 mb-1">HANDICAP INDEX</div>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-display tracking-wider">
              {hcp.handicapIndex != null ? hcp.handicapIndex.toFixed(1) : '—'}
            </span>
            {hcp.handicapIndex == null && (
              <span className="text-sm opacity-70 mb-1">
                {hcp.message ?? 'Log more rounds'}
              </span>
            )}
          </div>
          <div className="text-[10px] opacity-60 mt-1 font-display tracking-wider">
            {hcp.roundsUsed > 0 ? `BEST ${hcp.roundsUsed} OF ${Math.min(rounds.length, 20)} DIFFERENTIALS` : 'WORLD HANDICAP SYSTEM'}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard label="Rounds" value={season.roundsYTD.toString()} sub={new Date().getFullYear().toString()} />
          <StatCard
            label="Avg Score"
            value={season.avgScore != null ? season.avgScore.toFixed(1) : '—'}
          />
          <StatCard
            label="Best Diff"
            value={season.lowestDiff != null ? season.lowestDiff.toFixed(1) : '—'}
            sub="this year"
          />
        </div>

        {/* Season chart */}
        {season.roundsYTD > 0 && (
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="eyebrow mb-3">Season Overview</div>
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
              <p className="text-sm text-ink-soft mb-3">No rounds logged yet.</p>
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
                      <div className="text-sm font-semibold text-ink truncate">{r.courseName}</div>
                      <div className="text-[10px] text-ink-muted mt-0.5">
                        {new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-3 text-center">
      <div className="text-xl stat-num font-bold text-ink">{value}</div>
      <div className="text-[9px] font-display tracking-wider text-ink-soft mt-0.5">{label.toUpperCase()}</div>
      {sub && <div className="text-[9px] text-ink-muted">{sub}</div>}
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
