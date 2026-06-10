import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: string;
  elevated?: boolean;
}

export function Card({ children, style, accent, elevated = false }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: accent ? `${accent}30` : colors.border,
        },
        accent && { borderLeftWidth: 3, borderLeftColor: accent },
        style,
      ]}
    >
      {children}
    </View>
  );
}
