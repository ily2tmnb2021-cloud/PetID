// PetID Color System — Warm, nature-inspired palette
export const COLORS = {
  // Brand
  primary: '#4CAF82',
  primaryMuted: 'rgba(76, 175, 130, 0.12)',
  primaryDark: '#3A9A6E',
  accent: '#FF8C42',
  accentMuted: 'rgba(255, 140, 66, 0.12)',

  // Backgrounds
  background: '#F7F9F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF4EC',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#1A2E1A',
  textSecondary: '#5A7A5A',
  textTertiary: '#9AB09A',

  // Borders
  border: 'rgba(74, 124, 89, 0.1)',
  divider: 'rgba(74, 124, 89, 0.06)',

  // Status
  danger: '#E53E3E',
  dangerMuted: 'rgba(229, 62, 62, 0.1)',
  warning: '#F6AD55',
  warningMuted: 'rgba(246, 173, 85, 0.12)',
  success: '#4CAF82',
  successMuted: 'rgba(76, 175, 130, 0.12)',

  // Dark mode variants
  dark: {
    background: '#0F1A0F',
    surface: '#1A2A1A',
    surfaceSecondary: '#243324',
    surfaceElevated: '#1E2E1E',
    text: '#E8F5E8',
    textSecondary: '#8AB08A',
    textTertiary: '#5A7A5A',
    border: 'rgba(76, 175, 130, 0.15)',
    divider: 'rgba(76, 175, 130, 0.08)',
  },
};

// Category colors for wellness tips
export const CATEGORY_COLORS: Record<string, string> = {
  calming: '#7B9FE0',
  training: '#4CAF82',
  environment: '#F6AD55',
  exercise: '#FF8C42',
  diet: '#68D391',
  medical: '#FC8181',
  all: '#9AB09A',
};

// Difficulty colors
export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#4CAF82',
  medium: '#F6AD55',
  hard: '#FC8181',
};

// Species colors
export const SPECIES_COLORS: Record<string, string> = {
  dog: '#FF8C42',
  cat: '#7B9FE0',
  bird: '#68D391',
  rabbit: '#F6AD55',
  other: '#9AB09A',
};

// Legacy exports for backward compatibility with existing components
export const zincColors = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
};
export const appleBlue = '#007AFF';
export const appleRed = '#FF3B30';
export const borderColor = '#A1A1AA80';
export const appleGreen = '#34C759';

// Legacy Colors export for compatibility
export const Colors = {
  light: {
    text: COLORS.text,
    background: COLORS.background,
    tint: COLORS.primary,
    icon: COLORS.textSecondary,
    tabIconDefault: COLORS.textTertiary,
    tabIconSelected: COLORS.primary,
  },
  dark: {
    text: COLORS.dark.text,
    background: COLORS.dark.background,
    tint: COLORS.primary,
    icon: COLORS.dark.textSecondary,
    tabIconDefault: COLORS.dark.textTertiary,
    tabIconSelected: COLORS.primary,
  },
};
