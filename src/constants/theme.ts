/**
 * Visual language taken from the Chelsea Fan App site.
 * The same palette is used in light and dark mode so the app stays on this look.
 */
const palette = {
  text: '#EDEDED',
  textSecondary: '#9CA3AF',
  background: '#070B14',
  backgroundElement: '#111827',
  backgroundSelected: '#1E293B',
  primary: '#1D4ED8',
  secondary: '#FFFFFF',
  border: '#1F2937',
  link: '#60A5FA',
} as const;

export const Colors = {
  light: palette,
  dark: palette,
} as const;

export type ThemeColor = keyof typeof palette;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const FontFamily = {
  regular: 'Geist_400Regular',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

export const MaxContentWidth = 560;
