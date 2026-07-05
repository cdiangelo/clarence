'use client';
import React, { useState } from 'react';
import { useLiveRoundStore } from '@/stores/liveRound';
import { useRoundsStore } from '@/stores/rounds';

function holeScoreColor(score: number | '', par?: number): string {
  if (score === '' || score === 0 || par == null) return 'text-ink';
  const diff = Number(score) - par;
  if (diff <= -1) return 'text-turf font-bold';
  if (diff === 0) return 'text-ink-soft';
  if (diff === 1) return 'text-gold';
  return 'text-flag';
}

export function LiveScorecard() {
  const {
    course, holes, roundType, date, holeData, holeDataSource, holeDataLoading,
    scores, setScore, setRoundType, setDate, discard,
  } = useLiveRoundStore();
  const { addRound } = useRoundsStore();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!course) return null;

  const enteredScores = scores.filter((s) => s !== '').map(Number);
  const runningTotal = enteredScores.reduce((a, b) => a + b, 0);
  const allEntered = holeData != null && scores.length === holes && scores.every((s) => s !== '' && Number(s) > 0);

  const knownPars = (holeData ?? []).map((h) => h.par).filter((p): p is number => p != null);
  const totalPar = knownPars.length === (holeData?.length ?? 0) && knownPars.length > 0
    ? knownPars.reduce((a, b) => a + b, 0)
    : null;
  const maxYardage = Math.max(...(holeData ?? []).map((h) => h.yardsBlue ?? h.yardsWhite ?? 0), 1);
  const totalYardage = (holeData ?? []).reduce((s, h) => s + (h.yardsBlue ?? h.yardsWhite ?? 0), 0);

  async function handleSave() {
    if (!allEntered) { setError('Enter a score for every hole'); return; }

    setError('');
    setSaving(true);
    try {
      const courseRating = holes === 18 ? course!.rating18 : course!.rating9;
      const slopeRating = holes === 18 ? course!.slope18 : course!.slope9;
      await addRound({
        courseName: course!.name,
        courseId: course!.id,
        courseRating, slopeRating,
        date, holes, score: runningTotal, roundType,
      });
      discard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save round');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card border-2 border-turf rounded-2xl shadow-elevated overflow-hidden mb-4">
      {/* Pinned header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-turf text-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
          <span className="font-display text-[10px] tracking-widest flex-shrink-0">LIVE ROUND</span>
          <span className="text-xs truncate opacity-90">{course.name}</span>
        </div>
        <button
          onClick={() => (confirmDiscard ? discard() : setConfirmDiscard(true))}
          onBlur={() => setConfirmDiscard(false)}
          className="text-[9px] font-display tracking-wider opacity-80 hover:opacity-100 flex-shrink-0 ml-2"
        >
          {confirmDiscard ? 'TAP TO CONFIRM' : 'DISCARD'}
        </button>
      </div>

      {/* Toolbar: round type, date */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto">
        <select
          value={roundType}
          onChange={(e) => setRoundType(e.target.value as 'solo' | 'scramble')}
          className="text-[10px] font-display tracking-wider border border-border rounded-lg px-2 py-1 bg-paper outline-none flex-shrink-0"
        >
          <option value="solo">SOLO</option>
          <option value="scramble">SCRAMBLE</option>
        </select>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="text-[10px] border border-border rounded-lg px-2 py-1 bg-paper outline-none flex-shrink-0"
        />
        {holeDataSource === 'none' && (
          <span className="text-[9px] text-ink-muted flex-shrink-0">
            No scorecard on file — enter scores by hole
          </span>
        )}
        {holeDataSource === 'opengolf' && (
          <span className="text-[9px] text-ink-muted flex-shrink-0">
            Scorecard via OpenStreetMap contributors (ODbL)
          </span>
        )}
      </div>

      {holeDataLoading && (
        <div className="flex items-center gap-2 text-sm text-ink-soft py-6 px-4">
          <div className="w-4 h-4 border-2 border-turf/30 border-t-turf rounded-full animate-spin flex-shrink-0" />
          Loading scorecard…
        </div>
      )}

      {/* Combined hole cards: condensed layout visual + score entry, one
          horizontally-scrolling row, real data only (par/yardage omitted
          entirely for holes we have no scorecard for) */}
      {holeData && !holeDataLoading && (
        <div className="px-4 py-3">
          <div className="text-[10px] text-ink-muted mb-2">
            {totalPar != null ? `Par ${totalPar}` : ''}
            {totalYardage > 0 ? `${totalPar != null ? ' · ' : ''}~${totalYardage} yds` : ''}
            {(totalPar != null || totalYardage > 0) ? ' · ' : ''}{holes} holes
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {holeData.map((h, i) => {
              const yds = h.yardsBlue ?? h.yardsWhite ?? 0;
              const barPct = yds > 0 ? Math.max(12, (yds / maxYardage) * 100) : 0;
              const parColor = h.par === 3 ? '#3B7DC4' : h.par === 5 ? '#2F6B44' : '#9BA3A5';
              return (
                <div key={h.holeNumber} className="flex-shrink-0 w-16 border border-border rounded-lg px-1.5 py-2 text-center bg-paper">
                  <div className="text-[9px] font-display tracking-wider text-ink-muted">H{h.holeNumber}</div>
                  {h.par != null ? (
                    <div className="text-sm font-extrabold stat-num text-ink mt-0.5">{h.par}</div>
                  ) : (
                    <div className="text-sm font-extrabold stat-num text-ink-muted mt-0.5">—</div>
                  )}
                  {yds > 0 && (
                    <>
                      <div className="h-1 rounded-full bg-border overflow-hidden my-1.5">
                        <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: parColor }} />
                      </div>
                      <div className="text-[8px] text-ink-muted stat-num">{yds}y</div>
                    </>
                  )}
                  <input
                    type="number" min={1} max={15}
                    className={`w-full mt-1.5 text-center border rounded-md py-1 text-sm font-semibold outline-none focus:border-turf border-border bg-white ${holeScoreColor(scores[i], h.par)}`}
                    value={scores[i] ?? ''}
                    onChange={(e) => setScore(i, e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="—"
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-[10px] font-display tracking-wider text-ink-muted">
              TOTAL{totalPar != null ? ` · Par ${totalPar}` : ''}
            </span>
            <span className={`text-lg font-extrabold stat-num ${runningTotal > 0 ? holeScoreColor(runningTotal, totalPar ?? undefined) : 'text-ink-muted'}`}>
              {runningTotal > 0 ? runningTotal : '—'}
            </span>
          </div>

          {error && <p className="text-xs text-flag mt-2">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || holeDataLoading}
            className="w-full mt-3 bg-turf text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 hover:bg-turf-light transition-colors"
          >
            {saving ? 'Saving…' : 'Save Round to Log'}
          </button>
        </div>
      )}
    </div>
  );
}
