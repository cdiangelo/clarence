'use client';
import React, { useState } from 'react';
import { COURSES, type Course } from '@/data/courses';
import { Button } from '@/components/ui/Button';

interface Props {
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

export function QuickLog({ onSave, onCancel }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Course | null>(null);
  const [customName, setCustomName] = useState('');
  const [holes, setHoles] = useState<9 | 18>(18);
  const [score, setScore] = useState('');
  const [putts, setPutts] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Type-ahead search
  const matches: Course[] = query.length >= 2
    ? COURSES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  function selectCourse(c: Course) {
    setSelected(c);
    setQuery(c.name);
    // Auto-set holes to course default
    setHoles(c.holes === 9 ? 9 : 18);
  }

  const autoPar = selected ? (holes === 9 && selected.par ? Math.round(selected.par / 2) : selected.par) : null;

  async function handleSave() {
    const s = parseInt(score, 10);
    if (!selected && !customName.trim()) { setError('Enter a course name'); return; }
    if (isNaN(s) || s < 18) { setError('Enter a valid score'); return; }
    setSaving(true);
    try {
      await onSave({
        courseName: selected?.name ?? customName.trim(),
        courseId: selected?.id,
        courseRating: holes === 18 ? selected?.rating18 : selected?.rating9,
        slopeRating: holes === 18 ? selected?.slope18 : selected?.slope9,
        holes,
        score: s,
        putts: putts ? parseInt(putts, 10) : undefined,
        notes: notes.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="eyebrow text-turf mb-1">Quick Round Log</div>

      {/* Course search */}
      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1">Course</label>
        <div className="relative">
          <input
            type="text"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-turf bg-white"
            placeholder="Search courses…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          />
          {matches.length > 0 && !selected && (
            <div className="absolute z-10 w-full bg-card border border-border rounded-lg shadow-elevated mt-1 max-h-52 overflow-y-auto">
              {matches.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCourse(c)}
                  className="w-full text-left px-3 py-2.5 hover:bg-turf-wash transition-colors"
                >
                  <div className="text-sm font-medium text-ink">{c.name}</div>
                  <div className="text-[10px] text-ink-muted">{c.city}, {c.state} · Par {c.par} · {c.holes}H</div>
                </button>
              ))}
              <button
                onClick={() => { setSelected(null); setCustomName(query); setQuery(query); }}
                className="w-full text-left px-3 py-2.5 border-t border-border hover:bg-sand/40 text-xs text-ink-soft"
              >
                + Use "{query}" as custom course
              </button>
            </div>
          )}
        </div>
        {selected && (
          <div className="mt-1 text-xs text-ink-soft">
            Par {selected.par} · Rating {(holes === 18 ? selected.rating18 : selected.rating9)?.toFixed(1) ?? '—'} / Slope {(holes === 18 ? selected.slope18 : selected.slope9) ?? '—'}
            {!selected.verified && <span className="ml-1 text-gold">~approx</span>}
          </div>
        )}
      </div>

      {/* Holes */}
      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1">Holes</label>
        <div className="flex gap-2">
          {([9, 18] as const).map((h) => (
            <button key={h}
              onClick={() => setHoles(h)}
              className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors ${holes === h ? 'border-turf bg-turf-wash text-turf' : 'border-border text-ink-soft hover:border-turf/50'}`}
            >{h} holes</button>
          ))}
        </div>
      </div>

      {/* Score */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1">
            Score {autoPar ? <span className="text-ink-muted font-normal">(par {autoPar})</span> : null}
          </label>
          <input type="number" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-turf bg-white"
            placeholder="e.g. 86" value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1">Putts <span className="text-ink-muted font-normal">(opt)</span></label>
          <input type="number" className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-turf bg-white"
            placeholder="e.g. 32" value={putts} onChange={(e) => setPutts(e.target.value)} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1">Notes <span className="text-ink-muted font-normal">(opt)</span></label>
        <textarea className="w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-turf bg-white resize-none"
          placeholder="Conditions, highlights…" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-xs text-flag">{error}</p>}

      <div className="flex gap-2 pt-1">
        <Button label="Cancel" variant="ghost" onClick={onCancel} className="flex-1" />
        <Button label={saving ? 'Saving…' : 'Save Round'} variant="primary" onClick={handleSave} disabled={saving} className="flex-1" />
      </div>
    </div>
  );
}
