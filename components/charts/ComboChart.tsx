import React from 'react';
import { colors } from '../../constants/theme';
import type { ComboData, ChartConfig } from '../../lib/charts';
import { formatChartValue } from '../../lib/charts';

interface Props {
  data: ComboData;
  config?: ChartConfig;
  width?: number;
}

const PADDING = { top: 20, right: 50, bottom: 48, left: 52 };

export function ComboChart({ data, config, width = 340 }: Props) {
  const height = config?.height ?? 220;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const n = data.labels.length;
  const barW = Math.max(8, (chartW / n) * 0.55);
  const spacing = chartW / n;

  // Bar axis (left)
  const barVals = data.bars.values;
  const barMax = Math.max(...barVals, 0);
  const barMin = Math.min(...barVals, 0);
  const barRange = barMax - barMin || 1;
  const barPad = barRange * 0.05;
  const bYMax = barMax + barPad;
  const bYMin = barMin - barPad;
  const bYRange = bYMax - bYMin;
  const toBarY = (v: number) => PADDING.top + chartH - ((v - bYMin) / bYRange) * chartH;
  const barZeroY = toBarY(0);

  // Line axis (right) — normalize all line values together
  const lineVals = data.lines.flatMap((l) => l.values).filter(isFinite);
  const lMax = Math.max(...lineVals, 0);
  const lMin = Math.min(...lineVals, 0);
  const lRange = lMax - lMin || 1;
  const lPad = lRange * 0.1;
  const lYMax = lMax + lPad;
  const lYMin = lMin - lPad;
  const lYRange = lYMax - lYMin;
  const toLineY = (v: number) => PADDING.top + chartH - ((v - lYMin) / lYRange) * chartH;

  const barColor = data.bars.color ?? colors.primary;
  const lineColors = data.lines.map((l, i) => l.color ?? colors.chart[i + 1] ?? colors.gold);
  const fmt = config?.formatY ?? 'number';

  const tickCount = 5;
  const barTicks = Array.from({ length: tickCount }, (_, i) => bYMin + (bYRange * i) / (tickCount - 1));
  const lineTicks = Array.from({ length: tickCount }, (_, i) => lYMin + (lYRange * i) / (tickCount - 1));

  return (
    <div>
      <svg width={width} height={height}>
        {/* Grid from bar ticks */}
        {barTicks.map((t, i) => (
          <g key={i}>
            <line x1={PADDING.left} y1={toBarY(t)} x2={PADDING.left + chartW} y2={toBarY(t)} stroke={colors.border} strokeWidth={0.5} />
            <text x={PADDING.left - 5} y={toBarY(t) + 4} textAnchor="end" fill={colors.textMuted} fontSize={9}>
              {formatChartValue(t, fmt)}
            </text>
          </g>
        ))}

        {/* Right Y axis (line) */}
        {lineTicks.map((t, i) => (
          <text
            key={i}
            x={PADDING.left + chartW + 4}
            y={toLineY(t) + 4}
            textAnchor="start"
            fill={lineColors[0] ?? colors.gold}
            fontSize={9}
          >
            {formatChartValue(t, 'percent')}
          </text>
        ))}

        {/* Zero line */}
        <line x1={PADDING.left} y1={barZeroY} x2={PADDING.left + chartW} y2={barZeroY} stroke={colors.border} strokeWidth={1} />

        {/* Bars */}
        {barVals.map((v, i) => {
          const bx = PADDING.left + i * spacing + (spacing - barW) / 2;
          const barTop = toBarY(Math.max(v, 0));
          const barBot = toBarY(Math.min(v, 0));
          const bh = Math.max(1, barBot - barTop);
          return (
            <rect key={i} x={bx} y={barTop} width={barW} height={bh} fill={barColor} opacity={0.7} rx={2} />
          );
        })}

        {/* Lines */}
        {data.lines.map((line, si) => {
          const lc = lineColors[si];
          const pts = line.values.map((v, i) => ({
            x: PADDING.left + i * spacing + spacing / 2,
            y: toLineY(v),
          }));
          const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
          return (
            <g key={si}>
              <path d={pathD} stroke={lc} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={lc} />)}
            </g>
          );
        })}

        {/* X labels */}
        {data.labels.map((label, i) => {
          const step = Math.ceil(n / 8);
          if (i % step !== 0 && i !== n - 1) return null;
          return (
            <text
              key={i}
              x={PADDING.left + i * spacing + spacing / 2}
              y={PADDING.top + chartH + 14}
              textAnchor="middle"
              fill={colors.textMuted}
              fontSize={9}
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingLeft: PADDING.left, marginTop: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: barColor, opacity: 0.7 }} />
          <span style={{ color: colors.textSecondary, fontSize: 10 }}>{data.bars.label}</span>
        </div>
        {data.lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: lineColors[i] }} />
            <span style={{ color: colors.textSecondary, fontSize: 10 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
