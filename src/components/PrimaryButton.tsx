import React from 'react';
import { Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'tertiary';
}

export default function PrimaryButton({ 
  title, 
  onPress, 
  disabled = false,
  style,
  variant = 'primary'
}: PrimaryButtonProps) {
  // Для primary используем градиент
  if (variant === 'primary' && !disabled) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          style,
        ]}
        onPress={onPress}
      >
        <LinearGradient
          colors={['#1E4C60', '#3E9DC6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.textPrimary}>
            {title}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  // Для остальных вариантов
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'tertiary' && styles.buttonTertiary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.text,
        variant === 'secondary' && styles.textSecondary,
        variant === 'tertiary' && styles.textTertiary,
        disabled && styles.textDisabled
      ]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    height: 56,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E9E8',
    paddingHorizontal: 32,
  },
  buttonTertiary: {
    backgroundColor: '#E6E9E8',
    paddingHorizontal: 32,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    paddingHorizontal: 32,
  },
  text: {
    fontFamily: FONTS.semibold,
    color: '#fff',
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.semibold,
    textAlign: 'center',
  },
  textPrimary: {
    fontFamily: FONTS.medium,
    color: '#fff',
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: 18,
    textAlign: 'center',
  },
  textSecondary: {
    fontFamily: FONTS.medium,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: 14,
    lineHeight: 18,
    color: '#000000',
    textAlign: 'center',
  },
  textTertiary: {
    fontFamily: FONTS.medium,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: 14,
    lineHeight: 18,
    color: '#8B8B8B',
    textAlign: 'center',
  },
  textDisabled: {
    color: '#999',
  },
});



