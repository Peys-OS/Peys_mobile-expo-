export const colors = {
  light: {
    background: '#FAFAFA',
    surface: '#FFFFFF',
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
    border: '#E0E0E0',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
  },
  dark: {
    background: '#000000',
    surface: '#1A1A1A',
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    tertiary: '#666666',
    border: '#333333',
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textTertiary: '#666666',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 36,
};

export type ThemeColors = typeof colors.light;