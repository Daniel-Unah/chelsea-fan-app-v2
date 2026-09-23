/**
 * Launch palette. Screens should use these tokens.
 * A team's own colors can replace them once team records exist.
 */
export const Colors = {
  light: {
    text: '#0B1F33',
    textSecondary: '#5C6B7A',
    background: '#F4F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E6EEF6',
    primary: '#034694',
    secondary: '#DBA111',
    border: '#D5DEE8',
  },
  dark: {
    text: '#F4F7FB',
    textSecondary: '#B7C3D0',
    background: '#071422',
    backgroundElement: '#102033',
    backgroundSelected: '#17304A',
    primary: '#6BA6E8',
    secondary: '#E3C36A',
    border: '#1E3348',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 480;
