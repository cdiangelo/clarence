import React from 'react';
import { colors } from '../../constants/theme';
import type { LineData, ChartConfig } from '../../lib/charts';
import { formatChartValue } from '../../lib/charts';

interface Props {
  data: LineData;
  config?: ChartConfig;
  width?: number;
}

const PADDING = { top: 20, right: 16, bottom: 48, left: 52 };

export function LineChart({ data, config, width = 320 }: Props) {
  const height = config?.height ?? 180;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const allValues = data.datasets.flatMap((d) => d.values).filter((v) => isFinite(v));
  const maxVal = Math.max(...allValues, 0);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;
  const padded = range * 0.05;
  const yMax = maxVal + padded;
  const yMin = minVal - padded;
  const yRange = yMax - yMin;

  const n = data.labels.length;
  const toX = (i: number) => PADDING.left + (i / (n - 1 || 1)) * chartW;
  const toY = (v: number) => PADDING.top + chartH - ((v - yMin) / yRange) * chartH;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + (yRange * i) / (tickCount - 1));
  const fmt = config?.formatY ?? 'number';
  const chartColors = config?.colors ?? colors.chart;

  // Skip some x labels if crowded
  const labelStep = Math.ceil(n / 8);

  return (
    <div>
      <svg width={width} height={height}>
        {/* Grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              y1={toY(t)}
              x2={PADDING.left + chartW}
              y2={toY(t)}
              stroke={colors.border}
              strokeWidth={0.5}
            />
            <text x={PADDING.left - 6} y={toY(t) + 4} textAnchor="end" fill={colors.textMuted} fontSize={9}>
              {formatChartValue(t, fmt)}
            </text>
          </g>
        ))}

        {/* Lines */}
        {data.datasets.map((ds, si) => {
          const lineColor = ds.color ?? chartColors[si % chartColors.length];
          const pts = ds.values.map((v, i) => ({ x: toX(i), y: toY(v) }));
          const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

          return (
            <g key={si}>
              <path d={pathD} stroke={lineColor} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {pts.length <= 20 &&
                pts.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={3} fill={lineColor} />
                ))}
            </g>
          );
        })}

        {/* X labels */}
        {data.labels.map((label, i) => {
          if (i % labelStep !== 0 && i !== n - 1) return null;
          return (
            <text
              key={i}
              x={toX(i)}
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

      {data.datasets.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingLeft: PADDING.left, marginTop: 4 }}>
          {data.datasets.map((ds, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 16, height: 3, borderRadius: 2, backgroundColor: ds.color ?? colors.chart[i % colors.chart.length] }} />
              <span style={{ color: colors.textSecondary, fontSize: 10 }}>{ds.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
