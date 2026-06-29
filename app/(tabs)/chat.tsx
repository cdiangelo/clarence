import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography, radius } from '../../constants/theme';
import { useChatStore } from '../../stores/chat';
import { buildContext, buildToolHandler } from '../../lib/context';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';

const SUGGESTIONS = [
  'Analyze NVDA — contrarian view?',
  'Find options arbitrage in SPY',
  'Pressure test my latest thesis',
  'Deep dive: MSFT valuation',
  'What macro regime are we in?',
  'Build a DCF for AAPL',
];

export default function ChatScreen() {
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();
  const { messages, isLoading, send, clear, addPendingChart } = useChatStore();
  const flatRef = useRef<FlatList>(null);
  const sentInitialPrompt = useRef(false);

  async function handleSend(text: string) {
    const ctx = buildContext();
    const charts: import('../../lib/charts').ChartSpec[] = [];
    // Wire chart accumulator to store
    const originalAddChart = (chart: import('../../lib/charts').ChartSpec) => {
      charts.push(chart);
      addPendingChart(chart);
    };
    const handler = buildToolHandler(charts);
    await send(text, ctx, handler);
  }

  useEffect(() => {
    if (prompt && !sentInitialPrompt.current) {
      sentInitialPrompt.current = true;
      handleSend(prompt);
    }
  }, [prompt]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <View>
          <Text style={[typography.caption, { letterSpacing: 1.5, marginBottom: 2 }]}>INVESTMENT ANALYST</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: isLoading ? colors.gold : colors.gain,
            }} />
            <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
              {isLoading ? 'Analyzing…' : 'Ready'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={clear}
          style={{
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.md,
            paddingHorizontal: spacing.sm + 4,
            paddingVertical: spacing.xs + 2,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{ paddingVertical: spacing.sm, flexGrow: 1 }}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl }}>
            <Text style={{ fontSize: 28, marginBottom: spacing.md }}>📊</Text>
            <Text style={[typography.h3, { textAlign: 'center', marginBottom: spacing.sm }]}>
              Investment Research Analyst
            </Text>
            <Text style={[typography.bodySmall, { textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg }]}>
              Deep market research, contrarian analysis, options analytics, and thesis development. Fetches live financial data and generates PDF reports.
            </Text>
          </View>
        }
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md + 4, paddingBottom: spacing.xs }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[typography.caption, { color: colors.textMuted }]}>Fetching data and analyzing…</Text>
        </View>
      )}

      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        suggestions={messages.length === 0 ? SUGGESTIONS : []}
      />
    </SafeAreaView>
  );
}
