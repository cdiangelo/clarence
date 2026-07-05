'use client';
import React, { useState } from 'react';
import type { BagSection, BagClub } from '@/stores/bag';
import { SLOT_ORDER } from '@/stores/bag';
import { CLUBS, IRON_SLOT_OFFSETS, WEDGE_CARRY_BY_LOFT } from '@/data/clubs';

interface Props {
  section: BagSection | null;
  clubs: BagClub[];
  onClose: () => void;
  onUpdateCarry: (id: string, carry: number) => void;
  onRemove: (id: string) => void;
}

const SECTION_LABELS: Record<BagSection, string> = {
  woods: 'Woods & Hybrids', irons: 'Irons', wedges: 'Wedges', putter: 'Putter',
};

const SECTION_ACCENT: Record<BagSection, string> = {
  woods: '#2F6B44', irons: '#3B7DC4', wedges: '#B8860B', putter: '#C2492E',
};

const SECTION_WASH: Record<BagSection, string> = {
  woods: '#E8F0E9', irons: '#E4EEF8', wedges: '#F5EDD4', putter: '#F5E8E4',
};

function resolveEstimatedCarry(club: BagClub): number | null {
  if (club.carry) return club.carry;
  if (!club.catalogId) return null;
  const cat = CLUBS.find((c) => c.id === club.catalogId);
  if (!cat) return null;
  if (cat.type === 'iron' && cat.carryBase) {
    const offset = IRON_SLOT_OFFSETS[club.slot] ?? 0;
    return cat.carryBase + offset;
  }
  if (cat.type === 'wedge' && cat.stockLoft) {
    return WEDGE_CARRY_BY_LOFT[cat.stockLoft] ?? cat.carryBase ?? null;
  }
  return cat.carryBase ?? null;
}

export function SectionDetail({ section, clubs, onClose, onUpdateCarry, onRemove }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [carryInput, setCarryInput] = useState('');

  if (!section) return null;

  const accent = SECTION_ACCENT[section];
  const wash = SECTION_WASH[section];

  const sorted = [...clubs].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

  const withCarry = sorted.map((c) => ({
    ...c,
    effectiveCarry: c.carry ?? resolveEstimatedCarry(c),
  }));

  const carries = withCarry
    .map((c) => c.effectiveCarry)
    .filter((v): v is number => v != null);
  const maxCarry = carries.length > 0 ? Math.max(...carries) : 0;
  const minCarry = carries.length > 0 ? Math.min(...carries) : 0;

  const gaps = withCarry.map((c, i) => {
    if (i === 0) return null;
    const prev = withCarry[i - 1].effectiveCarry;
    const curr = c.effectiveCarry;
    if (prev == null || curr == null) return null;
    return prev - curr;
  });

  const numericGaps = gaps.filter((g): g is number => g != null);
  const avgGap =
    numericGaps.length > 0
      ? numericGaps.reduce((a, b) => a + b, 0) / numericGaps.length
      : null;

  function handleSaveCarry(id: string) {
    const val = parseInt(carryInput, 10);
    if (!isNaN(val) && val > 0) onUpdateCarry(id, val);
    setEditing(null);
    setCarryInput('');
  }

  return (
    <div
      className="bg-card rounded-t-2xl"
      style={{ maxHeight: '68vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div className="w-9 h-1 rounded-full bg-border" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accent }} />
          <span className="font-display font-extrabold text-sm tracking-wider text-ink uppercase">
            {SECTION_LABELS[section]}
          </span>
          <span className="text-xs text-ink-muted stat-num ml-0.5">{clubs.length}</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-ink-muted hover:text-ink hover:bg-sand transition-colors text-base leading-none"
        >
          ×
        </button>
      </div>

      {/* Scrollable club list */}
      <div className="overflow-y-auto flex-1 px-4 py-2">
        {sorted.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-sm text-ink-muted">No clubs in this section</div>
            <div className="text-[10px] text-ink-muted mt-1">Tap + ADD CLUB to get started</div>
          </div>
        )}

        {withCarry.map((club, i) => {
          const carry = club.effectiveCarry;
          const isEst = !club.carry && carry != null;
          const gap = gaps[i];
          const isLargeGap = gap != null && avgGap != null && gap > avgGap * 1.4;
          const barWidth = carry != null && maxCarry > 0 ? (carry / maxCarry) * 100 : 0;
          const cat = club.catalogId ? CLUBS.find((c) => c.id === club.catalogId) : null;

          return (
            <div key={club.id}>
              {/* Gap indicator */}
              {gap != null && i > 0 && (
                <div className="flex items-center gap-2 py-1.5 px-1">
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: isLargeGap ? '#C2492E22' : '#E2E0D8' }}
                  />
                  <span
                    className="text-[9px] font-display tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      color: isLargeGap ? '#C2492E' : '#9BA3A5',
                      backgroundColor: isLargeGap ? '#F5E8E4' : 'transparent',
                    }}
                  >
                    {isLargeGap ? '⚠ ' : ''}{gap} YD
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ backgroundColor: isLargeGap ? '#C2492E22' : '#E2E0D8' }}
                  />
                </div>
              )}

              {/* Club card */}
              <div className="flex items-center gap-3 py-2 group">
                {/* Slot pill */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: wash }}
                >
                  <span
                    className="text-[11px] font-display font-extrabold tracking-wide"
                    style={{ color: accent }}
                  >
                    {club.slot.toUpperCase()}
                  </span>
                </div>

                {/* Club info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink truncate leading-tight">
                    {club.brand && club.model
                      ? `${club.brand} ${club.model}`
                      : `${club.slot.toUpperCase()} Club`}
                  </div>
                  <div className="text-[10px] text-ink-muted mt-0.5 truncate">
                    {cat?.stockShaft ?? 'Generic'}
                  </div>
                  {/* Distance bar */}
                  {carry != null && maxCarry > 0 && (
                    <div className="mt-1.5 h-1 rounded-full bg-border overflow-hidden w-full max-w-[96px]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${barWidth}%`, backgroundColor: accent + 'B0' }}
                      />
                    </div>
                  )}
                </div>

                {/* Carry / edit */}
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  {editing === club.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-16 text-sm border border-turf rounded-lg px-2 py-1 text-right outline-none bg-white"
                        value={carryInput}
                        onChange={(e) => setCarryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveCarry(club.id);
                          if (e.key === 'Escape') { setEditing(null); setCarryInput(''); }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveCarry(club.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-turf text-white text-xs font-semibold"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing(club.id); setCarryInput(String(carry ?? '')); }}
                      className="text-right min-w-[44px]"
                    >
                      {carry != null ? (
                        <div>
                          <div className="text-base font-extrabold stat-num text-ink leading-tight">
                            {carry}
                          </div>
                          <div className="text-[9px] leading-none" style={{ color: isEst ? '#9BA3A5' : accent }}>
                            {isEst ? '~est' : 'yd'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-ink-muted hover:text-turf transition-colors">
                          + carry
                        </div>
                      )}
                    </button>
                  )}

                  {/* Remove button — subtle, hover to reveal */}
                  <button
                    onClick={() => onRemove(club.id)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-ink-muted hover:text-flag hover:bg-flag/10 transition-all opacity-30 group-hover:opacity-80 text-sm"
                    aria-label="Remove club"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gapping footer */}
      {avgGap != null && carries.length >= 2 && (
        <div className="flex-shrink-0 border-t border-border px-5 py-3 rounded-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[9px] font-display tracking-wider text-ink-muted uppercase">
                  Avg Gap
                </div>
                <div className="text-sm font-extrabold stat-num" style={{ color: accent }}>
                  {avgGap.toFixed(1)} yd
                </div>
              </div>
              <div className="w-px h-6 bg-border" />
              <div>
                <div className="text-[9px] font-display tracking-wider text-ink-muted uppercase">
                  Range
                </div>
                <div className="text-sm font-extrabold stat-num text-ink">
                  {minCarry} – {maxCarry} yd
                </div>
              </div>
            </div>
            {numericGaps.some((g) => avgGap != null && g > avgGap * 1.4) && (
              <div className="text-[9px] font-display tracking-wider text-flag bg-flag/10 px-2 py-1 rounded-lg">
                GAP WARNING
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
