'use client';
import React from 'react';
import type { BagSection } from '@/stores/bag';

interface Props {
  counts: Record<BagSection, number>;
  active: BagSection | null;
  onSelect: (s: BagSection) => void;
}

// ViewBox: 0 0 280 570
const CX = 140;
const TOP = 70;   // y where bag body starts
const BOT = 490;  // y where bag body ends

// Linear taper: bag is 164px wide at top, 136px wide at bottom
function lx(y: number) { return 58 + ((y - TOP) / (BOT - TOP)) * 14; }
function rx(y: number) { return 222 - ((y - TOP) / (BOT - TOP)) * 14; }

const SECTS: Record<BagSection, [number, number]> = {
  woods:  [TOP, 205],
  irons:  [205, 335],
  wedges: [335, 422],
  putter: [422, BOT],
};

const SECT_LABELS: Record<BagSection, string> = {
  woods: 'WOODS', irons: 'IRONS', wedges: 'WEDGES', putter: 'PUTTER',
};

// Section hit-area trapezoid
function sectPath(top: number, bot: number) {
  return `M ${lx(top)},${top} L ${rx(top)},${top} L ${rx(bot)},${bot} L ${lx(bot)},${bot} Z`;
}

// Bag body path — sides bow slightly outward (cylindrical feel)
const BODY = `
  M ${lx(TOP)},${TOP}
  C 38,220 48,360 ${lx(BOT)},${BOT}
  Q ${CX},${BOT + 18} ${rx(BOT)},${BOT}
  C 232,360 242,220 ${rx(TOP)},${TOP}
  Z
`;

export function StandBag({ counts, active, onSelect }: Props) {
  return (
    <svg
      viewBox="0 0 280 570"
      className="w-full max-w-[230px] select-none"
      style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.55))' }}
      aria-label="Golf bag"
    >
      <defs>
        {/* ── Gradients ── */}
        <linearGradient id="g-body" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#303538"/>
          <stop offset="14%"  stopColor="#1C1F22"/>
          <stop offset="48%"  stopColor="#14171A"/>
          <stop offset="86%"  stopColor="#1C1F22"/>
          <stop offset="100%" stopColor="#303538"/>
        </linearGradient>

        <linearGradient id="g-hood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#0E1012"/>
          <stop offset="100%" stopColor="#1A1E21"/>
        </linearGradient>

        <linearGradient id="g-shaft" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#58646A"/>
          <stop offset="38%"  stopColor="#B0BCC2"/>
          <stop offset="52%"  stopColor="#D8E4E8"/>
          <stop offset="100%" stopColor="#58646A"/>
        </linearGradient>

        <linearGradient id="g-leg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#2E3438"/>
          <stop offset="50%"  stopColor="#788892"/>
          <stop offset="100%" stopColor="#2E3438"/>
        </linearGradient>

        <linearGradient id="g-strap" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#181B1E"/>
          <stop offset="50%"  stopColor="#383E44"/>
          <stop offset="100%" stopColor="#181B1E"/>
        </linearGradient>

        <linearGradient id="g-pocket" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#242829"/>
          <stop offset="100%" stopColor="#191C1E"/>
        </linearGradient>

        <linearGradient id="g-active" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#2F6B44" stopOpacity="0"/>
          <stop offset="22%"  stopColor="#2F6B44" stopOpacity="0.28"/>
          <stop offset="78%"  stopColor="#2F6B44" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#2F6B44" stopOpacity="0"/>
        </linearGradient>

        <linearGradient id="g-driver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#2A2F34"/>
          <stop offset="60%"  stopColor="#1A1E22"/>
          <stop offset="100%" stopColor="#0E1012"/>
        </linearGradient>

        <radialGradient id="g-driverface" cx="40%" cy="35%" r="60%">
          <stop offset="0%"   stopColor="#3A4248"/>
          <stop offset="100%" stopColor="#1A1E22"/>
        </radialGradient>

        {/* ── Clip paths ── */}
        <clipPath id="clip-body">
          <path d={BODY}/>
        </clipPath>

        {/* ── Texture filter ── */}
        <filter id="f-texture" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" result="n"/>
          <feColorMatrix in="n" type="saturate" values="0" result="g"/>
          <feBlend in="SourceGraphic" in2="g" mode="multiply" result="b"/>
          <feBlend in="SourceGraphic" in2="b" mode="screen" k2="0.96" k3="0.04"/>
        </filter>
      </defs>

      {/* ─────────────────────────── STAND LEGS ─────────────────────────── */}
      <line x1="97"  y1="462" x2="52"  y2="558" stroke="url(#g-leg)" strokeWidth="6.5" strokeLinecap="round"/>
      <line x1="183" y1="462" x2="228" y2="558" stroke="url(#g-leg)" strokeWidth="6.5" strokeLinecap="round"/>
      {/* Cross-brace */}
      <line x1="62"  y1="534" x2="218" y2="534" stroke="url(#g-leg)" strokeWidth="3"   strokeLinecap="round" opacity="0.55"/>
      {/* Feet */}
      <ellipse cx="50"  cy="560" rx="7" ry="3.5" fill="#2E3438"/>
      <ellipse cx="230" cy="560" rx="7" ry="3.5" fill="#2E3438"/>
      {/* Hinge/pivot joint */}
      <circle cx="97"  cy="466" r="5" fill="#4A5258" stroke="#606870" strokeWidth="1"/>
      <circle cx="183" cy="466" r="5" fill="#4A5258" stroke="#606870" strokeWidth="1"/>

      {/* ─────────────────────────── BAG BODY ─────────────────────────── */}
      <path d={BODY} fill="url(#g-body)"/>

      {/* Fabric texture overlay */}
      <g clipPath="url(#clip-body)" opacity="0.055">
        <rect x="0" y="0" width="280" height="570" fill="#fff" filter="url(#f-texture)"/>
      </g>

      {/* Side highlight (left edge — gives 3-D roundness) */}
      <path
        d={`M ${lx(TOP) + 10},${TOP + 4} C 52,230 60,370 ${lx(BOT) + 8},${BOT - 6}`}
        fill="none" stroke="#505860" strokeWidth="2" opacity="0.35" clipPath="url(#clip-body)"
      />

      {/* ─────────────────────────── SECTION DIVIDERS ─────────────────────────── */}
      {([205, 335, 422] as number[]).map((y) => (
        <line key={y}
          x1={lx(y) + 5} y1={y}
          x2={rx(y) - 5} y2={y}
          stroke="#3A4045" strokeWidth="1.2" opacity="0.85"
        />
      ))}

      {/* ─────────────────────────── ACTIVE SECTION ─────────────────────────── */}
      {active && (
        <g clipPath="url(#clip-body)">
          <path d={sectPath(...SECTS[active])} fill="url(#g-active)"/>
          {/* Top edge glow */}
          <line
            x1={lx(SECTS[active][0]) + 4} y1={SECTS[active][0]}
            x2={rx(SECTS[active][0]) - 4} y2={SECTS[active][0]}
            stroke="#4A8A5E" strokeWidth="1.8" opacity="0.9"
          />
          {/* Bottom edge glow (not for putter) */}
          {active !== 'putter' && (
            <line
              x1={lx(SECTS[active][1]) + 4} y1={SECTS[active][1]}
              x2={rx(SECTS[active][1]) - 4} y2={SECTS[active][1]}
              stroke="#4A8A5E" strokeWidth="1.8" opacity="0.9"
            />
          )}
        </g>
      )}

      {/* ─────────────────────────── POCKETS ─────────────────────────── */}
      <g clipPath="url(#clip-body)">
        {/* Ball pocket */}
        <rect x={CX - 46} y="348" width="92" height="60" rx="13"
          fill="url(#g-pocket)" stroke="#353A3E" strokeWidth="1.2"/>
        <path d={`M ${CX - 38},357 Q ${CX},351 ${CX + 38},357`}
          fill="none" stroke="#464C52" strokeWidth="1" strokeDasharray="2.5 2"/>
        {/* Zipper pull */}
        <circle cx={CX} cy="354" r="4" fill="#5A6268"/>
        <circle cx={CX} cy="354" r="2.2" fill="#8A9298"/>
        <line x1={CX} y1="358" x2={CX} y2="364" stroke="#5A6268" strokeWidth="1.8" strokeLinecap="round"/>

        {/* Accessory pocket */}
        <rect x={CX - 34} y="276" width="68" height="44" rx="9"
          fill="url(#g-pocket)" stroke="#353A3E" strokeWidth="1.2"/>
        <path d={`M ${CX - 27},284 Q ${CX},279 ${CX + 27},284`}
          fill="none" stroke="#464C52" strokeWidth="1" strokeDasharray="2.5 2"/>
        <circle cx={CX} cy="282" r="3" fill="#5A6268"/>
        <circle cx={CX} cy="282" r="1.5" fill="#8A9298"/>
      </g>

      {/* ─────────────────────────── STRAP ─────────────────────────── */}
      <g clipPath="url(#clip-body)">
        <path d={`M ${rx(TOP) - 16},${TOP + 30} C 198,235 192,350 184,436`}
          fill="none" stroke="url(#g-strap)" strokeWidth="15" strokeLinecap="round" opacity="0.45"/>
        <path d={`M ${rx(TOP) - 16},${TOP + 30} C 198,235 192,350 184,436`}
          fill="none" stroke="#4A5258" strokeWidth="5" strokeLinecap="round" opacity="0.3"/>
        {/* Buckle */}
        <rect x="178" y="228" width="18" height="22" rx="3.5"
          fill="#505860" stroke="#6A7480" strokeWidth="0.8"/>
        <line x1="178" y1="239" x2="196" y2="239" stroke="#7A8490" strokeWidth="1.5"/>
        <circle cx="187" cy="239" r="2.5" fill="#8A9298"/>
      </g>

      {/* ─────────────────────────── BODY OUTLINE ─────────────────────────── */}
      <path d={BODY} fill="none" stroke="#404850" strokeWidth="1.5" opacity="0.7"/>

      {/* ─────────────────────────── SECTION LABELS ─────────────────────────── */}
      {(Object.entries(SECTS) as [BagSection, [number, number]][]).map(([sect, [top, bot]]) => {
        const midY = (top + bot) / 2;
        const cnt = counts[sect];
        const isActive = active === sect;
        return (
          <g key={sect}>
            {/* Section label on left edge */}
            <text
              x={lx(midY) + 8} y={midY}
              textAnchor="start" dominantBaseline="middle"
              fontSize="7" fontFamily="Archivo,sans-serif" fontWeight="800"
              letterSpacing="0.12em"
              fill={isActive ? '#4A8A5E' : '#3A4248'}
              opacity={isActive ? 1 : 0.7}
            >
              {SECT_LABELS[sect]}
            </text>
            {/* Count badge on right edge */}
            {cnt > 0 && (
              <>
                <circle
                  cx={rx(midY) - 14} cy={midY} r={10}
                  fill={isActive ? '#2F6B44' : 'rgba(255,255,255,0.06)'}
                  stroke={isActive ? '#4A8A5E' : '#3A4248'}
                  strokeWidth="1"
                />
                <text
                  x={rx(midY) - 14} y={midY + 0.5}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="8" fontFamily="Spline Sans Mono,monospace"
                  fontWeight="700"
                  fill={isActive ? '#fff' : '#6A7680'}
                >
                  {cnt}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* ─────────────────────────── CLUB SHAFTS ─────────────────────────── */}
      {[
        { x: CX + 1,  y1: -30, y2: TOP - 2,  w: 2.4, o: 0.88 }, // driver — center back
        { x: CX - 17, y1: -20, y2: TOP - 4,  w: 2.0, o: 0.78 },
        { x: CX + 18, y1: -16, y2: TOP - 2,  w: 2.0, o: 0.75 },
        { x: CX - 32, y1:  -8, y2: TOP + 1,  w: 1.7, o: 0.68 },
        { x: CX + 33, y1:  -6, y2: TOP + 2,  w: 1.7, o: 0.65 },
        { x: CX - 46, y1:   0, y2: TOP + 4,  w: 1.5, o: 0.58 },
        { x: CX + 47, y1:   2, y2: TOP + 5,  w: 1.5, o: 0.56 },
        { x: CX - 58, y1:   6, y2: TOP + 7,  w: 1.4, o: 0.48 },
        { x: CX + 59, y1:   8, y2: TOP + 8,  w: 1.4, o: 0.46 },
        { x: CX - 68, y1:  12, y2: TOP + 10, w: 1.3, o: 0.40 },
        { x: CX + 69, y1:  14, y2: TOP + 12, w: 1.3, o: 0.38 },
        { x: CX - 76, y1:  16, y2: TOP + 14, w: 1.2, o: 0.32 },
        { x: CX + 77, y1:  18, y2: TOP + 16, w: 1.2, o: 0.30 },
      ].map((s, i) => (
        <line key={i}
          x1={s.x} y1={s.y1}
          x2={s.x} y2={s.y2}
          stroke="url(#g-shaft)"
          strokeWidth={s.w}
          strokeLinecap="round"
          opacity={s.o}
        />
      ))}

      {/* ─────────────────────────── DRIVER HEAD ─────────────────────────── */}
      {/* Shadow under driver head */}
      <ellipse cx={CX + 1} cy={-18} rx={32} ry={14} fill="#000" opacity="0.4"/>
      {/* Driver crown (main shape) */}
      <path
        d={`M ${CX - 28},-30 Q ${CX - 30},-46 ${CX},-50 Q ${CX + 30},-46 ${CX + 28},-30 Q ${CX + 20},-20 ${CX},-18 Q ${CX - 20},-20 ${CX - 28},-30`}
        fill="url(#g-driver)" stroke="#2A2F34" strokeWidth="1"
      />
      {/* Driver crown highlight */}
      <path
        d={`M ${CX - 16},-42 Q ${CX},-50 ${CX + 14},-42`}
        fill="none" stroke="#3A4248" strokeWidth="1.2" opacity="0.7"
      />
      {/* Face plate */}
      <path
        d={`M ${CX - 26},-30 Q ${CX},-38 ${CX + 26},-30 L ${CX + 18},-20 Q ${CX},-18 ${CX - 18},-20 Z`}
        fill="url(#g-driverface)" stroke="#30363A" strokeWidth="0.8"
      />
      {/* Crown glare */}
      <ellipse cx={CX - 6} cy={-40} rx={9} ry={4}
        fill="#fff" opacity="0.06" transform={`rotate(-20 ${CX - 6} -40)`}/>

      {/* ─────────────────────────── TOP HOOD ─────────────────────────── */}
      {/* Hood depth shadow */}
      <ellipse cx={CX} cy={TOP} rx={88} ry={22} fill="#090B0D" opacity="0.9"/>
      {/* Hood ring */}
      <ellipse cx={CX} cy={TOP} rx={86} ry={21} fill="url(#g-hood)"/>
      {/* Hood inner */}
      <ellipse cx={CX} cy={TOP + 1} rx={73} ry={15} fill="#07090A"/>
      {/* Hood rim highlight */}
      <path
        d={`M ${CX - 74},${TOP - 8} Q ${CX},${TOP - 22} ${CX + 74},${TOP - 8}`}
        fill="none" stroke="#404850" strokeWidth="1.2" opacity="0.6"
      />
      {/* Club divider lines inside hood (radial) */}
      {[...Array(12)].map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const ir = 12; const or = 52;
        return (
          <line key={i}
            x1={CX + Math.cos(a) * ir} y1={TOP + Math.sin(a) * ir * 0.28}
            x2={CX + Math.cos(a) * or} y2={TOP + Math.sin(a) * or * 0.28}
            stroke="#1C2024" strokeWidth="1.5"
          />
        );
      })}
      {/* Hood inner ring */}
      <ellipse cx={CX} cy={TOP} rx={86} ry={21}
        fill="none" stroke="#384048" strokeWidth="1.5"/>
      <ellipse cx={CX} cy={TOP} rx={72} ry={14}
        fill="none" stroke="#28303A" strokeWidth="1"/>

      {/* ─────────────────────────── CLICK HIT AREAS ─────────────────────────── */}
      {(Object.entries(SECTS) as [BagSection, [number, number]][]).map(([sect, [top, bot]]) => (
        <path
          key={sect}
          d={sectPath(top, bot)}
          fill="transparent"
          className="cursor-pointer"
          onClick={() => onSelect(sect)}
          role="button"
          aria-label={`${SECT_LABELS[sect]} — ${counts[sect]} clubs`}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(sect)}
        />
      ))}
    </svg>
  );
}
