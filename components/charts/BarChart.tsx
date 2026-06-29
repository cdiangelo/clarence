import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { BarData, ChartConfig } from '../../lib/charts';
import { formatChartValue } from '../../lib/charts';

interface Props {
  data: BarData;
  config?: ChartConfig;
  width?: number;
}

const PADDING = { top: 20, right: 16, bottom: 48, left: 52 };

export function BarChart({ data, config, width = 320 }: Props) {
  const height = config?.height ?? 200;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const allValues = data.datasets.flatMap((d) => d.values);
  const maxVal = Math.max(...allValues, 0);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const nGroups = data.labels.length;
  const nSeries = data.datasets.length;
  const groupW = chartW / nGroups;
  const barW = Math.max(4, (groupW * 0.7) / nSeries);
  const barGap = (groupW - barW * nSeries) / 2;

  const toY = (v: number) => chartH - ((v - minVal) / range) * chartH;
  const zeroY = toY(0);

  // Y axis ticks
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => minVal + (range * i) / (tickCount - 1));
  const fmt = config?.formatY ?? 'number';

  const chartColors = config?.colors ?? colors.chart;

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {ticks.map((t, i) => {
          const y = PADDING.top + toY(t);
          return (
            <G key={i}>
              <Line
                x1={PADDING.left}
                y1={y}
                x2={PADDING.left + chartW}
                y2={y}
                stroke={colors.border}
                strokeWidth={0.5}
              />
              <SvgText
                x={PADDING.left - 6}
                y={y + 4}
                textAnchor="end"
                fill={colors.textMuted}
                fontSize={9}
              >
                {formatChartValue(t, fmt)}
              </SvgText>
            </G>
          );
        })}

        {/* Zero line */}
        {minVal < 0 && (
          <Line
            x1={PADDING.left}
            y1={PADDING.top + zeroY}
            x2={PADDING.left + chartW}
            y2={PADDING.top + zeroY}
            stroke={colors.border}
            strokeWidth={1}
          />
        )}

        {/* Bars */}
        {data.labels.map((label, gi) => {
          const gx = PADDING.left + gi * groupW;
          return (
            <G key={gi}>
              {data.datasets.map((ds, si) => {
                const v = ds.values[gi] ?? 0;
                const barColor = ds.color ?? chartColors[si % chartColors.length];
                const barH = Math.abs(toY(v) - zeroY);
                const barY = PADDING.top + Math.min(toY(v), zeroY);
                const bx = gx + barGap + si * barW;

                return (
                  <G key={si}>
                    <Rect
                      x={bx}
                      y={barY}
                      width={barW - 1}
                      height={Math.max(1, barH)}
                      fill={barColor}
                      rx={2}
                    />
                    {config?.showValues && (
                      <SvgText
                        x={bx + barW / 2}
                        y={barY - 3}
                        textAnchor="middle"
                        fill={barColor}
                        fontSize={8}
                      >
                        {formatChartValue(v, fmt)}
                      </SvgText>
                    )}
                  </G>
                );
              })}

              {/* X label */}
              <SvgText
                x={gx + groupW / 2}
                y={PADDING.top + chartH + 14}
                textAnchor="middle"
                fill={colors.textMuted}
                fontSize={9}
              >
                {label}
              </SvgText>
            </G>
          );
        })}

        {/* Axis labels */}
        {config?.xLabel && (
          <SvgText x={PADDING.left + chartW / 2} y={height - 4} textAnchor="middle" fill={colors.textSecondary} fontSize={9}>
            {config.xLabel}
          </SvgText>
        )}
        {config?.yLabel && (
          <SvgText
            x={10}
            y={PADDING.top + chartH / 2}
            textAnchor="middle"
            fill={colors.textSecondary}
            fontSize={9}
            rotation={-90}
            originX={10}
            originY={PADDING.top + chartH / 2}
          >
            {config.yLabel}
          </SvgText>
        )}
      </Svg>

      {/* Legend */}
      {data.datasets.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingLeft: PADDING.left, marginTop: 4 }}>
          {data.datasets.map((ds, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: ds.color ?? colors.chart[i % colors.chart.length] }} />
              <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{ds.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
