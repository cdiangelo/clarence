import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Line, Polygon, Circle, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { RadarData, ChartConfig } from '../../lib/charts';
import { radarVertices } from '../../lib/charts';

interface Props {
  data: RadarData;
  config?: ChartConfig;
  size?: number;
}

export function RadarChart({ data, config, size = 300 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const n = data.axes.length;
  const ringCount = 5;
  const chartColors = config?.colors ?? colors.chart;

  const maxVal = data.maxValue ?? Math.max(...data.datasets.flatMap((d) => d.values), 1);

  // Outer vertices for each axis
  const outerVertices = radarVertices(n, cx, cy, r);

  // Ring polygons
  const ringPolygons = Array.from({ length: ringCount }, (_, ri) => {
    const scale = (ri + 1) / ringCount;
    return radarVertices(n, cx, cy, r * scale);
  });

  // Data polygons
  const dataPolygons = data.datasets.map((ds, si) => {
    const pts = ds.values.map((v, i) => {
      const norm = Math.max(0, Math.min(1, v / maxVal));
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      return {
        x: cx + r * norm * Math.cos(angle),
        y: cy + r * norm * Math.sin(angle),
      };
    });
    return { pts, color: ds.color ?? chartColors[si % chartColors.length], label: ds.label };
  });

  // Label positions — push them slightly beyond the outer ring
  const labelRadius = r * 1.22;
  const labelVertices = radarVertices(n, cx, cy, labelRadius);

  function polygonPoints(pts: { x: number; y: number }[]) {
    return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }

  return (
    <View>
      <Svg width={size} height={size + 20}>
        {/* Background rings */}
        {ringPolygons.map((ring, ri) => (
          <Polygon
            key={ri}
            points={polygonPoints(ring)}
            fill={ri % 2 === 0 ? `${colors.surface}80` : 'transparent'}
            stroke={colors.border}
            strokeWidth={0.5}
          />
        ))}

        {/* Axis spokes */}
        {outerVertices.map((v, i) => (
          <Line key={i} x1={cx} y1={cy} x2={v.x} y2={v.y} stroke={colors.border} strokeWidth={0.5} />
        ))}

        {/* Data polygons */}
        {dataPolygons.map(({ pts, color }, si) => (
          <G key={si}>
            <Polygon
              points={polygonPoints(pts)}
              fill={`${color}30`}
              stroke={color}
              strokeWidth={1.5}
            />
            {pts.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
            ))}
          </G>
        ))}

        {/* Axis labels */}
        {data.axes.map((axis, i) => {
          const lv = labelVertices[i];
          const ov = outerVertices[i];
          // Choose anchor based on position
          const dx = ov.x - cx;
          const anchor = Math.abs(dx) < 10 ? 'middle' : dx > 0 ? 'start' : 'end';
          return (
            <SvgText
              key={i}
              x={lv.x}
              y={lv.y + 4}
              textAnchor={anchor}
              fill={colors.textSecondary}
              fontSize={10}
              fontWeight="500"
            >
              {axis}
            </SvgText>
          );
        })}

        {/* Ring value labels on first spoke */}
        {ringPolygons.map((ring, ri) => (
          <SvgText
            key={ri}
            x={ring[0].x + 4}
            y={ring[0].y - 2}
            fill={colors.textMuted}
            fontSize={8}
          >
            {Math.round((maxVal * (ri + 1)) / ringCount)}
          </SvgText>
        ))}
      </Svg>

      {/* Legend */}
      {data.datasets.length > 1 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 4 }}>
          {data.datasets.map((ds, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ds.color ?? colors.chart[i % colors.chart.length] }} />
              <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{ds.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
