export const colors = {
  bg: '#060A14',
  surface: '#0B1120',
  surfaceElevated: '#111926',
  border: '#1A2335',
  borderLight: '#233045',

  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  primaryDim: '#3B82F620',

  gain: '#10B981',
  gainDim: '#10B98120',
  loss: '#EF4444',
  lossDim: '#EF444420',
  gold: '#F59E0B',
  goldDim: '#F59E0B20',

  chart: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'] as string[],

  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  text: '#F0F6FF',
  textSecondary: '#7B8FB0',
  textMuted: '#3D4E6B',
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text, lineHeight: 23 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, color: colors.textSecondary, lineHeight: 19 },
  caption: { fontSize: 11, fontWeight: '500' as const, color: colors.textMuted, letterSpacing: 0.4 },
  label: { fontSize: 12, fontWeight: '600' as const, color: colors.textSecondary, letterSpacing: 0.3 },
  mono: { fontSize: 13, fontFamily: 'monospace' as const, color: colors.textSecondary },
  monoSm: { fontSize: 12, fontFamily: 'monospace' as const, color: colors.textMuted },
};
