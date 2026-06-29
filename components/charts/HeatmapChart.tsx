// Heatmap: correlation matrix, factor exposures, return calendars, sector heat
import React from 'react';
import { colors } from '../../constants/theme';

export interface HeatmapData {
  rowLabels: string[];
  colLabels: string[];
  values: number[][];
  colorScale?: 'rg' | 'diverging' | 'sequential';
}

interface Props {
  data: HeatmapData;
  width?: number;
  formatValue?: (v: number) => string;
}

function interpolateColor(t: number, scale: HeatmapData['colorScale'] = 'rg'): string {
  // t in [-1, 1] for diverging/rg, [0,1] for sequential
  if (scale === 'diverging' || scale === 'rg') {
    if (t >= 0) {
      // white → green
      const r = Math.round(255 * (1 - t * 0.6));
      const g = Math.round(255 * (0.2 + t * 0.5));
      const b = Math.round(255 * (1 - t * 0.6));
      return `rgb(${r},${g},${b})`;
    } else {
      // white → red
      const abs = Math.abs(t);
      const r = Math.round(255 * (0.6 + abs * 0.4));
      const g = Math.round(255 * (1 - abs * 0.7));
      const b = Math.round(255 * (1 - abs * 0.7));
      return `rgb(${r},${g},${b})`;
    }
  }
  // sequential: dark blue → light
  const intensity = Math.min(1, Math.max(0, t));
  const r = Math.round(20 + intensity * 40);
  const g = Math.round(40 + intensity * 100);
  const b = Math.round(130 + intensity * 125);
  return `rgb(${r},${g},${b})`;
}

export function HeatmapChart({ data, width = 340, formatValue }: Props) {
  const { rowLabels, colLabels, values, colorScale = 'rg' } = data;
  const nRows = rowLabels.length;
  const nCols = colLabels.length;

  const labelPadLeft = 70;
  const labelPadTop = 40;
  const cellW = Math.min(44, (width - labelPadLeft - 8) / nCols);
  const cellH = Math.min(36, cellW * 0.8);
  const totalH = labelPadTop + nRows * cellH + 8;

  // Find global min/max for normalization
  const flat = values.flat();
  const max = Math.max(...flat.map(Math.abs), 0.001);

  const fmt = formatValue ?? ((v: number) => v.toFixed(2));

  return (
    <div>
      <svg width={width} height={totalH}>
        {/* Col headers */}
        {colLabels.map((label, ci) => (
          <text
            key={ci}
            x={labelPadLeft + ci * cellW + cellW / 2}
            y={labelPadTop - 6}
            textAnchor="middle"
            fill={colors.textSecondary}
            fontSize={9}
            fontWeight="600"
          >
            {label.length > 5 ? label.slice(0, 5) : label}
          </text>
        ))}

        {/* Rows */}
        {rowLabels.map((rowLabel, ri) => (
          <g key={ri}>
            {/* Row label */}
            <text
              x={labelPadLeft - 6}
              y={labelPadTop + ri * cellH + cellH / 2 + 4}
              textAnchor="end"
              fill={colors.textSecondary}
              fontSize={9}
            >
              {rowLabel}
            </text>

            {/* Cells */}
            {colLabels.map((_, ci) => {
              const v = values[ri]?.[ci] ?? 0;
              const t = colorScale === 'rg' || colorScale === 'diverging' ? v / max : (v - Math.min(...flat)) / (max - Math.min(...flat) || 1);
              const bg = interpolateColor(t, colorScale);
              const textColor = Math.abs(t) > 0.5 ? '#fff' : colors.text;
              const cellX = labelPadLeft + ci * cellW;
              const cellY = labelPadTop + ri * cellH;

              return (
                <g key={ci}>
                  <rect x={cellX + 1} y={cellY + 1} width={cellW - 2} height={cellH - 2} fill={bg} rx={3} />
                  <text
                    x={cellX + cellW / 2}
                    y={cellY + cellH / 2 + 4}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={9}
                    fontWeight="600"
                  >
                    {fmt(v)}
                  </text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
