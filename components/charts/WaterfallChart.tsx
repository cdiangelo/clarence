import React from 'react';
import { colors } from '../../constants/theme';
import type { WaterfallData, ProcessedWaterfallItem, ChartConfig } from '../../lib/charts';
import { processWaterfall, formatChartValue } from '../../lib/charts';

interface Props {
  data: WaterfallData;
  config?: ChartConfig;
  width?: number;
}

const PADDING = { top: 20, right: 16, bottom: 56, left: 60 };

export function WaterfallChart({ data, config, width = 340 }: Props) {
  const height = config?.height ?? 220;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const processed: ProcessedWaterfallItem[] = data.processed ?? processWaterfall(data.items);

  const allEnds = processed.flatMap((p) => [p.start, p.end]);
  const maxVal = Math.max(...allEnds, 0);
  const minVal = Math.min(...allEnds, 0);
  const range = maxVal - minVal || 1;
  const padded = range * 0.08;
  const yMax = maxVal + padded;
  const yMin = minVal - padded;
  const yRange = yMax - yMin;

  const n = processed.length;
  const barW = Math.max(20, (chartW / n) * 0.6);
  const barSpacing = chartW / n;

  const toY = (v: number) => PADDING.top + chartH - ((v - yMin) / yRange) * chartH;
  const zeroY = toY(0);
  const fmt = config?.formatY ?? 'billions';

  const tickCount = 6;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + (yRange * i) / (tickCount - 1));

  const GAIN_COLOR = colors.gain;
  const LOSS_COLOR = colors.loss;
  const TOTAL_COLOR = colors.primary;

  return (
    <div>
      <svg width={width} height={height}>
        {/* Grid + Y labels */}
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

        {/* Zero axis */}
        <line
          x1={PADDING.left}
          y1={zeroY}
          x2={PADDING.left + chartW}
          y2={zeroY}
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* Bars + connectors */}
        {processed.map((item, i) => {
          const barColor = item.color === 'gain' ? GAIN_COLOR : item.color === 'loss' ? LOSS_COLOR : TOTAL_COLOR;
          const cx = PADDING.left + i * barSpacing + (barSpacing - barW) / 2;
          const y1 = toY(item.end);
          const y2 = toY(item.start);
          const barTop = Math.min(y1, y2);
          const barH = Math.max(2, Math.abs(y1 - y2));

          // Connector to next bar
          const nextItem = processed[i + 1];
          const connectorY = toY(item.end);

          return (
            <g key={i}>
              {/* Connector */}
              {nextItem && !nextItem.color.startsWith('total') && (
                <line
                  x1={cx + barW}
                  y1={connectorY}
                  x2={PADDING.left + (i + 1) * barSpacing + (barSpacing - barW) / 2}
                  y2={connectorY}
                  stroke={colors.borderLight}
                  strokeWidth={0.8}
                  strokeDasharray="3,2"
                />
              )}

              <rect x={cx} y={barTop} width={barW} height={barH} fill={barColor} rx={2} opacity={0.9} />

              {/* Value label on top */}
              <text
                x={cx + barW / 2}
                y={barTop - 3}
                textAnchor="middle"
                fill={barColor}
                fontSize={8}
                fontWeight="600"
              >
                {item.value >= 0 ? '+' : ''}{formatChartValue(item.value, fmt)}
              </text>

              {/* X label — two lines if needed */}
              <text
                x={cx + barW / 2}
                y={PADDING.top + chartH + 16}
                textAnchor="middle"
                fill={colors.textMuted}
                fontSize={8}
              >
                {item.label.length > 8 ? item.label.slice(0, 8) + '…' : item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Color legend */}
      <div style={{ display: 'flex', flexDirection: 'row', gap: 16, paddingLeft: PADDING.left, marginTop: 4 }}>
        {[{ color: GAIN_COLOR, label: 'Increase' }, { color: LOSS_COLOR, label: 'Decrease' }, { color: TOTAL_COLOR, label: 'Total' }].map(({ color: c, label }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
            <span style={{ color: colors.textMuted, fontSize: 10 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
