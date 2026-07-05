'use client';
import React, { useState } from 'react';
import type { BagClub, BagSection } from '@/stores/bag';
import { SLOT_TO_SECTION } from '@/stores/bag';

interface Props {
  clubs: BagClub[];
  active: BagSection | null;
  onSelect: (s: BagSection) => void;
}

const SECTION_LABELS: Record<BagSection, string> = {
  woods: 'Woods', irons: 'Irons', wedges: 'Wedges', putter: 'Putter',
};

const SECTION_COLOR: Record<BagSection, string> = {
  woods: '#2F6B44', irons: '#3B7DC4', wedges: '#B8860B', putter: '#C2492E',
};

// Quadrant regions overlaid on the bag photo. Editing itself lives entirely
// in the section-detail sheet, so the image only needs a reasonable
// clickable zone per section — not pixel-perfect alignment to each club.
const REGIONS: Record<BagSection, { top: string; left: string; width: string; height: string }> = {
  wedges: { top: '0%',  left: '0%',  width: '50%', height: '50%' },
  irons:  { top: '50%', left: '0%',  width: '50%', height: '50%' },
  woods:  { top: '0%',  left: '50%', width: '50%', height: '50%' },
  putter: { top: '50%', left: '50%', width: '50%', height: '50%' },
};

export function StandBag({ clubs, active, onSelect }: Props) {
  const [zoomed, setZoomed] = useState(true);
  const sections = Object.keys(REGIONS) as BagSection[];

  const counts: Record<BagSection, number> = { woods: 0, irons: 0, wedges: 0, putter: 0 };
  for (const c of clubs) counts[SLOT_TO_SECTION[c.slot] ?? 'irons']++;

  function handleWheel(e: React.WheelEvent) {
    if (e.deltaY < -5) setZoomed(true);
    if (e.deltaY > 5) setZoomed(false);
  }

  return (
    <div className="w-full max-w-[340px] mx-auto">
      <div
        className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black select-none"
        style={{ boxShadow: '0 14px 32px rgba(0,0,0,0.35)' }}
        onWheel={handleWheel}
      >
        {/* Crossfaded full/closeup photos */}
        <img
          src="/bag/full.jpg"
          alt="Golf bag"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: zoomed ? 0 : 1 }}
        />
        <img
          src="/bag/closeup.jpg"
          alt="Golf bag clubs close-up"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: zoomed ? 1 : 0 }}
        />

        {/* Section click regions */}
        {sections.map((sect) => {
          const r = REGIONS[sect];
          const isActive = active === sect;
          return (
            <button
              key={sect}
              onClick={() => onSelect(sect)}
              aria-label={`${SECTION_LABELS[sect]} — ${counts[sect]} clubs`}
              className="absolute transition-colors"
              style={{
                top: r.top, left: r.left, width: r.width, height: r.height,
                backgroundColor: isActive ? SECTION_COLOR[sect] + '2A' : 'transparent',
                boxShadow: isActive ? `inset 0 0 0 2px ${SECTION_COLOR[sect]}` : 'inset 0 0 0 0px transparent',
              }}
            />
          );
        })}

        {/* Section badges, one per quadrant corner */}
        {sections.map((sect) => {
          const r = REGIONS[sect];
          const isActive = active === sect;
          const cornerStyle: React.CSSProperties = { position: 'absolute' };
          if (r.top === '0%') cornerStyle.top = 8; else cornerStyle.bottom = 8;
          if (r.left === '0%') cornerStyle.left = 8; else cornerStyle.right = 8;
          return (
            <div
              key={`badge-${sect}`}
              style={cornerStyle}
              className="pointer-events-none flex items-center gap-1.5 bg-black/55 backdrop-blur-sm rounded-lg px-2 py-1"
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: isActive ? SECTION_COLOR[sect] : '#8A929A' }}
              />
              <span className="text-[9px] font-display tracking-wider text-white/90 uppercase leading-none">
                {SECTION_LABELS[sect]}
              </span>
              <span className="text-[10px] font-display font-extrabold text-white stat-num leading-none">
                {counts[sect]}
              </span>
            </div>
          );
        })}

        {/* Zoom toggle */}
        <button
          onClick={() => setZoomed((z) => !z)}
          aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
          className="absolute top-1/2 right-2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          {zoomed ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9.3 9.3 L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M4 6h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M9.3 9.3 L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </div>

      <div className="text-[10px] text-ink-muted mt-2 text-center">
        Tap the zoom icon (or scroll) to zoom in/out · tap a quadrant to view clubs
      </div>
    </div>
  );
}
