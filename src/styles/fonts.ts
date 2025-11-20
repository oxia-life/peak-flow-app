import { Platform, TextStyle } from 'react-native';

/**
 * SF Pro Display font family configuration
 * На iOS используется системный шрифт SF Pro Display
 * На других платформах используется ближайший эквивалент
 */
export const FONTS = {
  // Regular
  regular: Platform.select({
    ios: 'SF Pro Display',
    android: 'System',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  
  // Medium
  medium: Platform.select({
    ios: 'SF Pro Display',
    android: 'System',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  
  // Semibold
  semibold: Platform.select({
    ios: 'SF Pro Display',
    android: 'System',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
  
  // Bold
  bold: Platform.select({
    ios: 'SF Pro Display',
    android: 'System',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
};

/**
 * Font weight configurations
 */
export const FONT_WEIGHTS = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

/**
 * Текстовые стили с SF Pro Display
 */
export const TEXT_STYLES = {
  // Заголовки
  h1: {
    fontFamily: FONTS.bold,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: 28,
  },
  h2: {
    fontFamily: FONTS.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: 22,
  },
  h3: {
    fontFamily: FONTS.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: 20,
  },
  h4: {
    fontFamily: FONTS.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: 18,
  },
  
  // Основной текст
  body: {
    fontFamily: FONTS.regular,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: 16,
  },
  bodyMedium: {
    fontFamily: FONTS.medium,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: 16,
  },
  bodySemibold: {
    fontFamily: FONTS.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: 16,
  },
  
  // Небольшой текст
  small: {
    fontFamily: FONTS.regular,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: 14,
  },
  smallMedium: {
    fontFamily: FONTS.medium,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: 14,
  },
  smallSemibold: {
    fontFamily: FONTS.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: 14,
  },
  
  // Совсем маленький текст
  caption: {
    fontFamily: FONTS.regular,
    fontWeight: FONT_WEIGHTS.regular,
    fontSize: 13,
  },
  captionMedium: {
    fontFamily: FONTS.medium,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: 13,
  },
  
  // Кнопки
  button: {
    fontFamily: FONTS.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: 16,
  },
  
  // Лейблы
  label: {
    fontFamily: FONTS.semibold,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: 15,
  },
};


