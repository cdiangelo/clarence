import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { CandlestickData, ChartConfig } from '../../lib/charts';

interface Props {
  data: CandlestickData;
  config?: ChartConfig;
  width?: number;
}

const PADDING = { top: 16, right: 16, bottom: 44, left: 52 };
const VOL_RATIO = 0.2; // volume panel takes 20% of height

export function CandlestickChart({ data, config, width = 340 }: Props) {
  const totalHeight = config?.height ?? 240;
  const volH = data.bars.some((b) => b.volume) ? totalHeight * VOL_RATIO : 0;
  const priceH = totalHeight - volH;
  const chartW = width - PADDING.left - PADDING.right;
  const priceArea = priceH - PADDING.top - PADDING.bottom;

  const bars = data.bars.slice(-80); // cap for readability
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const maxPrice = Math.max(...highs);
  const minPrice = Math.min(...lows);
  const priceRange = maxPrice - minPrice || 1;
  const padded = priceRange * 0.05;
  const yMax = maxPrice + padded;
  const yMin = minPrice - padded;
  const yRange = yMax - yMin;

  const maxVol = volH > 0 ? Math.max(...bars.map((b) => b.volume ?? 0)) : 1;

  const n = bars.length;
  const candleW = Math.max(3, (chartW / n) * 0.7);
  const spacing = chartW / n;

  const toY = (v: number) => PADDING.top + priceArea - ((v - yMin) / yRange) * priceArea;

  // Y price ticks
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount }, (_, i) => yMin + (yRange * i) / (tickCount - 1));

  // X label step
  const labelStep = Math.ceil(n / 6);

  return (
    <View>
      <Svg width={width} height={totalHeight}>
        {/* Price area grid */}
        {ticks.map((t, i) => (
          <G key={i}>
            <Line
              x1={PADDING.left}
              y1={toY(t)}
              x2={PADDING.left + chartW}
              y2={toY(t)}
              stroke={colors.border}
              strokeWidth={0.5}
            />
            <SvgText x={PADDING.left - 4} y={toY(t) + 4} textAnchor="end" fill={colors.textMuted} fontSize={9}>
              {t.toFixed(0)}
            </SvgText>
          </G>
        ))}

        {/* Candlesticks */}
        {bars.map((bar, i) => {
          const isGain = bar.close >= bar.open;
          const barColor = isGain ? colors.gain : colors.loss;
          const cx = PADDING.left + i * spacing + spacing / 2;
          const bodyTop = toY(Math.max(bar.open, bar.close));
          const bodyBot = toY(Math.min(bar.open, bar.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          const wickTop = toY(bar.high);
          const wickBot = toY(bar.low);

          return (
            <G key={i}>
              {/* Wick */}
              <Line x1={cx} y1={wickTop} x2={cx} y2={wickBot} stroke={barColor} strokeWidth={1} />
              {/* Body */}
              <Rect
                x={cx - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
                fill={isGain ? barColor : barColor}
                opacity={isGain ? 0.85 : 0.9}
              />
            </G>
          );
        })}

        {/* Volume bars */}
        {volH > 0 &&
          bars.map((bar, i) => {
            const vol = bar.volume ?? 0;
            const isGain = bar.close >= bar.open;
            const cx = PADDING.left + i * spacing + spacing / 2;
            const bh = (vol / maxVol) * (volH - 8);
            const by = priceH + (volH - 8 - bh);
            return (
              <Rect
                key={i}
                x={cx - candleW / 2}
                y={by}
                width={candleW}
                height={Math.max(1, bh)}
                fill={isGain ? colors.gain : colors.loss}
                opacity={0.4}
              />
            );
          })}

        {/* X labels */}
        {bars.map((bar, i) => {
          if (i % labelStep !== 0 && i !== n - 1) return null;
          const cx = PADDING.left + i * spacing + spacing / 2;
          const label = bar.date.slice(5); // MM-DD
          return (
            <SvgText
              key={i}
              x={cx}
              y={priceH - PADDING.bottom + 22}
              textAnchor="middle"
              fill={colors.textMuted}
              fontSize={8}
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
