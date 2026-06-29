import React from 'react';
import type { ChartSpec } from '@/lib/charts';
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
import { SunburstChart } from './SunburstChart';
import { RadialScatterChart } from './RadialScatterChart';
import { RadialTimelineChart } from './RadialTimelineChart';
import { SlantedBarChart } from './SlantedBarChart';

interface Props {
  spec: ChartSpec;
}

export function ChartRenderer({ spec }: Props) {
  const chartWidth = 380;

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
      case 'sunburst':
        return <SunburstChart data={d as never} size={Math.min(chartWidth, 320)} />;
      case 'radial_scatter':
        return <RadialScatterChart data={d as never} size={Math.min(chartWidth, 320)} />;
      case 'radial_timeline':
        return <RadialTimelineChart data={d as never} size={Math.min(chartWidth, 340)} />;
      case 'slanted_bar':
        return <SlantedBarChart data={d as never} config={cfg} width={chartWidth} />;
      default:
        return <span className="text-xs text-ink-muted">Unknown chart type: {spec.type}</span>;
    }
  }

  return (
    <div className="bg-elevated border border-border rounded-xl p-4 mt-2 overflow-hidden">
      <div className="text-sm font-semibold text-ink mb-0.5">{spec.title}</div>
      {spec.subtitle && (
        <div className="text-[11px] text-ink-muted mb-3">{spec.subtitle}</div>
      )}
      {renderChart()}
    </div>
  );
}
