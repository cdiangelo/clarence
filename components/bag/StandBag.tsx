'use client';
import React from 'react';
import type { BagClub, BagSection } from '@/stores/bag';
import { SLOT_TO_SECTION, SLOT_ORDER } from '@/stores/bag';

interface Props {
  clubs: BagClub[];
  active: BagSection | null;
  onSelect: (s: BagSection) => void;
}

// ── Top-down POV: looking down into the bag's 14-way top opening ──
// viewBox: 0 0 360 360
const CX = 180;
const CY = 180;

const WALL_RX = 130;
const WALL_RY = 100;
const RIM_RX = 98;
const RIM_RY = 72;
const CLUB_RX = RIM_RX * 0.66;
const CLUB_RY = RIM_RY * 0.66;
const TAB_RX = 150;
const TAB_RY = 120;

// Slice boundaries in degrees, clockwise from top (0deg = 12 o'clock)
const BOUNDS: Record<BagSection, [number, number]> = {
  woods:  [0, 60],
  irons:  [60, 210],
  wedges: [210, 300],
  putter: [300, 360],
};

const SECTION_LABELS: Record<BagSection, string> = {
  woods: 'WOODS', irons: 'IRONS', wedges: 'WEDGES', putter: 'PUTTER',
};

const SECTION_COLOR: Record<BagSection, string> = {
  woods: '#2F6B44', irons: '#3B7DC4', wedges: '#B8860B', putter: '#C2492E',
};

const SECTION_ACCENT: Record<BagSection, string> = {
  woods: '#4A8A5E', irons: '#5A97D4', wedges: '#D4A820', putter: '#D86A52',
};

type ClubShape = 'driver' | 'fairway' | 'hybrid' | 'iron' | 'wedge' | 'putter';

function clubShape(slot: string): ClubShape {
  if (slot === 'driver') return 'driver';
  if (['3w', '5w', '7w'].includes(slot)) return 'fairway';
  if (['3h', '4h', '5h'].includes(slot)) return 'hybrid';
  if (slot === 'putter') return 'putter';
  if (/^\d+i$/.test(slot) || slot === 'PW') return 'iron';
  return 'wedge';
}

// Local-space silhouettes: drawn pointing toward -y (outward, toward the rim);
// the hosel/heel end (toward +y) faces the center hub after rotation.
const HEAD_PATHS: Record<ClubShape, string> = {
  driver:  'M 0,-16 C 9,-16 11.5,-9 11.5,-2 C 11.5,7 6,13.5 0,15.5 C -6,13.5 -11.5,7 -11.5,-2 C -11.5,-9 -9,-16 0,-16 Z',
  fairway: 'M 0,-11.5 C 6.5,-11.5 8.5,-6.5 8.5,-1 C 8.5,5 4.5,9 0,10.5 C -4.5,9 -8.5,5 -8.5,-1 C -8.5,-6.5 -6.5,-11.5 0,-11.5 Z',
  hybrid:  'M 0,-8.5 C 6,-8.5 7.5,-4.5 7.5,0 C 7.5,5 4,7.5 0,8.5 C -4,7.5 -7.5,5 -7.5,0 C -7.5,-4.5 -6,-8.5 0,-8.5 Z',
  iron:    'M 0,-9.5 C 3,-9.5 3.6,-6.5 3.6,-2.5 L 3.6,4 C 3.6,7 2,8.5 0,9 C -2,8.5 -3.6,7 -3.6,4 L -3.6,-2.5 C -3.6,-6.5 -3,-9.5 0,-9.5 Z',
  wedge:   'M 0,-8 C 3.3,-8 4.2,-5.3 4.2,-1.5 L 4.2,3 C 4.2,6 2.3,7.5 0,8 C -2.3,7.5 -4.2,6 -4.2,3 L -4.2,-1.5 C -4.2,-5.3 -3.3,-8 0,-8 Z',
  putter:  'M -6,-8 Q -6,-9.3 -4.7,-9.3 L 4.7,-9.3 Q 6,-9.3 6,-8 L 6,6.5 Q 6,8.5 4,8.5 L -4,8.5 Q -6,8.5 -6,6.5 Z',
};

const HEAD_GRADIENT: Record<ClubShape, string> = {
  driver: 'url(#g-driverhead)', fairway: 'url(#g-woodhead)', hybrid: 'url(#g-woodhead)',
  iron: 'url(#g-ironhead)', wedge: 'url(#g-wedgehead)', putter: 'url(#g-putterhead)',
};

function polar(rx: number, ry: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + rx * Math.sin(rad), y: CY - ry * Math.cos(rad) };
}

function slicePath(a0: number, a1: number, rx: number, ry: number) {
  const p0 = polar(rx, ry, a0);
  const p1 = polar(rx, ry, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${CX},${CY} L ${p0.x},${p0.y} A ${rx},${ry} 0 ${large} 1 ${p1.x},${p1.y} Z`;
}

function clubPositions(a0: number, a1: number, n: number): number[] {
  if (n <= 0) return [];
  const pad = Math.min(10, (a1 - a0) / 4);
  const lo = a0 + pad;
  const hi = a1 - pad;
  if (n === 1) return [(lo + hi) / 2];
  return Array.from({ length: n }, (_, i) => lo + (i * (hi - lo)) / (n - 1));
}

export function StandBag({ clubs, active, onSelect }: Props) {
  const sections = Object.keys(BOUNDS) as BagSection[];

  const bySection: Record<BagSection, BagClub[]> = { woods: [], irons: [], wedges: [], putter: [] };
  for (const c of clubs) {
    bySection[SLOT_TO_SECTION[c.slot] ?? 'irons'].push(c);
  }
  for (const s of sections) {
    bySection[s].sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot));
  }
  const counts: Record<BagSection, number> = {
    woods: bySection.woods.length, irons: bySection.irons.length,
    wedges: bySection.wedges.length, putter: bySection.putter.length,
  };

  return (
    <svg
      viewBox="0 0 360 360"
      className="w-full max-w-[300px] select-none"
      style={{ filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.5))' }}
      aria-label="Golf bag — top-down view"
    >
      <defs>
        <radialGradient id="g-walltop" cx="48%" cy="42%" r="65%">
          <stop offset="0%"  stopColor="#262C32"/>
          <stop offset="55%" stopColor="#171B1F"/>
          <stop offset="100%" stopColor="#2E363C"/>
        </radialGradient>

        <radialGradient id="g-interior" cx="50%" cy="56%" r="72%">
          <stop offset="0%"   stopColor="#05070A"/>
          <stop offset="60%"  stopColor="#0D1114"/>
          <stop offset="100%" stopColor="#1C2228"/>
        </radialGradient>

        <radialGradient id="g-hub" cx="38%" cy="34%" r="65%">
          <stop offset="0%"   stopColor="#565F66"/>
          <stop offset="100%" stopColor="#1A1E22"/>
        </radialGradient>

        {/* Clubhead material gradients — distinct finishes per type */}
        <radialGradient id="g-driverhead" cx="34%" cy="28%" r="75%">
          <stop offset="0%"   stopColor="#454B51"/>
          <stop offset="45%"  stopColor="#22262A"/>
          <stop offset="100%" stopColor="#0A0C0E"/>
        </radialGradient>
        <radialGradient id="g-woodhead" cx="34%" cy="28%" r="75%">
          <stop offset="0%"   stopColor="#EEF2F4"/>
          <stop offset="45%"  stopColor="#AAB3B9"/>
          <stop offset="100%" stopColor="#5C646A"/>
        </radialGradient>
        <radialGradient id="g-ironhead" cx="34%" cy="28%" r="75%">
          <stop offset="0%"   stopColor="#F1F4F5"/>
          <stop offset="45%"  stopColor="#C4CCD0"/>
          <stop offset="100%" stopColor="#7C848A"/>
        </radialGradient>
        <radialGradient id="g-wedgehead" cx="34%" cy="28%" r="75%">
          <stop offset="0%"   stopColor="#8C8072"/>
          <stop offset="45%"  stopColor="#5D5347"/>
          <stop offset="100%" stopColor="#33291F"/>
        </radialGradient>
        <radialGradient id="g-putterhead" cx="34%" cy="28%" r="75%">
          <stop offset="0%"   stopColor="#4E5256"/>
          <stop offset="45%"  stopColor="#282B2E"/>
          <stop offset="100%" stopColor="#101214"/>
        </radialGradient>

        <clipPath id="clip-wall"><ellipse cx={CX} cy={CY} rx={WALL_RX} ry={WALL_RY}/></clipPath>
        <clipPath id="clip-rim"><ellipse cx={CX} cy={CY} rx={RIM_RX} ry={RIM_RY}/></clipPath>

        <filter id="f-texture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" result="n"/>
          <feColorMatrix in="n" type="saturate" values="0" result="g"/>
          <feBlend in="SourceGraphic" in2="g" mode="multiply" result="b"/>
          <feBlend in="SourceGraphic" in2="b" mode="screen" k2="0.96" k3="0.04"/>
        </filter>
      </defs>

      {/* ── Outer fabric wall ── */}
      <ellipse cx={CX} cy={CY} rx={WALL_RX} ry={WALL_RY} fill="url(#g-walltop)"/>
      <g clipPath="url(#clip-wall)" opacity="0.05">
        <rect x="0" y="0" width="360" height="360" fill="#fff" filter="url(#f-texture)"/>
      </g>
      <path
        d={`M ${polar(WALL_RX - 8, WALL_RY - 8, 300).x},${polar(WALL_RX - 8, WALL_RY - 8, 300).y}
            A ${WALL_RX - 8},${WALL_RY - 8} 0 0 1 ${polar(WALL_RX - 8, WALL_RY - 8, 40).x},${polar(WALL_RX - 8, WALL_RY - 8, 40).y}`}
        fill="none" stroke="#fff" strokeWidth="3" opacity="0.06" strokeLinecap="round"
      />

      {/* ── Inner opening (tube interior) ── */}
      <ellipse cx={CX} cy={CY} rx={RIM_RX} ry={RIM_RY} fill="url(#g-interior)"/>
      <ellipse cx={CX} cy={CY} rx={RIM_RX} ry={RIM_RY} fill="none" stroke="#40484E" strokeWidth="1.4" opacity="0.7"/>
      <ellipse cx={CX} cy={CY} rx={WALL_RX} ry={WALL_RY} fill="none" stroke="#3A4248" strokeWidth="1.2" opacity="0.5"/>

      {/* ── Section tint + dividers (behind clubheads) ── */}
      <g clipPath="url(#clip-rim)">
        {sections.map((sect) => {
          const [a0, a1] = BOUNDS[sect];
          const isActive = active === sect;
          return (
            <path
              key={`fill-${sect}`}
              d={slicePath(a0, a1, RIM_RX, RIM_RY)}
              fill={isActive ? SECTION_COLOR[sect] : 'transparent'}
              opacity={isActive ? 0.2 : 0}
              style={{ transition: 'opacity 0.25s' }}
            />
          );
        })}
      </g>

      {([0, 60, 210, 300] as number[]).map((deg) => {
        const inner = polar(16, 12, deg);
        const outer = polar(RIM_RX, RIM_RY, deg);
        return (
          <g key={deg}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#0B0D0F" strokeWidth="3" strokeLinecap="round"/>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#4A5258" strokeWidth="1" strokeLinecap="round" opacity="0.4"
              transform={`rotate(0.7 ${CX} ${CY})`}/>
          </g>
        );
      })}

      {active && (
        <g clipPath="url(#clip-rim)">
          <path
            d={slicePath(...BOUNDS[active], RIM_RX, RIM_RY)}
            fill="none" stroke={SECTION_ACCENT[active]} strokeWidth="2" opacity="0.6"
          />
        </g>
      )}

      {/* ── Realistic clubhead silhouettes, fanned outward from the hub ── */}
      <g clipPath="url(#clip-rim)">
        {sections.map((sect) => {
          const [a0, a1] = BOUNDS[sect];
          const sectionClubs = bySection[sect];
          const angles = clubPositions(a0, a1, sectionClubs.length);
          const shrink = sect === 'woods' && sectionClubs.length > 3 ? 0.82 : 1;
          return sectionClubs.map((club, i) => {
            const ang = angles[i];
            const p = polar(CLUB_RX, CLUB_RY, ang);
            const shape = clubShape(club.slot);
            return (
              <g
                key={club.id}
                transform={`translate(${p.x}, ${p.y}) rotate(${ang}) scale(${shrink})`}
              >
                <path d={HEAD_PATHS[shape]} fill={HEAD_GRADIENT[shape]} stroke={SECTION_COLOR[sect]} strokeWidth="0.9" strokeOpacity="0.8"/>
                {/* Specular highlight */}
                <ellipse cx={-2.5} cy={-4} rx={2.6} ry={1.6} fill="#fff" opacity="0.3" transform="rotate(-25)"/>
                {/* Putter sightline */}
                {shape === 'putter' && (
                  <line x1="0" y1="-6.5" x2="0" y2="5.5" stroke="#fff" strokeWidth="1.1" opacity="0.55"/>
                )}
              </g>
            );
          });
        })}
      </g>

      {/* ── Center hub ── */}
      <circle cx={CX} cy={CY} r={14} fill="url(#g-hub)" stroke="#606870" strokeWidth="1"/>
      <circle cx={CX - 4} cy={CY - 4} r={4} fill="#fff" opacity="0.2"/>

      {/* ── Click targets — section only; per-club editing lives in the sheet ── */}
      {sections.map((sect) => (
        <path
          key={`hit-${sect}`}
          d={slicePath(...BOUNDS[sect], RIM_RX, RIM_RY)}
          fill="transparent"
          className="cursor-pointer"
          onClick={() => onSelect(sect)}
          role="button"
          aria-label={`${SECTION_LABELS[sect]} — ${counts[sect]} clubs`}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(sect)}
        />
      ))}

      {/* ── Side highlight tabs (primary selection UI) ── */}
      {sections.map((sect) => {
        const [a0, a1] = BOUNDS[sect];
        const mid = (a0 + a1) / 2;
        const rimPt = polar(WALL_RX, WALL_RY, mid);
        const tabPt = polar(TAB_RX, TAB_RY, mid);
        const isActive = active === sect;
        const tabW = 62, tabH = 34;
        return (
          <g key={`tab-${sect}`}>
            <line
              x1={rimPt.x} y1={rimPt.y} x2={tabPt.x} y2={tabPt.y}
              stroke={isActive ? SECTION_COLOR[sect] : '#3A4248'}
              strokeWidth="1.2" strokeDasharray="2.5 2" opacity={isActive ? 0.8 : 0.35}
            />
            <g
              transform={`translate(${tabPt.x - tabW / 2}, ${tabPt.y - tabH / 2})`}
              className="cursor-pointer"
              onClick={() => onSelect(sect)}
              role="button"
              aria-label={`Select ${SECTION_LABELS[sect]}`}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(sect)}
            >
              <rect
                width={tabW} height={tabH} rx="10"
                fill={isActive ? SECTION_COLOR[sect] + '1A' : '#FFFFFF'}
                stroke={isActive ? SECTION_COLOR[sect] : '#E2E0D8'}
                strokeWidth={isActive ? 1.6 : 1}
                style={{ transition: 'all 0.2s' }}
              />
              <text
                x={tabW / 2} y={14}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontFamily="Spline Sans Mono,monospace" fontWeight="700"
                fill={isActive ? SECTION_COLOR[sect] : '#6A7680'}
              >
                {counts[sect]}
              </text>
              <text
                x={tabW / 2} y={26}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="7" fontFamily="Archivo,sans-serif" fontWeight="800"
                letterSpacing="0.08em"
                fill={isActive ? SECTION_ACCENT[sect] : '#9BA3A5'}
              >
                {SECTION_LABELS[sect]}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
