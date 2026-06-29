// Annotated line chart: price/metric series with event markers
// Models Iron Viz / storytelling style — events create narrative context on data
import React from 'react';
import { colors } from '../../constants/theme';

export interface ChartAnnotation {
  x: string | number;
  label: string;
  type?: 'fed' | 'earnings' | 'macro' | 'news' | 'default';
  color?: string;
}

export interface AnnotatedLineData {
  labels: string[];
  values: number[];
  annotations?: ChartAnnotation[];
  secondaryValues?: number[];
  secondaryLabel?: string;
}

const EVENT_COLORS: Record<string, string> = {
  fed: '#F59E0B',
  earnings: '#3B82F6',
  macro: '#8B5CF6',
  news: '#06B6D4',
  default: '#6B7280',
};

interface Props {
  data: AnnotatedLineData;
  width?: number;
  height?: number;
  formatY?: (v: number) => string;
  title?: string;
}

const PAD = { top: 28, right: 20, bottom: 60, left: 52 };

export function AnnotatedLineChart({ data, width = 340, height = 220, formatY }: Props) {
  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  const n = data.labels.length;
  const vals = data.values;
  const allVals = [...vals, ...(data.secondaryValues ?? [])].filter(isFinite);
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals);
  const range = maxVal - minVal || 1;
  const padded = range * 0.12;
  const yMax = maxVal + padded;
  const yMin = minVal - padded;
  const yRange = yMax - yMin;

  const toX = (i: number) => PAD.left + (i / (n - 1 || 1)) * chartW;
  const toY = (v: number) => PAD.top + chartH - ((v - yMin) / yRange) * chartH;

  const fmt = formatY ?? ((v: number) => v.toFixed(0));

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + (yRange * i) / (tickCount - 1));
  const labelStep = Math.ceil(n / 7);

  // Build annotation x-indices
  const annotationMap = new Map<number, ChartAnnotation>();
  for (const ann of data.annotations ?? []) {
    if (typeof ann.x === 'number') {
      annotationMap.set(ann.x, ann);
    } else {
      const idx = data.labels.indexOf(ann.x as string);
      if (idx >= 0) annotationMap.set(idx, ann);
    }
  }

  const pathD = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const secD = data.secondaryValues
    ? data.secondaryValues.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
    : null;

  return (
    <div>
      <svg width={width} height={height}>
        {/* Grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={toY(t)} x2={PAD.left + chartW} y2={toY(t)} stroke={colors.border} strokeWidth={0.5} />
            <text x={PAD.left - 5} y={toY(t) + 4} textAnchor="end" fill={colors.textMuted} fontSize={9}>
              {fmt(t)}
            </text>
          </g>
        ))}

        {/* Annotation vertical lines — behind the chart line */}
        {Array.from(annotationMap.entries()).map(([idx, ann]) => {
          const x = toX(idx);
          const eventColor = ann.color ?? EVENT_COLORS[ann.type ?? 'default'];
          return (
            <line
              key={idx}
              x1={x}
              y1={PAD.top}
              x2={x}
              y2={PAD.top + chartH}
              stroke={eventColor}
              strokeWidth={1}
              strokeDasharray="4,3"
              opacity={0.6}
            />
          );
        })}

        {/* Secondary line */}
        {secD && (
          <path d={secD} stroke={colors.gold} strokeWidth={1.5} fill="none" strokeDasharray="5,3" opacity={0.7} />
        )}

        {/* Main line */}
        <path d={pathD} stroke={colors.primary} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Annotation dots + labels at top */}
        {Array.from(annotationMap.entries()).map(([idx, ann]) => {
          const x = toX(idx);
          const eventColor = ann.color ?? EVENT_COLORS[ann.type ?? 'default'];
          const labelY = PAD.top - 6;

          return (
            <g key={idx}>
              <circle cx={x} cy={toY(vals[idx] ?? 0)} r={4} fill={eventColor} />
              {/* Rotated label at top */}
              <text
                x={x}
                y={labelY}
                textAnchor="middle"
                fill={eventColor}
                fontSize={8}
                fontWeight="600"
              >
                {ann.label.length > 10 ? ann.label.slice(0, 10) : ann.label}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {data.labels.map((label, i) => {
          if (i % labelStep !== 0 && i !== n - 1) return null;
          return (
            <text key={i} x={toX(i)} y={PAD.top + chartH + 14} textAnchor="middle" fill={colors.textMuted} fontSize={9}>
              {label}
            </text>
          );
        })}
      </svg>

      {/* Event type legend */}
      {(data.annotations ?? []).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingLeft: PAD.left, marginTop: 2 }}>
          {[...new Set((data.annotations ?? []).map((a) => a.type ?? 'default'))].map((type) => (
            <div key={type} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 2, backgroundColor: EVENT_COLORS[type], borderRadius: 1 }} />
              <span style={{ color: colors.textMuted, fontSize: 9, textTransform: 'capitalize' }}>{type}</span>
            </div>
          ))}
          {data.secondaryLabel && (
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 2, backgroundColor: colors.gold, borderRadius: 1 }} />
              <span style={{ color: colors.textMuted, fontSize: 9 }}>{data.secondaryLabel}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
