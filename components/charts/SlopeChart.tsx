// Slope chart: compare before/after values across multiple entities — shows direction and magnitude of change
import React from 'react';
import { colors } from '../../constants/theme';

export interface SlopeItem {
  label: string;
  before: number;
  after: number;
  color?: string;
}

export interface SlopeData {
  items: SlopeItem[];
  beforeLabel: string;
  afterLabel: string;
}

interface Props {
  data: SlopeData;
  width?: number;
  height?: number;
  formatValue?: (v: number) => string;
}

export function SlopeChart({ data, width = 320, height = 260, formatValue }: Props) {
  const leftX = 90;
  const rightX = width - 90;
  const padTop = 40;
  const padBot = 24;
  const chartH = height - padTop - padBot;

  const allVals = data.items.flatMap((d) => [d.before, d.after]);
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals);
  const range = maxVal - minVal || 1;
  const toY = (v: number) => padTop + chartH - ((v - minVal) / range) * chartH;

  const fmt = formatValue ?? ((v: number) => v.toFixed(1));

  return (
    <div>
      <svg width={width} height={height}>
        {/* Column headers */}
        <text x={leftX} y={padTop - 14} textAnchor="middle" fill={colors.textSecondary} fontSize={11} fontWeight="600">
          {data.beforeLabel}
        </text>
        <text x={rightX} y={padTop - 14} textAnchor="middle" fill={colors.textSecondary} fontSize={11} fontWeight="600">
          {data.afterLabel}
        </text>

        {/* Slope lines */}
        {data.items.map((item, i) => {
          const y1 = toY(item.before);
          const y2 = toY(item.after);
          const isGain = item.after > item.before;
          const isLoss = item.after < item.before;
          const lineColor = item.color ?? (isGain ? colors.gain : isLoss ? colors.loss : colors.textMuted);

          return (
            <g key={i}>
              <line
                x1={leftX}
                y1={y1}
                x2={rightX}
                y2={y2}
                stroke={lineColor}
                strokeWidth={isGain || isLoss ? 2 : 1}
                opacity={0.85}
              />
              {/* Before dot + label */}
              <circle cx={leftX} cy={y1} r={4} fill={lineColor} />
              <text x={leftX - 8} y={y1 + 4} textAnchor="end" fill={lineColor} fontSize={10}>
                {fmt(item.before)}
              </text>
              <text x={leftX - 8} y={y1 - 6} textAnchor="end" fill={colors.textMuted} fontSize={9}>
                {item.label}
              </text>

              {/* After dot + label */}
              <circle cx={rightX} cy={y2} r={4} fill={lineColor} />
              <text x={rightX + 8} y={y2 + 4} textAnchor="start" fill={lineColor} fontSize={10}>
                {fmt(item.after)}
              </text>
              {/* Change arrow indicator */}
              <text x={rightX + 8} y={y2 - 6} textAnchor="start" fill={colors.textMuted} fontSize={9}>
                {isGain ? '▲' : isLoss ? '▼' : '—'}
                {' '}{Math.abs(((item.after - item.before) / (item.before || 1)) * 100).toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
