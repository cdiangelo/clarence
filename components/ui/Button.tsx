import React from 'react';
import { TouchableOpacity, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  color?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  color = colors.primary,
  size = 'md',
  style,
  disabled = false,
}: ButtonProps) {
  const pad = size === 'sm' ? { paddingHorizontal: spacing.md, paddingVertical: spacing.xs } : { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm + 2 };
  const fontSize = size === 'sm' ? 13 : 15;

  const bg =
    variant === 'primary' ? color : variant === 'ghost' ? 'transparent' : 'transparent';
  const textColor =
    variant === 'primary' ? '#FFFFFF' : color;
  const borderColor = variant === 'outline' ? color : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        },
        pad,
        style,
      ]}
    >
      <Text style={{ color: textColor, fontSize, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
