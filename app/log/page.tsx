'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useRoundsStore } from '@/stores/rounds';
import { AppShell } from '@/components/layout/AppShell';
import { QuickLog } from '@/components/round/QuickLog';
import Link from 'next/link';

export default function LogPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { rounds, loaded, load, addRound, deleteRound } = useRoundsStore();
  const [showLog, setShowLog] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (!loaded) load();
  }, [user, loaded, load, router]);

  if (!user) return null;

  async function handleSave(data: {
    courseName: string; courseId?: string; courseRating?: number; slopeRating?: number;
    holes: 9 | 18; score: number; putts?: number; notes?: string;
  }) {
    await addRound({ ...data, date: new Date().toISOString().slice(0, 10) });
    setShowLog(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <AppShell>
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-ink-soft">{rounds.length} round{rounds.length !== 1 ? 's' : ''} logged</div>
          <button
            onClick={() => setShowLog(true)}
            className="bg-turf text-white font-display tracking-wider text-[10px] px-3 py-1.5 rounded-lg hover:bg-turf-light transition-colors"
          >
            + LOG ROUND
          </button>
        </div>

        {saved && (
          <div className="bg-turf/10 border border-turf/30 text-turf text-sm rounded-xl px-4 py-3">
            Round saved successfully!
          </div>
        )}

        {rounds.length === 0 ? (
          <div className="bg-card border border-border border-dashed rounded-xl px-4 py-8 text-center">
            <p className="text-sm text-ink-soft mb-4">No rounds logged yet.<br />Start tracking your game.</p>
            <button
              onClick={() => setShowLog(true)}
              className="bg-turf text-white font-display tracking-wider text-xs px-5 py-2.5 rounded-lg"
            >
              LOG YOUR FIRST ROUND
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {rounds.map((r) => {
              const diff = r.courseRating && r.slopeRating
                ? (((r.score - r.courseRating) * 113) / r.slopeRating).toFixed(1)
                : null;
              return (
                <div key={r.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{r.courseName}</div>
                    <div className="text-[10px] text-ink-muted mt-0.5">
                      {new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{r.holes}H
                      {r.putts ? ` · ${r.putts} putts` : ''}
                    </div>
                    {r.notes && <div className="text-[10px] text-ink-soft mt-0.5 truncate">{r.notes}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg stat-num font-bold text-ink">{r.score}</div>
                    {diff && <div className="text-[10px] text-ink-muted">{diff} diff</div>}
                    {r.courseRating && r.slopeRating && (
                      <div className="text-[9px] text-ink-muted">{r.courseRating}/{r.slopeRating}</div>
                    )}
                  </div>
                  <button
                    onClick={() => { if (confirm('Delete this round?')) deleteRound(r.id); }}
                    className="text-ink-muted hover:text-flag text-base ml-1 flex-shrink-0"
                  >×</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Inline quick-log panel */}
        {showLog && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm max-h-[90vh] overflow-y-auto">
              <QuickLog
                onSave={handleSave}
                onCancel={() => setShowLog(false)}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
