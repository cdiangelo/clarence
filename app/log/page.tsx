'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useRoundsStore, type Round } from '@/stores/rounds';
import { AppShell } from '@/components/layout/AppShell';
import { QuickLog, type InitialCourse, type InitialRound } from '@/components/round/QuickLog';

interface SaveData {
  courseName: string; courseId?: string; courseRating?: number; slopeRating?: number;
  date: string; holes: 9 | 18; score: number; putts?: number; notes?: string;
}

function LogPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { rounds, loaded, load, addRound, updateRound, deleteRound } = useRoundsStore();
  const [showLog, setShowLog] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [saved, setSaved] = useState(false);

  // Build initial course from URL params (set by courses page)
  const initialCourse: InitialCourse | undefined = (() => {
    const courseId   = searchParams.get('courseId');
    const courseName = searchParams.get('courseName');
    if (!courseName) return undefined;
    const holesParam = searchParams.get('holes');
    return {
      id:       courseId ?? undefined,
      name:     courseName,
      par:      searchParams.get('par')      ? Number(searchParams.get('par'))      : undefined,
      rating18: searchParams.get('rating18') ? Number(searchParams.get('rating18')) : undefined,
      slope18:  searchParams.get('slope18')  ? Number(searchParams.get('slope18'))  : undefined,
      rating9:  searchParams.get('rating9')  ? Number(searchParams.get('rating9'))  : undefined,
      slope9:   searchParams.get('slope9')   ? Number(searchParams.get('slope9'))   : undefined,
      holes:    holesParam === '9' ? 9 : holesParam === '18' ? 18 : undefined,
      verified: false,
    };
  })();

  // Open modal automatically if a course was passed in via URL
  useEffect(() => {
    if (initialCourse) setShowLog(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) { router.replace('/auth'); return; }
    if (!loaded) load();
  }, [user, loaded, load, router]);

  if (!user) return null;

  function closeModal() {
    setShowLog(false);
    setEditingRound(null);
    router.replace('/log');
  }

  function openEdit(r: Round) {
    setEditingRound(r);
    setShowLog(true);
  }

  async function handleSave(data: SaveData) {
    if (editingRound) {
      await updateRound(editingRound.id, data);
    } else {
      await addRound(data);
    }
    setShowLog(false);
    setEditingRound(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Clear URL params after saving
    router.replace('/log');
  }

  const initialRound: InitialRound | undefined = editingRound
    ? {
        courseId: editingRound.courseId,
        courseName: editingRound.courseName,
        date: editingRound.date,
        holes: editingRound.holes,
        score: editingRound.score,
        courseRating: editingRound.courseRating,
        slopeRating: editingRound.slopeRating,
        putts: editingRound.putts,
        notes: editingRound.notes,
      }
    : undefined;

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
            Round saved!
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
              const diff =
                r.courseRating && r.slopeRating
                  ? (((r.score - r.courseRating) * 113) / r.slopeRating).toFixed(1)
                  : null;
              return (
                <button
                  key={r.id}
                  onClick={() => openEdit(r)}
                  className="w-full text-left bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 hover:border-turf/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">{r.courseName}</div>
                    <div className="text-[10px] text-ink-muted mt-0.5">
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                      })}
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
                  <span
                    onClick={(e) => { e.stopPropagation(); if (confirm('Delete this round?')) deleteRound(r.id); }}
                    className="text-ink-muted hover:text-flag text-base ml-1 flex-shrink-0 px-1"
                    role="button"
                    aria-label="Delete round"
                  >
                    ×
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {showLog && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm max-h-[92vh] overflow-y-auto">
              <QuickLog
                initialCourse={editingRound ? undefined : initialCourse}
                initialRound={initialRound}
                onSave={handleSave}
                onCancel={closeModal}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function LogPage() {
  return (
    <Suspense>
      <LogPageInner />
    </Suspense>
  );
}
