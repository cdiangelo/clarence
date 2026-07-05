'use client';
import React from 'react';

interface MonthData {
  month: string;
  count: number;
  avgScore: number | null;
  handicap?: number | null;
}

interface Props {
  data: MonthData[];
  par?: number;
}

const W = 560;
const H = 200;
const PAD = { top: 24, right: 24, bottom: 36, left: 44 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

export function ComboChart({ data, par = 72 }: Props) {
  const active = data.filter((d) => d.count > 0 || d.avgScore != null);
  if (active.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-ink-muted text-sm">
        Log some rounds to see your season chart
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const scores = data.map((d) => d.avgScore).filter((s): s is number => s != null);
  const handicaps = data.map((d) => d.handicap).filter((h): h is number => h != null);
  const allLines = [...scores, ...handicaps];
  const minLine = allLines.length > 0 ? Math.min(...allLines) - 4 : par - 10;
  const maxLine = allLines.length > 0 ? Math.max(...allLines) + 4 : par + 10;

  const xStep = CHART_W / (data.length - 1 || 1);
  const barW = (CHART_W / data.length) * 0.55;

  function barH(count: number) { return (count / maxCount) * CHART_H; }
  function yLine(val: number) { return PAD.top + CHART_H - ((val - minLine) / (maxLine - minLine)) * CHART_H; }
  function xPos(i: number) { return PAD.left + (CHART_W / data.length) * (i + 0.5); }

  // Build score & handicap line paths
  function buildPath(values: (number | null | undefined)[], transform: (v: number) => number): string {
    const pts: string[] = [];
    values.forEach((v, i) => {
      if (v == null) return;
      const x = xPos(i);
      const y = transform(v);
      pts.push(pts.length === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    });
    return pts.join(' ');
  }

  const scorePath = buildPath(data.map((d) => d.avgScore), yLine);
  const hcpPath = buildPath(data.map((d) => d.handicap), yLine);
  const parY = yLine(par);

  // Y-axis ticks for score line
  const lineRange = maxLine - minLine;
  const tickStep = lineRange <= 12 ? 2 : 4;
  const yTicks: number[] = [];
  for (let v = Math.round(minLine / tickStep) * tickStep; v <= maxLine; v += tickStep) yTicks.push(v);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-label="Season combo chart">
      {/* Grid lines */}
      {yTicks.map((v) => {
        const y = yLine(v);
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#E2E0D8" strokeWidth="1" />
            <text x={PAD.left - 6} y={y} textAnchor="end" dominantBaseline="middle" fontSize="9" fill="#9BA3A5"
              fontFamily="Spline Sans Mono,monospace">{v}</text>
          </g>
        );
      })}

      {/* Par line */}
      {par > 0 && parY >= PAD.top && parY <= PAD.top + CHART_H && (
        <g>
          <line x1={PAD.left} y1={parY} x2={W - PAD.right} y2={parY} stroke="#2F6B44" strokeWidth="1" strokeDasharray="4 3" opacity={0.5} />
          <text x={W - PAD.right + 3} y={parY} dominantBaseline="middle" fontSize="9" fill="#2F6B44" fontFamily="Archivo,sans-serif" fontWeight="700">PAR</text>
        </g>
      )}

      {/* Bars */}
      {data.map((d, i) => {
        const x = xPos(i);
        const bH = barH(d.count);
        if (d.count === 0) return null;
        return (
          <rect key={d.month}
            x={x - barW / 2} y={PAD.top + CHART_H - bH} width={barW} height={bH}
            fill="#E8F0E9" rx={2}
          />
        );
      })}

      {/* Score line */}
      {scorePath && (
        <path d={scorePath} fill="none" stroke="#C2492E" strokeWidth="2" strokeLinejoin="round" />
      )}

      {/* Score dots */}
      {data.map((d, i) => {
        if (d.avgScore == null) return null;
        return (
          <circle key={d.month + 'score'} cx={xPos(i)} cy={yLine(d.avgScore)} r={3.5}
            fill="#C2492E" stroke="#F7F6F1" strokeWidth="1.5" />
        );
      })}

      {/* Handicap line */}
      {hcpPath && (
        <path d={hcpPath} fill="none" stroke="#3B7DC4" strokeWidth="1.5" strokeDasharray="5 3" strokeLinejoin="round" />
      )}

      {/* Handicap dots */}
      {data.map((d, i) => {
        if (d.handicap == null) return null;
        return (
          <circle key={d.month + 'hcp'} cx={xPos(i)} cy={yLine(d.handicap)} r={3}
            fill="#3B7DC4" stroke="#F7F6F1" strokeWidth="1.5" />
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text key={d.month} x={xPos(i)} y={H - PAD.bottom + 14} textAnchor="middle"
          fontSize="9" fill="#9BA3A5" fontFamily="Archivo,sans-serif" fontWeight="700" letterSpacing="0.04em">
          {d.month.toUpperCase()}
        </text>
      ))}

      {/* Legend */}
      <g transform={`translate(${PAD.left},${PAD.top - 14})`}>
        <rect x="0" y="-6" width="8" height="8" fill="#E8F0E9" rx="1" />
        <text x="11" y="0" fontSize="8" fill="#9BA3A5" fontFamily="Archivo,sans-serif" fontWeight="700" letterSpacing="0.05em">ROUNDS</text>
        <line x1="52" y1="-2" x2="62" y2="-2" stroke="#C2492E" strokeWidth="2" />
        <circle cx="57" cy="-2" r="2.5" fill="#C2492E" />
        <text x="65" y="0" fontSize="8" fill="#9BA3A5" fontFamily="Archivo,sans-serif" fontWeight="700" letterSpacing="0.05em">AVG SCORE</text>
        <line x1="120" y1="-2" x2="130" y2="-2" stroke="#3B7DC4" strokeWidth="1.5" strokeDasharray="4 2" />
        <circle cx="125" cy="-2" r="2" fill="#3B7DC4" />
        <text x="133" y="0" fontSize="8" fill="#9BA3A5" fontFamily="Archivo,sans-serif" fontWeight="700" letterSpacing="0.05em">HANDICAP</text>
      </g>
    </svg>
  );
}
