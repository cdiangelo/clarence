import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { ScatterData, ChartConfig } from '../../lib/charts';
import { computeRegressionLine, formatChartValue } from '../../lib/charts';

interface Props {
  data: ScatterData;
  config?: ChartConfig;
  width?: number;
}

const PADDING = { top: 20, right: 20, bottom: 48, left: 52 };

export function ScatterChart({ data, config, width = 320 }: Props) {
  const height = config?.height ?? 220;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const xs = data.points.map((p) => p.x);
  const ys = data.points.map((p) => p.y);
  const xMax = Math.max(...xs);
  const xMin = Math.min(...xs);
  const yMax = Math.max(...ys);
  const yMin = Math.min(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const xPad = xRange * 0.1;
  const yPad = yRange * 0.1;

  const toX = (v: number) => PADDING.left + ((v - (xMin - xPad)) / (xRange + 2 * xPad)) * chartW;
  const toY = (v: number) => PADDING.top + chartH - ((v - (yMin - yPad)) / (yRange + 2 * yPad)) * chartH;

  const fmt = config?.formatY ?? 'number';

  // Compute regression if not provided
  const regression = data.regressionLine ?? computeRegressionLine(data.points);
  const regX1 = xMin - xPad;
  const regX2 = xMax + xPad;
  const regY1 = regression.slope * regX1 + regression.intercept;
  const regY2 = regression.slope * regX2 + regression.intercept;

  const xTicks = 5;
  const yTicks = 5;

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Y grid */}
        {Array.from({ length: yTicks }, (_, i) => {
          const v = (yMin - yPad) + ((yRange + 2 * yPad) * i) / (yTicks - 1);
          return (
            <G key={i}>
              <Line x1={PADDING.left} y1={toY(v)} x2={PADDING.left + chartW} y2={toY(v)} stroke={colors.border} strokeWidth={0.5} />
              <SvgText x={PADDING.left - 5} y={toY(v) + 4} textAnchor="end" fill={colors.textMuted} fontSize={9}>
                {formatChartValue(v, fmt)}
              </SvgText>
            </G>
          );
        })}

        {/* X grid */}
        {Array.from({ length: xTicks }, (_, i) => {
          const v = (xMin - xPad) + ((xRange + 2 * xPad) * i) / (xTicks - 1);
          return (
            <G key={i}>
              <Line x1={toX(v)} y1={PADDING.top} x2={toX(v)} y2={PADDING.top + chartH} stroke={colors.border} strokeWidth={0.5} />
              <SvgText x={toX(v)} y={PADDING.top + chartH + 14} textAnchor="middle" fill={colors.textMuted} fontSize={9}>
                {v.toFixed(1)}
              </SvgText>
            </G>
          );
        })}

        {/* Regression line */}
        <Line
          x1={toX(regX1)}
          y1={toY(regY1)}
          x2={toX(regX2)}
          y2={toY(regY2)}
          stroke={colors.gold}
          strokeWidth={1.5}
          strokeDasharray="5,3"
          opacity={0.7}
        />

        {/* Points */}
        {data.points.map((p, i) => (
          <G key={i}>
            <Circle
              cx={toX(p.x)}
              cy={toY(p.y)}
              r={p.highlight ? 5 : 4}
              fill={p.highlight ? colors.gold : colors.primary}
              stroke={p.highlight ? colors.gold : 'transparent'}
              strokeWidth={1}
              opacity={0.85}
            />
            {p.label && (
              <SvgText
                x={toX(p.x) + 6}
                y={toY(p.y) - 4}
                fill={colors.textSecondary}
                fontSize={8}
              >
                {p.label}
              </SvgText>
            )}
          </G>
        ))}

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
    </View>
  );
}
