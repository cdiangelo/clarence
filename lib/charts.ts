export type ChartType = 'bar' | 'line' | 'waterfall' | 'radar' | 'scatter' | 'candlestick' | 'combo' | 'slope' | 'heatmap' | 'annotated_line' | 'sunburst' | 'radial_scatter' | 'radial_timeline' | 'slanted_bar';

export interface ChartSpec {
  id: string;
  type: ChartType;
  title: string;
  subtitle?: string;
  data: unknown;
  config?: ChartConfig;
}

export interface ChartConfig {
  colors?: string[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  showValues?: boolean;
  formatY?: 'number' | 'percent' | 'currency' | 'billions';
}

// Bar chart
export interface BarData {
  labels: string[];
  datasets: { label: string; values: number[]; color?: string }[];
}

// Line chart
export interface LineData {
  labels: string[];
  datasets: { label: string; values: number[]; color?: string }[];
}

// Waterfall chart — each item builds on prior running total
export interface WaterfallItem {
  label: string;
  value: number;
  isTotal?: boolean;
  isSubtotal?: boolean;
}

export interface WaterfallData {
  items: WaterfallItem[];
  // computed by processWaterfall
  processed?: ProcessedWaterfallItem[];
}

export interface ProcessedWaterfallItem {
  label: string;
  start: number;
  end: number;
  value: number;
  color: 'gain' | 'loss' | 'total';
}

// Radar chart
export interface RadarData {
  axes: string[];
  datasets: { label: string; values: number[]; color?: string }[];
  maxValue?: number;
}

// Scatter chart
export interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  highlight?: boolean;
}

export interface ScatterData {
  points: ScatterPoint[];
  regressionLine?: { slope: number; intercept: number };
}

// Candlestick chart
export interface CandleBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandlestickData {
  bars: CandleBar[];
}

// Combo chart (bar + line overlay)
export interface ComboData {
  labels: string[];
  bars: { label: string; values: number[]; color?: string };
  lines: { label: string; values: number[]; color?: string }[];
}

// Sunburst chart — hierarchical concentric rings
export interface SunburstNode {
  name: string;
  value?: number;
  color?: string;
  children?: SunburstNode[];
}

export interface SunburstData {
  root: SunburstNode;
}

// Radial scatter — polar coordinate scatter plot
export interface RadialScatterPoint {
  angle: number;       // degrees 0–360
  radius: number;      // 0 to maxRadius
  label?: string;
  size?: number;
  color?: string;
  category?: string;
}

export interface RadialScatterData {
  points: RadialScatterPoint[];
  maxRadius?: number;
  rings?: number;
  ringLabels?: string[];
  spokeLabels?: string[];
  categories?: { name: string; color: string }[];
}

// Radial timeline — events arranged on a circular time track
export interface RadialTimelineEvent {
  date: string;
  label: string;
  description?: string;
  type?: 'milestone' | 'event' | 'catalyst' | 'risk';
  color?: string;
}

export interface RadialTimelineData {
  events: RadialTimelineEvent[];
  startDate: string;
  endDate: string;
  centerLabel?: string;
}

// Slanted bar — parallelogram-shaped bars for visual dynamism
export interface SlantedBarData {
  labels: string[];
  datasets: { label: string; values: number[]; color?: string }[];
  slantDeg?: number;
}

export function processWaterfall(items: WaterfallItem[]): ProcessedWaterfallItem[] {
  const result: ProcessedWaterfallItem[] = [];
  let running = 0;

  for (const item of items) {
    if (item.isTotal || item.isSubtotal) {
      result.push({ label: item.label, start: 0, end: item.value || running, value: item.value || running, color: 'total' });
      if (item.isTotal) running = item.value || running;
    } else {
      const start = running;
      running += item.value;
      result.push({ label: item.label, start, end: running, value: item.value, color: item.value >= 0 ? 'gain' : 'loss' });
    }
  }

  return result;
}

export function computeRegressionLine(points: ScatterPoint[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function radarVertices(n: number, cx: number, cy: number, r: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => ({
    x: cx + r * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + r * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
}

export function makeChartSpec(type: ChartType, title: string, data: unknown, config?: ChartConfig): ChartSpec {
  return {
    id: Math.random().toString(36).slice(2),
    type,
    title,
    data,
    config,
  };
}

export function formatChartValue(v: number, format: ChartConfig['formatY']): string {
  switch (format) {
    case 'percent': return `${v.toFixed(1)}%`;
    case 'currency': return `$${v.toFixed(2)}`;
    case 'billions':
      if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
      if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
      return `$${v.toFixed(0)}`;
    default: return v.toFixed(1);
  }
}
