import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { SlantedBarData, ChartConfig } from '../../lib/charts';
import { formatChartValue } from '../../lib/charts';

interface Props {
  data: SlantedBarData;
  config?: ChartConfig;
  width?: number;
}

export function SlantedBarChart({ data, config, width = 340 }: Props) {
  const slantDeg = data.slantDeg ?? 12;
  const slantRad = (slantDeg * Math.PI) / 180;

  const PAD_LEFT = 36;
  const PAD_RIGHT = 20;
  const PAD_TOP = 16;
  const PAD_BOTTOM = 48;
  const height = config?.height ?? 220;

  const chartW = width - PAD_LEFT - PAD_RIGHT;
  const chartH = height - PAD_TOP - PAD_BOTTOM;

  const palette = config?.colors ?? colors.chart;
  const seriesCount = data.datasets.length;
  const labelCount = data.labels.length;

  // Max value across all series
  const maxVal = Math.max(...data.datasets.flatMap((ds) => ds.values), 1);

  // The slant offset at bar height equals barH * tan(slantDeg)
  // To prevent bars in the same group from overlapping, we reduce effective bar width
  // Each group occupies groupW; each bar gets groupW/seriesCount minus spacing
  const groupW = chartW / labelCount;
  const groupGap = groupW * 0.12;
  const barSlotW = (groupW - groupGap) / seriesCount;
  const barInnerGap = barSlotW * 0.08;
  const barW = barSlotW - barInnerGap;

  // slantOffset is how much the top of the bar is shifted right vs. the bottom
  function slantOffset(barH: number) {
    return barH * Math.tan(slantRad);
  }

  // Build Y grid lines
  const GRID_LINES = 4;
  const gridVals = Array.from({ length: GRID_LINES + 1 }, (_, i) => (maxVal * i) / GRID_LINES);

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {gridVals.map((v, i) => {
          const y = PAD_TOP + chartH - (v / maxVal) * chartH;
          return (
            <G key={i}>
              <Line
                x1={PAD_LEFT}
                y1={y}
                x2={PAD_LEFT + chartW}
                y2={y}
                stroke={colors.border}
                strokeWidth={i === 0 ? 1 : 0.5}
                strokeDasharray={i === 0 ? undefined : '3,4'}
              />
              <SvgText x={PAD_LEFT - 4} y={y + 4} textAnchor="end" fill={colors.textMuted} fontSize={8}>
                {formatChartValue(v, config?.formatY)}
              </SvgText>
            </G>
          );
        })}

        {/* Bars */}
        {data.labels.map((label, li) => {
          const groupX = PAD_LEFT + li * groupW + groupGap / 2;
          const yBottom = PAD_TOP + chartH;

          return (
            <G key={li}>
              {data.datasets.map((ds, si) => {
                const barX = groupX + si * barSlotW;
                const val = ds.values[li] ?? 0;
                const barH = (val / maxVal) * chartH;
                const yTop = yBottom - barH;
                const s = slantOffset(barH);
                const c = ds.color ?? palette[si % palette.length];

                // Parallelogram points:
                // bottom-left, top-left (shifted right by s), top-right (shifted right by s), bottom-right
                const pts = [
                  `${(barX).toFixed(1)},${yBottom.toFixed(1)}`,
                  `${(barX + s).toFixed(1)},${yTop.toFixed(1)}`,
                  `${(barX + barW + s).toFixed(1)},${yTop.toFixed(1)}`,
                  `${(barX + barW).toFixed(1)},${yBottom.toFixed(1)}`,
                ].join(' ');

                const labelX = barX + barW / 2 + s / 2;

                return (
                  <G key={si}>
                    <Polygon points={pts} fill={`${c}CC`} stroke={c} strokeWidth={0.8} />
                    {config?.showValues && barH > 16 && (
                      <SvgText
                        x={labelX}
                        y={yTop - 3}
                        textAnchor="middle"
                        fill={colors.text}
                        fontSize={9}
                        fontWeight="600"
                      >
                        {formatChartValue(val, config?.formatY)}
                      </SvgText>
                    )}
                  </G>
                );
              })}

              {/* X-axis label */}
              <SvgText
                x={groupX + (groupW - groupGap) / 2}
                y={yBottom + 14}
                textAnchor="middle"
                fill={colors.textSecondary}
                fontSize={9}
              >
                {label.length > 8 ? `${label.slice(0, 7)}…` : label}
              </SvgText>
            </G>
          );
        })}

        {/* Y-axis line */}
        <Line
          x1={PAD_LEFT}
          y1={PAD_TOP}
          x2={PAD_LEFT}
          y2={PAD_TOP + chartH}
          stroke={colors.borderLight}
          strokeWidth={1}
        />
      </Svg>

      {/* Legend */}
      {seriesCount > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 4 }}>
          {data.datasets.map((ds, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 14,
                  height: 8,
                  backgroundColor: ds.color ?? palette[i % palette.length],
                  transform: [{ skewX: `-${slantDeg}deg` }],
                }}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{ds.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
