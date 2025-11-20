/**
 * Application constants
 */

// Colors
export const COLORS = {
  primary: '#007AFF',
  danger: '#F44336',
  success: '#4CAF50',
  warning: '#FFC107',
  text: {
    dark: '#333',
    medium: '#666',
    light: '#999',
  },
  background: {
    white: '#fff',
    light: '#f5f5f5',
  },
  border: {
    light: '#ddd',
    medium: '#e0e0e0',
  },
  zone: {
    green: '#4CAF50',
    yellow: '#FFC107',
    red: '#F44336',
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
};

// Font sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 28,
  large: 32,
};

// PEF Zones (percentage of norm)
export const PEF_ZONES = {
  GREEN: { min: 80, max: 100, label: 'Зелёная зона' },
  YELLOW: { min: 50, max: 79, label: 'Жёлтая зона' },
  RED: { min: 0, max: 49, label: 'Красная зона' },
};

// Time periods
export const TIME_PERIODS = {
  MORNING: { value: 'morning' as const, label: 'Утро' },
  EVENING: { value: 'evening' as const, label: 'Вечер' },
};

// Validation
export const VALIDATION = {
  age: {
    min: 15,
    max: 120,
  },
  height: {
    min: 50,
    max: 250,
  },
  pef: {
    min: 0,
    max: 1000,
  },
};



