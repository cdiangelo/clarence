import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { colors, spacing, typography } from '../../constants/theme';
import { ChatInput } from '../../components/chat/ChatInput';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { useChatStore } from '../../stores/chat';
import { buildContext, buildToolHandler } from '../../lib/context';

const SUGGESTIONS = [
  "What should I focus on today?",
  "Log a workout",
  "How's my spending this month?",
  "Plan a weekend trip",
  "I'm feeling stressed",
  "Suggest a healthy meal",
];

export default function ChatScreen() {
  const params = useLocalSearchParams<{ prompt?: string }>();
  const { messages, isLoading, send, clear } = useChatStore();
  const listRef = useRef<FlatList>(null);
  const sentPromptRef = useRef(false);

  useEffect(() => {
    if (params.prompt && !sentPromptRef.current && !isLoading) {
      sentPromptRef.current = true;
      handleSend(params.prompt);
    }
  }, [params.prompt]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend(text: string) {
    const ctx = buildContext();
    const toolHandler = buildToolHandler();
    await send(text, ctx, toolHandler);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View>
          <Text style={typography.h3}>Clarence</Text>
          <Text style={[typography.caption, { color: colors.chat }]}>
            {isLoading ? 'Thinking...' : 'Your personal companion'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={clear}
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        contentContainerStyle={{
          paddingVertical: spacing.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl }}>
            <Text style={{ fontSize: 32, marginBottom: spacing.md }}>✦</Text>
            <Text style={[typography.h3, { textAlign: 'center', marginBottom: spacing.sm }]}>
              Hey, I'm Clarence.
            </Text>
            <Text style={[typography.bodySmall, { textAlign: 'center', lineHeight: 22 }]}>
              I can help you manage your schedule, track health, plan trips, manage finances, and a lot more — just talk to me.
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoading ? (
            <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
              <View
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.surfaceElevated,
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isLoading}
        suggestions={messages.length === 0 ? SUGGESTIONS : []}
      />
    </SafeAreaView>
  );
}
