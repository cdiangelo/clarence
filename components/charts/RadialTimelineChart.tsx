import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText, G } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { RadialTimelineData } from '../../lib/charts';

const TYPE_COLORS: Record<string, string> = {
  milestone: colors.gold,
  catalyst:  colors.gain,
  risk:      colors.loss,
  event:     colors.primary,
};

interface Props {
  data: RadialTimelineData;
  size?: number;
}

export function RadialTimelineChart({ data, size = 320 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const trackR = size * 0.36;
  const innerTickR = trackR - 6;
  const outerTickR = trackR + 6;

  const start = new Date(data.startDate).getTime();
  const end = new Date(data.endDate).getTime();
  const totalMs = end - start;

  // Map date to angle (degrees), 0° at top, clockwise
  function dateToAngle(dateStr: string): number {
    const t = new Date(dateStr).getTime();
    const frac = totalMs > 0 ? Math.max(0, Math.min(1, (t - start) / totalMs)) : 0;
    return frac * 360;
  }

  function toXY(angleDeg: number, r: number) {
    const θ = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(θ), y: cy + r * Math.sin(θ) };
  }

  // Build arc path for the track ring
  function trackArc(): string {
    const r = trackR;
    // Full circle via two semicircles
    const top = { x: cx, y: cy - r };
    const bot = { x: cx, y: cy + r };
    return `M${top.x},${top.y} A${r},${r} 0 1 1 ${bot.x},${bot.y} A${r},${r} 0 1 1 ${top.x},${top.y}`;
  }

  // Quarter tick marks
  const quarters = [0, 90, 180, 270];

  // Sort events by date for alternating inside/outside placement
  const sorted = [...data.events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Alternate: even index → outer label, odd → inner label
  const OUTER_LABEL_R = trackR + 28;
  const INNER_LABEL_R = trackR - 28;

  return (
    <View>
      <Svg width={size} height={size}>
        {/* Background rings for depth */}
        <Circle cx={cx} cy={cy} r={trackR * 1.18} fill="transparent" stroke={colors.border} strokeWidth={0.4} strokeDasharray="2,4" />
        <Circle cx={cx} cy={cy} r={trackR * 0.82} fill="transparent" stroke={colors.border} strokeWidth={0.4} strokeDasharray="2,4" />

        {/* Main track circle */}
        <Path d={trackArc()} fill="transparent" stroke={colors.borderLight} strokeWidth={2} />

        {/* Quarter markers */}
        {quarters.map((q) => {
          const inner = toXY(q, innerTickR);
          const outer = toXY(q, outerTickR);
          return (
            <Line
              key={q}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke={colors.textMuted}
              strokeWidth={1.5}
            />
          );
        })}

        {/* Center label */}
        <SvgText x={cx} y={cy - 6} textAnchor="middle" fill={colors.textSecondary} fontSize={11} fontWeight="600">
          {data.centerLabel ?? data.startDate.slice(0, 4)}
        </SvgText>
        <SvgText x={cx} y={cy + 10} textAnchor="middle" fill={colors.textMuted} fontSize={8}>
          {data.endDate.slice(0, 4)}
        </SvgText>

        {/* Events */}
        {sorted.map((evt, i) => {
          const angle = dateToAngle(evt.date);
          const dot = toXY(angle, trackR);
          const isOuter = i % 2 === 0;
          const labelR = isOuter ? OUTER_LABEL_R : INNER_LABEL_R;
          const labelPt = toXY(angle, labelR);
          const linePt = toXY(angle, isOuter ? trackR + 10 : trackR - 10);
          const c = evt.color ?? TYPE_COLORS[evt.type ?? 'event'] ?? colors.primary;
          const θ = (angle - 90) * (Math.PI / 180);
          const anchor = Math.abs(Math.cos(θ)) < 0.2 ? 'middle' : Math.cos(θ) > 0 ? 'start' : 'end';

          return (
            <G key={i}>
              {/* Leader line */}
              <Line
                x1={dot.x}
                y1={dot.y}
                x2={linePt.x}
                y2={linePt.y}
                stroke={`${c}80`}
                strokeWidth={1}
              />
              {/* Event dot */}
              <Circle cx={dot.x} cy={dot.y} r={5} fill={c} opacity={0.9} />
              <Circle cx={dot.x} cy={dot.y} r={3} fill={colors.bg} />
              <Circle cx={dot.x} cy={dot.y} r={1.5} fill={c} />
              {/* Label */}
              <SvgText
                x={labelPt.x}
                y={labelPt.y + 3}
                textAnchor={anchor}
                fill={colors.text}
                fontSize={8}
                fontWeight="500"
              >
                {evt.label.length > 16 ? `${evt.label.slice(0, 15)}…` : evt.label}
              </SvgText>
              {evt.description && (
                <SvgText
                  x={labelPt.x}
                  y={labelPt.y + 13}
                  textAnchor={anchor}
                  fill={colors.textMuted}
                  fontSize={7}
                >
                  {evt.description.length > 18 ? `${evt.description.slice(0, 17)}…` : evt.description}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>

      {/* Type legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <View key={type} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ color: colors.textMuted, fontSize: 9, textTransform: 'capitalize' }}>{type}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
