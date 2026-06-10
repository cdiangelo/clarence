import React from 'react';
import { View, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ChatMessage } from '../../stores/chat';

interface MessageBubbleProps {
  message: ChatMessage;
}

const TOOL_LABELS: Record<string, string> = {
  add_event: 'Added to schedule',
  delete_event: 'Removed event',
  log_meal: 'Logged meal',
  log_workout: 'Logged workout',
  log_mood: 'Logged mood',
  log_expense: 'Logged expense',
  set_financial_goal: 'Set goal',
  set_budget: 'Updated budget',
  create_trip: 'Created trip',
  add_itinerary_item: 'Added to itinerary',
};

export function MessageBubble({ message }: MessageBubbleProps) {
  if (message.role === 'system') {
    return (
      <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>{message.content}</Text>
      </View>
    );
  }

  const isUser = message.role === 'user';

  return (
    <View
      style={{
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginVertical: spacing.xs,
        paddingHorizontal: spacing.md,
      }}
    >
      {!isUser && (
        <Text style={[typography.caption, { marginBottom: 4, color: colors.primary }]}>
          CLARENCE
        </Text>
      )}
      <View
        style={{
          maxWidth: '82%',
          backgroundColor: isUser ? colors.primary : colors.surfaceElevated,
          borderRadius: radius.lg,
          borderBottomRightRadius: isUser ? 4 : radius.lg,
          borderBottomLeftRadius: isUser ? radius.lg : 4,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          borderWidth: message.error ? 1 : 0,
          borderColor: message.error ? colors.danger : 'transparent',
        }}
      >
        <Text
          style={[
            typography.body,
            { fontSize: 15, lineHeight: 22, color: isUser ? '#FFFFFF' : colors.text },
          ]}
        >
          {message.content}
        </Text>
      </View>

      {message.toolsUsed && message.toolsUsed.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, maxWidth: '82%' }}>
          {message.toolsUsed.map((t, i) => (
            <View
              key={i}
              style={{
                backgroundColor: `${colors.primary}15`,
                borderRadius: radius.full,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: colors.primaryLight, fontSize: 11, fontWeight: '600' }}>
                ✓ {TOOL_LABELS[t] ?? t}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
