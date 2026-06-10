export const colors = {
  bg: '#080B14',
  surface: '#0F1320',
  surfaceElevated: '#161C2E',
  border: '#1E2540',
  borderLight: '#252D45',

  primary: '#6B5CF6',
  primaryLight: '#8B7FF8',
  primaryDim: '#6B5CF620',

  health: '#34D399',
  healthDim: '#34D39920',
  finance: '#FBBF24',
  financeDim: '#FBBF2420',
  trips: '#FB7185',
  tripsDim: '#FB718520',
  chat: '#22D3EE',
  chatDim: '#22D3EE20',

  danger: '#F87171',
  success: '#34D399',

  text: '#F0F4FF',
  textSecondary: '#7B8BB0',
  textMuted: '#3D4A6B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 30, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, fontWeight: '400' as const, color: colors.text, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted, letterSpacing: 0.3 },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textSecondary, letterSpacing: 0.2 },
  mono: { fontSize: 13, fontFamily: 'monospace' as const, color: colors.textSecondary },
};
