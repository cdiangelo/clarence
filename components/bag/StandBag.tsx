'use client';
import React from 'react';
import type { BagSection } from '@/stores/bag';

interface Props {
  counts: Record<BagSection, number>;
  active: BagSection | null;
  onSelect: (s: BagSection) => void;
}

// ── Top-down POV: looking down into the bag's 14-way top opening ──
// viewBox: 0 0 360 360
const CX = 180;
const CY = 180;

// Outer wall (visible rim of fabric around the opening)
const WALL_RX = 130;
const WALL_RY = 100;
// Inner rim (the opening itself — where club dividers + clubs live)
const RIM_RX = 98;
const RIM_RY = 72;
// Radius at which club-cap circles are drawn
const CLUB_RX = RIM_RX * 0.68;
const CLUB_RY = RIM_RY * 0.68;
// Radius for the outer selectable tab callouts
const TAB_RX = 150;
const TAB_RY = 120;

// Slice boundaries in degrees, clockwise from top (0deg = 12 o'clock)
// Proportioned roughly to a real bag: irons hold the most clubs, putter the fewest.
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

export function StandBag({ counts, active, onSelect }: Props) {
  const sections = Object.keys(BOUNDS) as BagSection[];

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

        <radialGradient id="g-cap" cx="36%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#D3DBDE"/>
          <stop offset="45%"  stopColor="#8B959B"/>
          <stop offset="100%" stopColor="#454D53"/>
        </radialGradient>

        <radialGradient id="g-puttercap" cx="36%" cy="30%" r="70%">
          <stop offset="0%"   stopColor="#4A4E52"/>
          <stop offset="100%" stopColor="#15171A"/>
        </radialGradient>

        <linearGradient id="g-active" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="currentColor" stopOpacity="0.30"/>
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.08"/>
        </linearGradient>

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
      {/* Specular highlight — simulated light source, upper-left */}
      <path
        d={`M ${polar(WALL_RX - 8, WALL_RY - 8, 300).x},${polar(WALL_RX - 8, WALL_RY - 8, 300).y}
            A ${WALL_RX - 8},${WALL_RY - 8} 0 0 1 ${polar(WALL_RX - 8, WALL_RY - 8, 40).x},${polar(WALL_RX - 8, WALL_RY - 8, 40).y}`}
        fill="none" stroke="#fff" strokeWidth="3" opacity="0.06" strokeLinecap="round"
      />

      {/* ── Inner opening (tube interior) ── */}
      <ellipse cx={CX} cy={CY} rx={RIM_RX} ry={RIM_RY} fill="url(#g-interior)"/>
      {/* Lip where wall meets opening */}
      <ellipse cx={CX} cy={CY} rx={RIM_RX} ry={RIM_RY} fill="none" stroke="#40484E" strokeWidth="1.4" opacity="0.7"/>
      <ellipse cx={CX} cy={CY} rx={WALL_RX} ry={WALL_RY} fill="none" stroke="#3A4248" strokeWidth="1.2" opacity="0.5"/>

      {/* ── Section slices + clubs ── */}
      <g clipPath="url(#clip-rim)">
        {sections.map((sect) => {
          const [a0, a1] = BOUNDS[sect];
          const isActive = active === sect;
          return (
            <path
              key={`fill-${sect}`}
              d={slicePath(a0, a1, RIM_RX, RIM_RY)}
              fill={isActive ? SECTION_COLOR[sect] : 'transparent'}
              opacity={isActive ? 0.22 : 0}
              style={{ transition: 'opacity 0.25s' }}
            />
          );
        })}

        {/* Club cap circles */}
        {sections.map((sect) => {
          const [a0, a1] = BOUNDS[sect];
          const n = counts[sect] ?? 0;
          const angles = clubPositions(a0, a1, n);
          return angles.map((ang, i) => {
            const p = polar(CLUB_RX, CLUB_RY, ang);
            const isPutter = sect === 'putter';
            const r = isPutter ? 9 : 6.5;
            return (
              <g key={`${sect}-${i}`}>
                <circle cx={p.x} cy={p.y} r={r + 1.5} fill={SECTION_COLOR[sect]} opacity="0.9"/>
                <circle cx={p.x} cy={p.y} r={r} fill={isPutter ? 'url(#g-puttercap)' : 'url(#g-cap)'} stroke="#20262b" strokeWidth="0.6"/>
                <circle cx={p.x - r * 0.3} cy={p.y - r * 0.3} r={r * 0.28} fill="#fff" opacity="0.35"/>
              </g>
            );
          });
        })}
      </g>

      {/* ── Dividers (molded plastic look) ── */}
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

      {/* ── Active section edge glow ── */}
      {active && (
        <g clipPath="url(#clip-rim)">
          <path
            d={slicePath(...BOUNDS[active], RIM_RX, RIM_RY)}
            fill="none" stroke={SECTION_ACCENT[active]} strokeWidth="2" opacity="0.6"
          />
        </g>
      )}

      {/* ── Center hub ── */}
      <circle cx={CX} cy={CY} r={14} fill="url(#g-hub)" stroke="#606870" strokeWidth="1"/>
      <circle cx={CX - 4} cy={CY - 4} r={4} fill="#fff" opacity="0.2"/>

      {/* ── Click targets (slices) ── */}
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
