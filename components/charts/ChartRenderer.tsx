import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { colors, spacing, radius, typography } from '../../constants/theme';
import type { ChartSpec } from '../../lib/charts';
import { BarChart } from './BarChart';
import { LineChart } from './LineChart';
import { WaterfallChart } from './WaterfallChart';
import { RadarChart } from './RadarChart';
import { CandlestickChart } from './CandlestickChart';
import { ScatterChart } from './ScatterChart';
import { ComboChart } from './ComboChart';
import { SlopeChart } from './SlopeChart';
import { HeatmapChart } from './HeatmapChart';
import { AnnotatedLineChart } from './AnnotatedLineChart';

interface Props {
  spec: ChartSpec;
}

export function ChartRenderer({ spec }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.min(windowWidth - spacing.md * 2 - 24, 380);

  function renderChart() {
    const d = spec.data;
    const cfg = spec.config;
    switch (spec.type) {
      case 'bar':
        return <BarChart data={d as never} config={cfg} width={chartWidth} />;
      case 'line':
        return <LineChart data={d as never} config={cfg} width={chartWidth} />;
      case 'waterfall':
        return <WaterfallChart data={d as never} config={cfg} width={chartWidth} />;
      case 'radar':
        return <RadarChart data={d as never} config={cfg} size={Math.min(chartWidth, 280)} />;
      case 'candlestick':
        return <CandlestickChart data={d as never} config={cfg} width={chartWidth} />;
      case 'scatter':
        return <ScatterChart data={d as never} config={cfg} width={chartWidth} />;
      case 'combo':
        return <ComboChart data={d as never} config={cfg} width={chartWidth} />;
      case 'slope':
        return <SlopeChart data={d as never} width={chartWidth} />;
      case 'heatmap':
        return <HeatmapChart data={d as never} width={chartWidth} />;
      case 'annotated_line':
        return <AnnotatedLineChart data={d as never} width={chartWidth} />;
      default:
        return <Text style={{ color: colors.textMuted, fontSize: 12 }}>Unknown chart type: {spec.type}</Text>;
    }
  }

  return (
    <View
      style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        marginTop: spacing.sm,
        overflow: 'hidden',
      }}
    >
      <Text style={[typography.label, { color: colors.text, marginBottom: 2, fontSize: 13 }]}>
        {spec.title}
      </Text>
      {spec.subtitle && (
        <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
          {spec.subtitle}
        </Text>
      )}
      {renderChart()}
    </View>
  );
}
