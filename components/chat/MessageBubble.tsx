import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ChatMessage } from '../../stores/chat';
import { ChartRenderer } from '../charts/ChartRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
}

const TOOL_LABELS: Record<string, string> = {
  fetch_stock_data: 'Fetched quote',
  fetch_financial_statements: 'Pulled financials',
  fetch_price_history: 'Loaded price history',
  fetch_options_chain: 'Fetched options chain',
  analyze_options_arbitrage: 'Analyzed arbitrage',
  fetch_url: 'Fetched URL',
  save_thesis: 'Saved thesis',
  update_thesis: 'Updated thesis',
  add_to_watchlist: 'Added to watchlist',
  add_portfolio_position: 'Added position',
  create_chart: 'Created chart',
  generate_pdf_report: 'Generated PDF',
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
        <Text style={[typography.caption, { marginBottom: 4, color: colors.primary, letterSpacing: 1 }]}>
          ANALYST
        </Text>
      )}

      <View
        style={{
          maxWidth: '88%',
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
            { fontSize: 14, lineHeight: 21, color: isUser ? '#FFFFFF' : colors.text },
          ]}
        >
          {message.content}
        </Text>
      </View>

      {/* Tool use badges */}
      {message.toolsUsed && message.toolsUsed.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 5, maxWidth: '88%' }}>
          {[...new Set(message.toolsUsed)].map((t, i) => (
            <View
              key={i}
              style={{
                backgroundColor: `${colors.primary}18`,
                borderRadius: radius.full,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderWidth: 1,
                borderColor: `${colors.primary}30`,
              }}
            >
              <Text style={{ color: colors.primaryLight, fontSize: 10, fontWeight: '600' }}>
                {TOOL_LABELS[t] ?? t}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Inline charts */}
      {!isUser && message.charts && message.charts.length > 0 && (
        <View style={{ maxWidth: '100%', marginTop: 4 }}>
          {message.charts.map((chart) => (
            <ChartRenderer key={chart.id} spec={chart} />
          ))}
        </View>
      )}
    </View>
  );
}
