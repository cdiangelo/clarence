'use client';
import React from 'react';
import type { BagSection } from '@/stores/bag';

interface Props {
  counts: Record<BagSection, number>;
  active: BagSection | null;
  onSelect: (s: BagSection) => void;
}

// Bag body: tapers from wide at top to narrow at bottom
// Top (y=80): left=66, right=174  width=108
// Bottom (y=420): left=78, right=162  width=84
// leftX(y) = 66 + (y-80)/340 * 12    rightX(y) = 174 - (y-80)/340 * 12
function lx(y: number) { return 66 + ((y - 80) / 340) * 12; }
function rx(y: number) { return 174 - ((y - 80) / 340) * 12; }

// Section y-boundaries
const S = { woods: [80, 190], irons: [190, 300], wedges: [300, 380], putter: [380, 420] } as const;

const SECT_COLORS: Record<BagSection, { fill: string; stroke: string; label: string }> = {
  woods:  { fill: '#1E3D2B', stroke: '#2F6B44', label: 'WOODS' },
  irons:  { fill: '#2F6B44', stroke: '#4A8A5E', label: 'IRONS' },
  wedges: { fill: '#C4B48E', stroke: '#A89268', label: 'WEDGES' },
  putter: { fill: '#2C2F30', stroke: '#4A4E50', label: 'PUTTER' },
};

function sectionPath(top: number, bot: number) {
  return `M ${lx(top)} ${top} L ${rx(top)} ${top} L ${rx(bot)} ${bot} L ${lx(bot)} ${bot} Z`;
}

export function StandBag({ counts, active, onSelect }: Props) {
  const sections: BagSection[] = ['woods', 'irons', 'wedges', 'putter'];

  return (
    <svg viewBox="0 0 240 520" className="w-full max-w-[180px] select-none" aria-label="Golf bag">
      <defs>
        <filter id="bag-shadow" x="-10%" y="-5%" width="120%" height="115%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#23282A" floodOpacity="0.15" />
        </filter>
        <clipPath id="bag-body">
          <path d={`M ${lx(80)} 80 L ${rx(80)} 80 L ${rx(420)} 420 Q 120 438 ${lx(420)} 420 Z`} />
        </clipPath>
      </defs>

      {/* Stand legs */}
      <line x1="88" y1="395" x2="62" y2="490" stroke="#4A4E50" strokeWidth="6" strokeLinecap="round" />
      <line x1="152" y1="395" x2="178" y2="490" stroke="#4A4E50" strokeWidth="6" strokeLinecap="round" />
      <line x1="58" y1="490" x2="68" y2="490" stroke="#3A3E40" strokeWidth="5" strokeLinecap="round" />
      <line x1="172" y1="490" x2="182" y2="490" stroke="#3A3E40" strokeWidth="5" strokeLinecap="round" />

      {/* Bag sections */}
      {sections.map((sect) => {
        const [top, bot] = S[sect];
        const { fill, stroke, label } = SECT_COLORS[sect];
        const isActive = active === sect;
        const midY = (top + bot) / 2;
        const midX = (lx(midY) + rx(midY)) / 2;
        const w = rx(midY) - lx(midY);
        const cnt = counts[sect];

        return (
          <g
            key={sect}
            className="bag-sect"
            onClick={() => onSelect(sect)}
            role="button"
            aria-label={`${label} — ${cnt} clubs`}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(sect)}
          >
            {/* Fill */}
            <path
              d={sectionPath(top, bot)}
              fill={fill}
              stroke={isActive ? '#F7F6F1' : stroke}
              strokeWidth={isActive ? 2 : 1}
              opacity={isActive ? 1 : 0.92}
              filter={isActive ? 'url(#bag-shadow)' : undefined}
            />
            {/* Label */}
            <text
              x={midX - 16}
              y={midY + 1}
              textAnchor="middle"
              fill={sect === 'wedges' ? '#23282A' : '#F7F6F1'}
              fontSize={9}
              fontFamily="Archivo,sans-serif"
              fontWeight="800"
              letterSpacing="0.1em"
              dominantBaseline="middle"
            >{label}</text>
            {/* Count badge */}
            {cnt > 0 && (
              <g>
                <circle cx={midX + w * 0.28} cy={midY} r={9} fill={isActive ? '#2F6B44' : 'rgba(247,246,241,0.2)'} />
                <text
                  x={midX + w * 0.28}
                  y={midY + 0.5}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={sect === 'wedges' && !isActive ? '#23282A' : '#F7F6F1'}
                  fontSize={8.5}
                  fontFamily="Spline Sans Mono,monospace"
                  fontWeight="600"
                >{cnt}</text>
              </g>
            )}
            {/* Divider line */}
            {sect !== 'putter' && (
              <line
                x1={lx(bot)} y1={bot} x2={rx(bot)} y2={bot}
                stroke={stroke} strokeWidth={0.5} opacity={0.5}
              />
            )}
          </g>
        );
      })}

      {/* Bag outline */}
      <path
        d={`M ${lx(80)} 80 L ${rx(80)} 80 L ${rx(420)} 420 Q 120 438 ${lx(420)} 420 Z`}
        fill="none" stroke="#4A4E50" strokeWidth="1.5"
      />

      {/* Top hood */}
      <ellipse cx="120" cy="78" rx="56" ry="16" fill="#1A1C1E" />
      <ellipse cx="120" cy="75" rx="50" ry="12" fill="#0E1012" />

      {/* Club shafts sticking up */}
      {[-18, -10, -2, 6, 16, 26].map((offset, i) => (
        <line
          key={i}
          x1={120 + offset}
          y1={i % 2 === 0 ? 20 : 28}
          x2={120 + offset}
          y2={75}
          stroke="#9BA3A5"
          strokeWidth={1.5}
          strokeLinecap="round"
          opacity={0.5}
        />
      ))}

      {/* Strap */}
      <path d="M 152 120 Q 175 200 168 310" fill="none" stroke="#4A4E50" strokeWidth="5" strokeLinecap="round" opacity={0.4} />
      <path d="M 152 120 Q 175 200 168 310" fill="none" stroke="#6A6E70" strokeWidth="2" strokeLinecap="round" opacity={0.3} />

      {/* Side pocket */}
      <rect x="63" y="230" width="8" height="60" rx="4" fill="none" stroke="#4A4E50" strokeWidth="1.2" opacity={0.6} />
    </svg>
  );
}
