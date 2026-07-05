'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { HoleData } from '@/app/api/courses/[id]/holes/route';

export interface InitialCourse {
  id?: string;
  name: string;
  par?: number;
  rating18?: number;
  slope18?: number;
  rating9?: number;
  slope9?: number;
  holes?: 9 | 18;
  verified?: boolean;
}

interface SearchCourse {
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

type ScoringMode = 'aggregate' | 'by-hole';

interface Props {
  initialCourse?: InitialCourse;
  onSave: (data: {
    courseName: string;
    courseId?: string;
    courseRating?: number;
    slopeRating?: number;
    holes: 9 | 18;
    score: number;
    putts?: number;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function QuickLog({ initialCourse, onSave, onCancel }: Props) {
  // Course selection
  const [query, setQuery] = useState(initialCourse?.name ?? '');
  const [results, setResults] = useState<SearchCourse[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<InitialCourse | null>(initialCourse ?? null);
  const [customName, setCustomName] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Round settings
  const [holes, setHoles] = useState<9 | 18>(initialCourse?.holes ?? 18);

  // Scoring mode
  const [mode, setMode] = useState<ScoringMode>('aggregate');
  const [holeData, setHoleData] = useState<HoleData[] | null>(null);
  const [holeDataLoading, setHoleDataLoading] = useState(false);
  const [holeDataError, setHoleDataError] = useState('');

  // Per-hole scores
  const [holeScores, setHoleScores] = useState<(number | '')[]>([]);
  const [holePutts, setHolePutts] = useState<(number | '')[]>([]);

  // Aggregate
  const [score, setScore] = useState('');
  const [putts, setPutts] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Debounced course search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (selected || query.length < 2) { setResults([]); return; }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/courses?q=${encodeURIComponent(query)}`);
        const data = await res.json() as { courses?: SearchCourse[] };
        setResults(data.courses ?? []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, selected]);

  // Fetch hole data when switching to by-hole mode
  const fetchHoles = useCallback(async (courseId: string) => {
    setHoleDataLoading(true);
    setHoleDataError('');
    try {
      const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/holes`);
      const data = await res.json() as { holes: HoleData[]; message?: string };
      const relevant = data.holes.filter((h) => h.holeNumber <= holes);
      if (relevant.length < (holes === 9 ? 9 : 18)) {
        setHoleDataError('No complete scorecard available — using total score instead.');
        setMode('aggregate');
        setHoleData(null);
      } else {
        setHoleData(relevant.slice(0, holes));
        setHoleScores(Array(holes).fill(''));
        setHolePutts(Array(holes).fill(''));
      }
    } catch {
      setHoleDataError('Could not load scorecard — using total score instead.');
      setMode('aggregate');
    } finally {
      setHoleDataLoading(false);
    }
  }, [holes]);

  function selectCourse(c: SearchCourse) {
    setSelected(c);
    setQuery(c.name);
    setResults([]);
    setHoles(c.holes);
    setHoleData(null);
    setMode('aggregate');
  }

  function useCustomName() {
    setSelected({ name: query });
    setResults([]);
    setCustomName(query);
    setMode('aggregate');
  }

  function handleModeSelect(m: ScoringMode) {
    if (m === 'by-hole' && selected?.id) {
      setMode('by-hole');
      if (!holeData) fetchHoles(selected.id);
    } else {
      setMode('aggregate');
    }
  }

  function setHoleScore(i: number, val: string) {
    setHoleScores((prev) => { const n = [...prev]; n[i] = val === '' ? '' : Number(val); return n; });
  }

  function setHolePutt(i: number, val: string) {
    setHolePutts((prev) => { const n = [...prev]; n[i] = val === '' ? '' : Number(val); return n; });
  }

  const enteredScores = holeScores.filter((s) => s !== '').map(Number);
  const runningTotal = enteredScores.reduce((a, b) => a + b, 0);
  const allHolesEntered = holeScores.length === holes && holeScores.every((s) => s !== '' && Number(s) > 0);

  const enteredPutts = holePutts.filter((p) => p !== '').map(Number);
  const totalPutts = allHolesEntered && holePutts.every((p) => p !== '') ? enteredPutts.reduce((a, b) => a + b, 0) : undefined;

  const courseForSave = selected ?? (customName ? { name: customName } : null);
  const courseRating = holes === 18 ? courseForSave?.rating18 : courseForSave?.rating9;
  const slopeRating = holes === 18 ? courseForSave?.slope18 : courseForSave?.slope9;

  async function handleSave() {
    if (!courseForSave?.name) { setError('Select or enter a course'); return; }

    let finalScore: number;
    let finalPutts: number | undefined;

    if (mode === 'by-hole') {
      if (!allHolesEntered) { setError('Enter a score for every hole'); return; }
      finalScore = runningTotal;
      finalPutts = totalPutts;
    } else {
      const s = parseInt(score, 10);
      if (isNaN(s) || s < 1) { setError('Enter a valid score'); return; }
      finalScore = s;
      finalPutts = putts ? parseInt(putts, 10) : undefined;
    }

    setError('');
    setSaving(true);
    try {
      await onSave({
        courseName: courseForSave.name,
        courseId: courseForSave.id,
        courseRating,
        slopeRating,
        holes,
        score: finalScore,
        putts: finalPutts,
        notes: notes.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setSaving(false);
    }
  }

  const parForHoles = selected?.par
    ? (holes === 9 ? Math.round(selected.par / 2) : selected.par)
    : null;

  // Per-hole color coding
  function holeScoreColor(score: number | '', par: number): string {
    if (score === '' || score === 0) return 'text-ink';
    const diff = Number(score) - par;
    if (diff <= -1) return 'text-turf font-bold';
    if (diff === 0) return 'text-ink-soft';
    if (diff === 1) return 'text-gold';
    return 'text-flag';
  }

  // Split holes into front/back 9
  const front9 = holeData?.slice(0, 9) ?? [];
  const back9 = holeData?.slice(9, 18) ?? [];
  const front9Par = front9.reduce((s, h) => s + h.par, 0);
  const back9Par = back9.reduce((s, h) => s + h.par, 0);
  const front9Score = holeScores.slice(0, 9).filter((s) => s !== '').reduce((a, b) => a + Number(b), 0);
  const back9Score = holeScores.slice(9, 18).filter((s) => s !== '').reduce((a, b) => a + Number(b), 0);

  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="eyebrow text-turf">Log Round</div>
        <button
          onClick={onCancel}
          className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-ink-muted hover:text-ink"
        >
          ×
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* ── Course search ── */}
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Course</label>
          <div className="relative">
            <input
              type="text"
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-turf bg-white"
              placeholder="Search by name or city…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); setHoleData(null); setMode('aggregate'); }}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-3.5 h-3.5 border-2 border-turf/30 border-t-turf rounded-full animate-spin" />
              </div>
            )}
            {results.length > 0 && !selected && (
              <div className="absolute z-20 w-full bg-card border border-border rounded-lg shadow-elevated mt-1 max-h-52 overflow-y-auto">
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectCourse(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-turf-wash transition-colors border-b border-border/50 last:border-0"
                  >
                    <div className="text-sm font-medium text-ink">{c.name}</div>
                    <div className="text-[10px] text-ink-muted">
                      {c.city}, {c.state} · Par {c.par} · {c.holes}H
                      {c.rating18 ? ` · ${c.rating18}/${c.slope18}` : ''}
                      {!c.verified ? ' ~approx' : ''}
                    </div>
                  </button>
                ))}
                <button
                  onClick={useCustomName}
                  className="w-full text-left px-3 py-2.5 hover:bg-sand/40 text-xs text-ink-soft"
                >
                  + Use &ldquo;{query}&rdquo; as custom course
                </button>
              </div>
            )}
          </div>
          {selected && (
            <div className="mt-1 flex items-center justify-between">
              <div className="text-[10px] text-ink-soft">
                {parForHoles ? `Par ${parForHoles}` : ''}
                {courseRating ? ` · Rating ${courseRating.toFixed(1)}` : ''}
                {slopeRating ? ` / Slope ${slopeRating}` : ''}
                {selected.verified === false ? <span className="ml-1 text-gold">~approx</span> : ''}
              </div>
              <button
                onClick={() => { setSelected(null); setQuery(''); setHoleData(null); setMode('aggregate'); }}
                className="text-[10px] text-ink-muted hover:text-flag"
              >
                change
              </button>
            </div>
          )}
        </div>

        {/* ── Holes selector ── */}
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Holes played</label>
          <div className="flex gap-2">
            {([9, 18] as const).map((h) => (
              <button
                key={h}
                onClick={() => { setHoles(h); setHoleData(null); setMode('aggregate'); }}
                className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  holes === h
                    ? 'border-turf bg-turf-wash text-turf'
                    : 'border-border text-ink-soft hover:border-turf/50'
                }`}
              >
                {h} holes
              </button>
            ))}
          </div>
        </div>

        {/* ── Scoring mode ── */}
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">Scoring</label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('aggregate')}
              className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                mode === 'aggregate'
                  ? 'border-turf bg-turf-wash text-turf'
                  : 'border-border text-ink-soft hover:border-turf/50'
              }`}
            >
              Total Score
            </button>
            <button
              onClick={() => handleModeSelect('by-hole')}
              disabled={!selected?.id}
              className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                mode === 'by-hole'
                  ? 'border-turf bg-turf-wash text-turf'
                  : !selected?.id
                  ? 'border-border text-ink-muted cursor-not-allowed opacity-50'
                  : 'border-border text-ink-soft hover:border-turf/50'
              }`}
            >
              By Hole
            </button>
          </div>
          {!selected?.id && (
            <div className="text-[10px] text-ink-muted mt-1">Select a course to enable hole-by-hole scoring</div>
          )}
        </div>

        {/* ── Hole data loading / error ── */}
        {holeDataLoading && (
          <div className="flex items-center gap-2 text-sm text-ink-soft py-2">
            <div className="w-4 h-4 border-2 border-turf/30 border-t-turf rounded-full animate-spin flex-shrink-0" />
            Loading scorecard…
          </div>
        )}
        {holeDataError && (
          <div className="text-xs text-gold bg-gold/10 px-3 py-2 rounded-lg">{holeDataError}</div>
        )}

        {/* ── By-hole scorecard ── */}
        {mode === 'by-hole' && holeData && !holeDataLoading && (
          <div>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-ink-muted font-display tracking-wider uppercase text-[9px]">
                    <th className="text-left py-1.5 px-1 w-7">H</th>
                    <th className="py-1.5 px-1 w-7">Par</th>
                    {holeData.some((h) => h.yardsBlue ?? h.yardsWhite) && (
                      <th className="py-1.5 px-1 w-10 text-right">Yds</th>
                    )}
                    <th className="py-1.5 px-1 w-14 text-center">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {front9.map((h, i) => (
                    <tr key={h.holeNumber}>
                      <td className="py-1 px-1 font-display font-bold text-ink-soft text-[10px]">{h.holeNumber}</td>
                      <td className="py-1 px-1 text-center text-ink-soft">{h.par}</td>
                      {holeData.some((hh) => hh.yardsBlue ?? hh.yardsWhite) && (
                        <td className="py-1 px-1 text-right text-ink-muted">
                          {(h.yardsBlue ?? h.yardsWhite) ?? '—'}
                        </td>
                      )}
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          min={1}
                          max={15}
                          className={`w-12 text-center border rounded-md py-1 text-sm font-semibold outline-none focus:border-turf ${
                            holeScores[i] !== ''
                              ? holeScoreColor(holeScores[i], h.par)
                              : 'text-ink'
                          } border-border bg-paper`}
                          value={holeScores[i] ?? ''}
                          onChange={(e) => setHoleScore(i, e.target.value)}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                  {/* Front 9 subtotal */}
                  <tr className="bg-paper">
                    <td className="py-1.5 px-1 text-[10px] font-display tracking-wider text-ink-muted" colSpan={holeData.some((h) => h.yardsBlue ?? h.yardsWhite) ? 3 : 2}>
                      OUT · Par {front9Par}
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <span className={`text-sm font-bold stat-num ${front9Score > 0 ? holeScoreColor(front9Score, front9Par) : 'text-ink-muted'}`}>
                        {front9Score > 0 ? front9Score : '—'}
                      </span>
                    </td>
                  </tr>

                  {/* Back 9 */}
                  {back9.map((h, i) => (
                    <tr key={h.holeNumber}>
                      <td className="py-1 px-1 font-display font-bold text-ink-soft text-[10px]">{h.holeNumber}</td>
                      <td className="py-1 px-1 text-center text-ink-soft">{h.par}</td>
                      {holeData.some((hh) => hh.yardsBlue ?? hh.yardsWhite) && (
                        <td className="py-1 px-1 text-right text-ink-muted">
                          {(h.yardsBlue ?? h.yardsWhite) ?? '—'}
                        </td>
                      )}
                      <td className="py-1 px-1">
                        <input
                          type="number"
                          min={1}
                          max={15}
                          className={`w-12 text-center border rounded-md py-1 text-sm font-semibold outline-none focus:border-turf ${
                            holeScores[9 + i] !== ''
                              ? holeScoreColor(holeScores[9 + i], h.par)
                              : 'text-ink'
                          } border-border bg-paper`}
                          value={holeScores[9 + i] ?? ''}
                          onChange={(e) => setHoleScore(9 + i, e.target.value)}
                          placeholder="—"
                        />
                      </td>
                    </tr>
                  ))}
                  {/* Back 9 / total row */}
                  {back9.length > 0 && (
                    <tr className="bg-paper">
                      <td className="py-1.5 px-1 text-[10px] font-display tracking-wider text-ink-muted" colSpan={holeData.some((h) => h.yardsBlue ?? h.yardsWhite) ? 3 : 2}>
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
                    <td className="py-2 px-1 text-[10px] font-display tracking-wider text-ink font-bold" colSpan={holeData.some((h) => h.yardsBlue ?? h.yardsWhite) ? 3 : 2}>
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
          </div>
        )}

        {/* ── Aggregate score ── */}
        {mode === 'aggregate' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                Score {parForHoles ? <span className="text-ink-muted font-normal">(par {parForHoles})</span> : ''}
              </label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-turf bg-white"
                placeholder="e.g. 86"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                Putts <span className="text-ink-muted font-normal">(opt)</span>
              </label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-turf bg-white"
                placeholder="e.g. 32"
                value={putts}
                onChange={(e) => setPutts(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Notes ── */}
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">
            Notes <span className="text-ink-muted font-normal">(optional)</span>
          </label>
          <textarea
            className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-turf bg-white resize-none"
            placeholder="Conditions, highlights…"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-flag">{error}</p>}

        {/* ── Actions ── */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 border border-border text-ink-soft text-sm font-semibold py-2.5 rounded-xl hover:border-turf/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || holeDataLoading}
            className="flex-1 bg-turf text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 hover:bg-turf-light transition-colors"
          >
            {saving ? 'Saving…' : 'Save Round'}
          </button>
        </div>
      </div>
    </div>
  );
}
