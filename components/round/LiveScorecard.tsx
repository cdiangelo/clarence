'use client';
import React, { useState } from 'react';
import { useLiveRoundStore } from '@/stores/liveRound';
import { useRoundsStore } from '@/stores/rounds';

function holeScoreColor(score: number | '', par: number): string {
  if (score === '' || score === 0) return 'text-ink';
  const diff = Number(score) - par;
  if (diff <= -1) return 'text-turf font-bold';
  if (diff === 0) return 'text-ink-soft';
  if (diff === 1) return 'text-gold';
  return 'text-flag';
}

export function LiveScorecard() {
  const {
    course, holes, roundType, date, holeData, holeDataLoading, holeDataError,
    scores, showMap, setScore, setShowMap, setRoundType, setDate, discard,
  } = useLiveRoundStore();
  const { addRound } = useRoundsStore();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  if (!course) return null;

  const enteredScores = scores.filter((s) => s !== '').map(Number);
  const runningTotal = enteredScores.reduce((a, b) => a + b, 0);
  const allEntered = scores.length === holes && scores.every((s) => s !== '' && Number(s) > 0);

  const front9 = holeData?.slice(0, 9) ?? [];
  const back9 = holeData?.slice(9, 18) ?? [];
  const front9Par = front9.reduce((s, h) => s + h.par, 0);
  const back9Par = back9.reduce((s, h) => s + h.par, 0);
  const front9Score = scores.slice(0, 9).filter((s) => s !== '').reduce((a, b) => a + Number(b), 0);
  const back9Score = scores.slice(9, 18).filter((s) => s !== '').reduce((a, b) => a + Number(b), 0);

  const mapUrl = course.lat != null && course.lng != null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${course.lng - 0.006}%2C${course.lat - 0.0045}%2C${course.lng + 0.006}%2C${course.lat + 0.0045}&layer=mapnik&marker=${course.lat}%2C${course.lng}`
    : null;

  async function handleSave() {
    let finalScore: number;
    if (holeData) {
      if (!allEntered) { setError('Enter a score for every hole'); return; }
      finalScore = runningTotal;
    } else {
      const s = parseInt(totalInput, 10);
      if (isNaN(s) || s < 1) { setError('Enter your total score'); return; }
      finalScore = s;
    }

    setError('');
    setSaving(true);
    try {
      const courseRating = holes === 18 ? course!.rating18 : course!.rating9;
      const slopeRating = holes === 18 ? course!.slope18 : course!.slope9;
      await addRound({
        courseName: course!.name,
        courseId: course!.id,
        courseRating, slopeRating,
        date, holes, score: finalScore, roundType,
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

      {/* Toolbar: map/scorecard toggle, holes, round type, date */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto">
        <div className="flex rounded-lg border border-border overflow-hidden flex-shrink-0">
          <button
            onClick={() => setShowMap(false)}
            className={`px-2.5 py-1 text-[10px] font-display tracking-wider ${!showMap ? 'bg-turf text-white' : 'text-ink-soft'}`}
          >
            SCORECARD
          </button>
          <button
            onClick={() => setShowMap(true)}
            disabled={!mapUrl}
            className={`px-2.5 py-1 text-[10px] font-display tracking-wider disabled:opacity-40 ${showMap ? 'bg-turf text-white' : 'text-ink-soft'}`}
          >
            MAP
          </button>
        </div>
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
      </div>

      {/* Map view */}
      {showMap && mapUrl && (
        <div className="w-full h-56 bg-paper">
          <iframe
            src={mapUrl}
            className="w-full h-full border-0"
            title={`Map of ${course.name}`}
            loading="lazy"
          />
          <div className="text-[9px] text-ink-muted text-center py-1">
            General course location — not a hole-by-hole routing map
          </div>
        </div>
      )}

      {/* Scorecard view */}
      {!showMap && (
        <div className="px-4 py-3">
          {holeDataLoading && (
            <div className="flex items-center gap-2 text-sm text-ink-soft py-4">
              <div className="w-4 h-4 border-2 border-turf/30 border-t-turf rounded-full animate-spin flex-shrink-0" />
              Loading scorecard…
            </div>
          )}

          {holeDataError && (
            <div className="text-xs text-gold bg-gold/10 px-3 py-2 rounded-lg mb-3">{holeDataError}</div>
          )}

          {holeData && !holeDataLoading && (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-muted font-display tracking-wider uppercase text-[9px]">
                    <th className="text-left py-1.5 px-1 w-7">H</th>
                    <th className="py-1.5 px-1 w-7">Par</th>
                    <th className="py-1.5 px-1 w-14 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {front9.map((h, i) => (
                    <tr key={h.holeNumber}>
                      <td className="py-1 px-1 font-display font-bold text-ink-soft text-[10px]">{h.holeNumber}</td>
                      <td className="py-1 px-1 text-center text-ink-soft">{h.par}</td>
                      <td className="py-1 px-1">
                        <input
                          type="number" min={1} max={15}
                          className={`w-12 text-center border rounded-md py-1 text-sm font-semibold outline-none focus:border-turf border-border bg-paper ${holeScoreColor(scores[i], h.par)}`}
                          value={scores[i] ?? ''}
                          onChange={(e) => setScore(i, e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-paper">
                    <td className="py-1.5 px-1 text-[10px] font-display tracking-wider text-ink-muted" colSpan={2}>
                      OUT · Par {front9Par}
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <span className={`text-sm font-bold stat-num ${front9Score > 0 ? holeScoreColor(front9Score, front9Par) : 'text-ink-muted'}`}>
                        {front9Score > 0 ? front9Score : '—'}
                      </span>
                    </td>
                  </tr>

                  {back9.map((h, i) => (
                    <tr key={h.holeNumber}>
                      <td className="py-1 px-1 font-display font-bold text-ink-soft text-[10px]">{h.holeNumber}</td>
                      <td className="py-1 px-1 text-center text-ink-soft">{h.par}</td>
                      <td className="py-1 px-1">
                        <input
                          type="number" min={1} max={15}
                          className={`w-12 text-center border rounded-md py-1 text-sm font-semibold outline-none focus:border-turf border-border bg-paper ${holeScoreColor(scores[9 + i], h.par)}`}
                          value={scores[9 + i] ?? ''}
                          onChange={(e) => setScore(9 + i, e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                  {back9.length > 0 && (
                    <tr className="bg-paper">
                      <td className="py-1.5 px-1 text-[10px] font-display tracking-wider text-ink-muted" colSpan={2}>
                        IN · Par {back9Par}
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        <span className={`text-sm font-bold stat-num ${back9Score > 0 ? holeScoreColor(back9Score, back9Par) : 'text-ink-muted'}`}>
                          {back9Score > 0 ? back9Score : '—'}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td className="py-2 px-1 text-[10px] font-display tracking-wider text-ink font-bold" colSpan={2}>
                      TOTAL · Par {front9Par + back9Par}
                    </td>
                    <td className="py-2 px-1 text-center">
                      <span className={`text-base font-extrabold stat-num ${runningTotal > 0 ? holeScoreColor(runningTotal, front9Par + back9Par) : 'text-ink-muted'}`}>
                        {runningTotal > 0 ? runningTotal : '—'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {!holeData && !holeDataLoading && (
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Total score</label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-turf bg-white"
                placeholder="e.g. 88"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
              />
            </div>
          )}

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
