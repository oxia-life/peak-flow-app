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
  const [otpCode, setOtpCode] = useState('');
  const [verifying, setVerifying] = useState(false);

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
        console.error('Error sending OTP:', error);
        if (Platform.OS === 'web') {
          window.alert('Ошибка при отправке кода. Попробуйте еще раз.');
        } else {
          Alert.alert('Ошибка', 'Не удалось отправить код. Попробуйте еще раз.');
        }
      } else {
        setEmailSent(true);
        setCountdown(60); // 60 секунд до повторной отправки
        
        if (Platform.OS === 'web') {
          window.alert(
            `✉️ Код отправлен!\n\nМы отправили 8-значный код на ${email}.\n\nПроверьте почту и введите код ниже.`
          );
        } else {
          Alert.alert(
            'Код отправлен',
            `Мы отправили 8-значный код на ${email}.\n\nПроверьте почту и введите код ниже.`
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

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Введите код из письма');
      } else {
        Alert.alert('Ошибка', 'Введите код из письма');
      }
      return;
    }

    if (otpCode.length !== 6) {
      if (Platform.OS === 'web') {
        window.alert('Код должен содержать 8 цифр');
      } else {
        Alert.alert('Ошибка', 'Код должен содержать 8 цифр');
      }
      return;
    }

    setVerifying(true);

    try {
      const { error } = await SupabaseService.verifyOTP(email.trim().toLowerCase(), otpCode.trim());

      if (error) {
        console.error('Error verifying OTP:', error);
        if (Platform.OS === 'web') {
          window.alert('Неверный код или срок действия истек. Попробуйте еще раз.');
        } else {
          Alert.alert('Ошибка', 'Неверный код или срок действия истек. Попробуйте еще раз.');
        }
        setOtpCode(''); // Очищаем поле при ошибке
      } else {
        // Успех! Навигация произойдет автоматически через onAuthStateChange
        console.log('OTP verified successfully');
      }
    } catch (error) {
      console.error('Unexpected error during verification:', error);
      if (Platform.OS === 'web') {
        window.alert('Произошла ошибка при проверке кода.');
      } else {
        Alert.alert('Ошибка', 'Произошла ошибка при проверке кода.');
      }
    } finally {
      setVerifying(false);
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
              {emailSent 
                ? 'Введите 6-значный код из письма' 
                : 'Введите вашу электронную почту, и мы отправим вам код для входа'}
            </Text>
          </View>

          {/* Поле ввода email */}
          {!emailSent && (
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
          )}

          {/* Поле ввода OTP кода */}
          {emailSent && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Код из письма</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="00000000"
                placeholderTextColor="#999"
                value={otpCode}
                onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                editable={!verifying}
              />
              <Text style={styles.emailDisplay}>Письмо отправлено на: {email}</Text>
            </View>
          )}

          {/* Кнопка отправки/проверки */}
          {!emailSent ? (
            <PrimaryButton
              title={loading ? 'Отправка...' : 'Получить код для входа'}
              onPress={handleSendMagicLink}
              disabled={loading}
            />
          ) : (
            <>
              <PrimaryButton
                title={verifying ? 'Проверка...' : 'Войти'}
                onPress={handleVerifyOTP}
                disabled={verifying || otpCode.length !== 6}
              />
              
              {countdown > 0 ? (
                <Text style={styles.countdown}>
                  Повторная отправка доступна через {countdown} сек
                </Text>
              ) : (
                <PrimaryButton
                  title="Отправить код повторно"
                  onPress={() => {
                    setOtpCode('');
                    setEmailSent(false);
                  }}
                  variant="secondary"
                  style={{ marginTop: 12 }}
                />
              )}
            </>
          )}

          {/* Инструкция после отправки */}
          {emailSent && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>📧 Не получили код?</Text>
              <Text style={styles.infoText}>
                • Проверьте папку "Спам" или "Промоакции"{'\n'}
                • Убедитесь, что адрес указан правильно{'\n'}
                • Код действителен 10 минут{'\n'}
                • Нажмите "Отправить код повторно"
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
  otpInput: {
    fontFamily: FONTS.semibold,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 8,
    textAlign: 'center',
  },
  emailDisplay: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
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


