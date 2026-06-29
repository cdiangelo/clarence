import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { Thesis } from '../../stores/research';

interface Props {
  thesis: Thesis;
  onPress?: () => void;
}

const STAGE_COLORS: Record<string, string> = {
  developing: colors.gold,
  active: colors.gain,
  testing: colors.primary,
  watching: colors.textSecondary,
  closed: colors.textMuted,
};

const DIR_COLOR: Record<string, string> = {
  long: colors.gain,
  short: colors.loss,
  neutral: colors.textSecondary,
};

export function ThesisCard({ thesis, onPress }: Props) {
  const [expanded, setExpanded] = useState(false);
  const stageColor = STAGE_COLORS[thesis.stage] ?? colors.textMuted;
  const dirColor = DIR_COLOR[thesis.direction] ?? colors.textSecondary;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => { setExpanded(!expanded); onPress?.(); }}
      style={{
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        borderLeftWidth: 3,
        borderLeftColor: stageColor,
        padding: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
            {thesis.ticker && (
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13, fontFamily: 'monospace' }}>
                {thesis.ticker}
              </Text>
            )}
            <View style={{
              backgroundColor: `${dirColor}20`,
              borderRadius: radius.sm,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}>
              <Text style={{ color: dirColor, fontSize: 10, fontWeight: '700' }}>
                {thesis.direction.toUpperCase()}
              </Text>
            </View>
            <View style={{
              backgroundColor: `${stageColor}18`,
              borderRadius: radius.sm,
              paddingHorizontal: 6,
              paddingVertical: 1,
            }}>
              <Text style={{ color: stageColor, fontSize: 10, fontWeight: '600' }}>
                {thesis.stage}
              </Text>
            </View>
          </View>
          <Text style={[typography.h3, { fontSize: 14 }]} numberOfLines={expanded ? undefined : 2}>
            {thesis.title}
          </Text>
        </View>

        {/* Conviction stars */}
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.gold, fontSize: 12, letterSpacing: 1 }}>
            {'★'.repeat(thesis.conviction)}{'☆'.repeat(5 - thesis.conviction)}
          </Text>
          <Text style={[typography.caption, { marginTop: 2 }]}>
            {new Date(thesis.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </View>
      </View>

      {/* Timing range */}
      {thesis.timingRange && (
        <View style={{
          marginTop: spacing.sm,
          backgroundColor: `${colors.primary}10`,
          borderRadius: radius.sm,
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}>
          <Text style={{ color: colors.primaryLight, fontSize: 11 }}>
            ⏱ {thesis.timingRange}
          </Text>
        </View>
      )}

      {/* Expanded: hypothesis + top assumptions */}
      {expanded && (
        <View style={{ marginTop: spacing.sm }}>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, lineHeight: 18 }]}>
            {thesis.hypothesis}
          </Text>

          {thesis.keyAssumptions.length > 0 && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={[typography.label, { color: colors.textMuted, marginBottom: 4 }]}>
                KEY ASSUMPTIONS
              </Text>
              {thesis.keyAssumptions.slice(0, 3).map((a, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 3 }}>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    marginTop: 5,
                    backgroundColor: a.confidence === 'high' ? colors.gain : a.confidence === 'medium' ? colors.gold : colors.loss,
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: 12, lineHeight: 17 }}>{a.text}</Text>
                    {a.softnessFlag && (
                      <Text style={{ color: colors.loss, fontSize: 10, marginTop: 1 }}>⚠ {a.softnessFlag}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Target / stop */}
          {(thesis.targetPrice || thesis.stopLoss) && (
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
              {thesis.targetPrice && (
                <Text style={{ color: colors.gain, fontSize: 12 }}>Target ${thesis.targetPrice.toFixed(2)}</Text>
              )}
              {thesis.stopLoss && (
                <Text style={{ color: colors.loss, fontSize: 12 }}>Stop ${thesis.stopLoss.toFixed(2)}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}
