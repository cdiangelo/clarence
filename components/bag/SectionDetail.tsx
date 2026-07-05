'use client';
import React, { useState } from 'react';
import type { BagSection, BagClub } from '@/stores/bag';
import { SLOT_ORDER } from '@/stores/bag';
import { CLUBS, IRON_SLOT_OFFSETS, CATEGORY_7I_CARRY, WEDGE_CARRY_BY_LOFT } from '@/data/clubs';
import { Button } from '@/components/ui/Button';

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

  const sorted = [...clubs].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));

  // Gapping analysis — distance gaps between consecutive clubs
  const withCarry = sorted
    .map((c) => ({ ...c, effectiveCarry: c.carry ?? resolveEstimatedCarry(c) }))
    .filter((c) => c.effectiveCarry != null) as (BagClub & { effectiveCarry: number })[];

  const gaps = withCarry.map((c, i) => {
    if (i === 0) return null;
    return withCarry[i - 1].effectiveCarry - c.effectiveCarry;
  });

  const avgGap = gaps.filter(Boolean).length > 0
    ? (gaps.filter(Boolean) as number[]).reduce((a, b) => a + b, 0) / gaps.filter(Boolean).length
    : null;

  function handleSaveCarry(id: string) {
    const val = parseInt(carryInput, 10);
    if (!isNaN(val) && val > 0) onUpdateCarry(id, val);
    setEditing(null);
    setCarryInput('');
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-elevated">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <span className="eyebrow">{SECTION_LABELS[section]}</span>
          <span className="ml-2 text-xs text-ink-soft stat-num">{clubs.length} clubs</span>
        </div>
        <button onClick={onClose} className="text-ink-muted hover:text-ink text-lg leading-none px-1">×</button>
      </div>

      {/* Club list */}
      <div className="divide-y divide-border">
        {sorted.map((club, i) => {
          const estimated = resolveEstimatedCarry(club);
          const carry = club.carry ?? estimated;
          const isEst = !club.carry;
          const gap = gaps[i];
          const isLargeGap = gap != null && avgGap != null && gap > avgGap * 1.4;

          return (
            <div key={club.id}>
              {isLargeGap && (
                <div className="px-4 py-1 bg-flag/5 text-[10px] text-flag font-display tracking-wider">
                  ⚠ GAP: {gap}YD
                </div>
              )}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-10 text-center">
                  <span className="text-[10px] font-display tracking-wider text-ink-soft">{club.slot.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">
                    {club.brand && club.model ? `${club.brand} ${club.model}` : club.slot}
                  </div>
                  {club.catalogId && (() => {
                    const cat = CLUBS.find((c) => c.id === club.catalogId);
                    return cat ? <div className="text-[10px] text-ink-muted">{cat.stockShaft}</div> : null;
                  })()}
                </div>
                {/* Carry */}
                <div className="text-right flex-shrink-0">
                  {editing === club.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-16 text-sm border border-turf rounded px-2 py-0.5 text-right outline-none"
                        value={carryInput}
                        onChange={(e) => setCarryInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCarry(club.id); if (e.key === 'Escape') setEditing(null); }}
                        autoFocus
                      />
                      <button onClick={() => handleSaveCarry(club.id)} className="text-turf text-xs font-semibold">✓</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditing(club.id); setCarryInput(String(carry ?? '')); }}
                      className="group text-right"
                    >
                      {carry != null ? (
                        <>
                          <div className="text-sm stat-num font-semibold text-ink group-hover:text-turf">
                            {carry}<span className="text-xs text-ink-muted ml-0.5">yd</span>
                          </div>
                          {isEst && <div className="text-[9px] text-ink-muted">~est</div>}
                        </>
                      ) : (
                        <div className="text-xs text-ink-muted group-hover:text-turf">+ carry</div>
                      )}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => onRemove(club.id)}
                  className="text-ink-muted hover:text-flag text-sm ml-1"
                  aria-label="Remove club"
                >×</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gapping summary */}
      {avgGap != null && withCarry.length >= 2 && (
        <div className="px-4 py-3 border-t border-border bg-paper/50 rounded-b-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="eyebrow">Avg Gap</span>
            <span className="stat-num font-semibold text-ink">{avgGap.toFixed(1)} yd</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="eyebrow">Range</span>
            <span className="stat-num text-ink-soft">
              {withCarry[withCarry.length - 1]?.effectiveCarry ?? '—'} – {withCarry[0]?.effectiveCarry ?? '—'} yd
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
