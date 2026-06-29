import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { RadialScatterData } from '../../lib/charts';

interface Props {
  data: RadialScatterData;
  size?: number;
}

export function RadialScatterChart({ data, size = 300 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const ringCount = data.rings ?? 4;
  const maxVal = data.maxRadius ?? Math.max(...data.points.map((p) => p.radius), 1);
  const palette = colors.chart;

  // Category → color map
  const catMap = new Map<string, string>();
  data.categories?.forEach((c, i) => catMap.set(c.name, c.color ?? palette[i % palette.length]));

  function getColor(p: import('../../lib/charts').RadialScatterPoint) {
    if (p.color) return p.color;
    if (p.category && catMap.has(p.category)) return catMap.get(p.category)!;
    return palette[0];
  }

  // Polar → Cartesian, 0° at top, clockwise
  function toXY(angleDeg: number, radius: number) {
    const r = (Math.max(0, Math.min(radius, maxVal)) / maxVal) * maxR;
    const θ = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(θ), y: cy + r * Math.sin(θ) };
  }

  const spokeLabels = data.spokeLabels ?? [];
  const spokeCount = spokeLabels.length > 0 ? spokeLabels.length : 8;
  const spokeDeg = 360 / spokeCount;

  return (
    <View>
      <Svg width={size} height={size}>
        {/* Concentric rings */}
        {Array.from({ length: ringCount }, (_, ri) => {
          const r = ((ri + 1) / ringCount) * maxR;
          const label = data.ringLabels?.[ri] ?? `${((maxVal * (ri + 1)) / ringCount).toFixed(ri < 2 ? 1 : 0)}`;
          const isOuter = ri === ringCount - 1;
          return (
            <G key={ri}>
              <Circle
                cx={cx}
                cy={cy}
                r={r}
                fill="transparent"
                stroke={colors.border}
                strokeWidth={isOuter ? 1 : 0.6}
                strokeDasharray={isOuter ? undefined : '3,4'}
              />
              <SvgText x={cx + 3} y={cy - r + 9} fill={colors.textMuted} fontSize={8}>
                {label}
              </SvgText>
            </G>
          );
        })}

        {/* Spoke lines + labels */}
        {Array.from({ length: spokeCount }, (_, i) => {
          const angle = i * spokeDeg;
          const { x, y } = toXY(angle, maxVal);
          const θ = (angle - 90) * (Math.PI / 180);
          const lx = cx + (maxR + 16) * Math.cos(θ);
          const ly = cy + (maxR + 16) * Math.sin(θ);
          const anchor = Math.abs(lx - cx) < 5 ? 'middle' : lx > cx ? 'start' : 'end';
          const label = spokeLabels[i];
          return (
            <G key={i}>
              <Line x1={cx} y1={cy} x2={x} y2={y} stroke={colors.border} strokeWidth={0.5} />
              {label && (
                <SvgText x={lx} y={ly + 4} textAnchor={anchor} fill={colors.textSecondary} fontSize={9}>
                  {label}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Data points */}
        {data.points.map((p, i) => {
          const { x, y } = toXY(p.angle, p.radius);
          const dotR = p.size ?? 5;
          const c = getColor(p);
          return (
            <G key={i}>
              <Circle cx={x} cy={y} r={dotR} fill={`${c}BB`} stroke={c} strokeWidth={1} />
              {p.label && (
                <SvgText x={x + dotR + 2} y={y + 4} fill={colors.textSecondary} fontSize={8}>
                  {p.label}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>

      {data.categories && data.categories.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
          {data.categories.map((cat, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 4.5,
                  backgroundColor: cat.color ?? palette[i % palette.length],
                }}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{cat.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
