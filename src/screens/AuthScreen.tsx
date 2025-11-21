import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import PrimaryButton from '../components/PrimaryButton';
import SupabaseService from '../services/SupabaseService';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateEmail = (email: string): boolean => {
    // Базовая проверка формата
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    
    // Блокируем тестовые и временные email
    const blockedPrefixes = ['test', 'demo', 'example', 'temp', 'temporary', 'fake', 'spam'];
    const blockedDomains = ['tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email', 'mailinator.com'];
    
    const localPart = email.split('@')[0]?.toLowerCase();
    const domain = email.split('@')[1]?.toLowerCase();
    
    // Проверка на тестовые префиксы
    if (blockedPrefixes.some(prefix => localPart.startsWith(prefix))) {
      return false;
    }
    
    // Проверка на временные домены
    if (blockedDomains.includes(domain)) {
      return false;
    }
    
    // Проверка на популярные опечатки в доменах
    const suspiciousTypos = ['gmial.com', 'gmai.com', 'gmil.com', 'gmaul.com', 'yandx.ru', 'mail.r', 'maiil.ru', 'mal.ru', 'outlok.com', 'outook.com'];
    
    if (suspiciousTypos.includes(domain)) {
      return false;
    }
    
    return true;
  };

  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Введите адрес электронной почты');
      } else {
        Alert.alert('Ошибка', 'Введите адрес электронной почты');
      }
      return;
    }

    if (!validateEmail(email)) {
      if (Platform.OS === 'web') {
        window.alert('Введите корректный адрес электронной почты');
      } else {
        Alert.alert('Ошибка', 'Введите корректный адрес электронной почты');
      }
      return;
    }

    setLoading(true);

    try {
      const { error } = await SupabaseService.sendMagicLink(email.trim().toLowerCase());

      if (error) {
        console.error('Error sending magic link:', error);
        if (Platform.OS === 'web') {
          window.alert('Ошибка при отправке письма. Попробуйте еще раз.');
        } else {
          Alert.alert('Ошибка', 'Не удалось отправить письмо. Попробуйте еще раз.');
        }
      } else {
        setEmailSent(true);
        setCountdown(60); // 60 секунд до повторной отправки
        
        if (Platform.OS === 'web') {
          window.alert(
            `✉️ Письмо отправлено!\n\nМы отправили ссылку для входа на ${email}.\n\nПроверьте почту и перейдите по ссылке для авторизации.`
          );
        } else {
          Alert.alert(
            'Письмо отправлено',
            `Мы отправили ссылку для входа на ${email}.\n\nПроверьте почту и перейдите по ссылке для авторизации.`
          );
        }
      }
    } catch (error) {
      console.error('Error:', error);
      if (Platform.OS === 'web') {
        window.alert('Произошла ошибка. Попробуйте еще раз.');
      } else {
        Alert.alert('Ошибка', 'Произошла ошибка. Попробуйте еще раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Заголовок */}
          <View style={styles.header}>
            <Text style={styles.title}>Вход в аккаунт</Text>
            <Text style={styles.subtitle}>
              Введите вашу электронную почту, и мы отправим вам ссылку для входа
            </Text>
          </View>

          {/* Поле ввода email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Электронная почта</Text>
            <TextInput
              style={styles.input}
              placeholder="example@mail.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          {/* Кнопка отправки */}
          <PrimaryButton
            title={loading ? 'Отправка...' : emailSent ? 'Отправить повторно' : 'Получить ссылку для входа'}
            onPress={handleSendMagicLink}
            disabled={loading || countdown > 0}
          />

          {/* Таймер повторной отправки */}
          {countdown > 0 && (
            <Text style={styles.countdown}>
              Повторная отправка доступна через {countdown} сек
            </Text>
          )}

          {/* Инструкция после отправки */}
          {emailSent && countdown === 0 && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📧 Не получили письмо?</Text>
              <Text style={styles.infoText}>
                • Проверьте папку "Спам" или "Промоакции"{'\n'}
                • Убедитесь, что адрес указан правильно{'\n'}
                • Нажмите "Отправить повторно"
              </Text>
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontFamily: FONTS.semibold,
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 32,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    backgroundColor: '#fff',
    color: '#333',
  },
  countdown: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  infoBox: {
    backgroundColor: '#F5F9FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  infoTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    lineHeight: 20,
  },
});


