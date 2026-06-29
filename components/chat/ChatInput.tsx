import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  suggestions?: string[];
}

export function ChatInput({ onSend, disabled = false, suggestions = [] }: ChatInputProps) {
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {suggestions.length > 0 && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.sm,
          }}
        >
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onSend(s)}
              disabled={disabled}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.borderLight,
                paddingHorizontal: spacing.md,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
          paddingTop: spacing.sm,
          gap: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder="Ask anything — stocks, options, thesis..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
          style={{
            flex: 1,
            backgroundColor: colors.surfaceElevated,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            color: colors.text,
            fontSize: 15,
            lineHeight: 22,
            maxHeight: 120,
          }}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={disabled || !text.trim()}
          activeOpacity={0.8}
          style={{
            width: 42,
            height: 42,
            borderRadius: radius.full,
            backgroundColor: disabled || !text.trim() ? colors.surfaceElevated : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
