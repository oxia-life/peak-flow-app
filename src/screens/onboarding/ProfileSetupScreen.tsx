import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, Pressable, Modal, ScrollView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../../components/ScreenContainer';
import PrimaryButton from '../../components/PrimaryButton';
import DatePicker from '../../components/DatePicker';
import Storage from '../../services/Storage';
import { Profile } from '../../types/models';
import { OnboardingStackParamList } from '../../AppNavigator';
import { FONTS, FONT_WEIGHTS } from '../../styles/fonts';

type ProfileSetupScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'ProfileSetup'>;
};

export default function ProfileSetupScreen({ navigation }: ProfileSetupScreenProps) {
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState('');
  const [normMethod, setNormMethod] = useState<'auto' | 'manual'>('auto');
  const [manualNorm, setManualNorm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  // Ошибки валидации
  const [birthDateError, setBirthDateError] = useState('');
  const [heightError, setHeightError] = useState('');

  // Валидация даты рождения
  const validateBirthDate = (value: string) => {
    if (!value) {
      setBirthDateError('');
      return;
    }
    
    // Проверка формата ГГГГ-ММ-ДД
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      setBirthDateError('Формат: ГГГГ-ММ-ДД (например, 1990-05-15)');
      return;
    }
    
    // Проверка валидности даты
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      setBirthDateError('Введите корректную дату');
      return;
    }
    
    // Проверка что дата не в будущем
    if (date > new Date()) {
      setBirthDateError('Дата не может быть в будущем');
      return;
    }
    
    setBirthDateError('');
  };

  // Валидация роста
  const validateHeight = (value: string) => {
    if (!value) {
      setHeightError('');
      return;
    }
    
    // Проверка что только цифры
    if (!/^\d+$/.test(value)) {
      setHeightError('Только цифры (например, 170)');
      return;
    }
    
    const heightNum = parseInt(value, 10);
    if (heightNum < 50 || heightNum > 250) {
      setHeightError('Рост должен быть от 50 до 250 см');
      return;
    }
    
    setHeightError('');
  };

  const handleBirthDateChange = (value: string) => {
    setBirthDate(value);
    validateBirthDate(value);
  };

  const handleHeightChange = (value: string) => {
    setHeight(value);
    validateHeight(value);
  };

  const handleSave = async () => {
    // Validation
    const heightNum = parseInt(height, 10);
    
    // Проверка даты рождения
    if (!birthDate) {
      Alert.alert('Ошибка', 'Введите дату рождения');
      return;
    }
    
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    
    if (isNaN(birthDateObj.getTime()) || birthDateObj > today) {
      Alert.alert('Ошибка', 'Введите корректную дату рождения');
      return;
    }
    
    const age = today.getFullYear() - birthDateObj.getFullYear();
    if (age < 15 || age > 120) {
      Alert.alert('Ошибка', 'Возраст должен быть от 15 до 120 лет');
      return;
    }
    
    if (!height || isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      Alert.alert('Ошибка', 'Введите корректный рост (50-250 см)');
      return;
    }

    if (normMethod === 'manual') {
      const manualNormNum = parseInt(manualNorm, 10);
      if (!manualNorm || isNaN(manualNormNum) || manualNormNum <= 0) {
        Alert.alert('Ошибка', 'Введите корректное значение нормы ПСВ');
        return;
      }
    }

    const profile: Profile = {
      gender,
      birthDate,
      heightCm: heightNum,
      normMethod,
      manualNormValue: normMethod === 'manual' ? parseInt(manualNorm, 10) : null,
    };

    try {
      await Storage.saveProfile(profile);
      console.log('Profile saved successfully');
      
      // Отслеживание регистрации в Яндекс.Метрике (только для веб-версии)
      if (Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).ym) {
        try {
          (window as any).ym(105448967, 'reachGoal', 'peakflow_signup');
          console.log('Yandex.Metrika goal "peakflow_signup" sent');
        } catch (metrikaError) {
          console.error('Yandex.Metrika error:', metrikaError);
        }
      }
      
      // AppNavigator will detect the profile and navigate automatically
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить профиль');
      console.error('Error saving profile:', error);
    }
  };

  return (
    <ScreenContainer title="Настройка профиля">
      <View style={styles.content}>
        <Text style={styles.label}>Пол</Text>
        <View style={styles.genderContainer}>
          <Pressable
            style={[styles.genderButton, gender === 'M' && styles.genderButtonActive]}
            onPress={() => setGender('M')}
          >
            <Text style={[styles.genderText, gender === 'M' && styles.genderTextActive]}>
              Мужской
            </Text>
          </Pressable>
          <Pressable
            style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]}
            onPress={() => setGender('F')}
          >
            <Text style={[styles.genderText, gender === 'F' && styles.genderTextActive]}>
              Женский
            </Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Дата рождения</Text>
        <DatePicker
          value={birthDate}
          onChange={handleBirthDateChange}
          error={birthDateError}
        />

        <Text style={styles.label}>Рост (см)</Text>
        <TextInput
          style={[styles.input, heightError ? styles.inputError : undefined]}
          value={height}
          onChangeText={handleHeightChange}
          keyboardType="number-pad"
          placeholder="Например, 170"
          maxLength={3}
        />
        {heightError ? (
          <Text style={styles.errorText}>⚠️ {heightError}</Text>
        ) : null}

        <Text style={styles.label}>Метод расчёта нормы ПСВ</Text>
        <View style={styles.normMethodContainer}>
          <Pressable
            style={[styles.normMethodButton, normMethod === 'auto' && styles.normMethodButtonActive]}
            onPress={() => setNormMethod('auto')}
          >
            <Text style={[styles.normMethodText, normMethod === 'auto' && styles.normMethodTextActive]}>
              Авто
            </Text>
          </Pressable>
          <Pressable
            style={[styles.normMethodButton, normMethod === 'manual' && styles.normMethodButtonActive]}
            onPress={() => setNormMethod('manual')}
          >
            <Text style={[styles.normMethodText, normMethod === 'manual' && styles.normMethodTextActive]}>
              Вручную
            </Text>
          </Pressable>
        </View>

        {normMethod === 'manual' && (
          <>
            <Text style={styles.label}>Значение нормы ПСВ (л/мин)</Text>
            <TextInput
              style={styles.input}
              value={manualNorm}
              onChangeText={setManualNorm}
              keyboardType="number-pad"
              placeholder="Например, 450"
            />
          </>
        )}

        <Text style={styles.hint}>
          {normMethod === 'auto' 
            ? 'Норма будет рассчитана автоматически на основе вашего пола, возраста и роста'
            : 'Введите значение нормы, указанное вашим врачом'}
        </Text>

        {/* Согласие на обработку данных */}
        <View style={styles.checkboxContainer}>
          <Pressable onPress={() => setAgreed(!agreed)}>
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </Pressable>
          <View style={styles.checkboxTextContainer}>
            <Text style={styles.checkboxLabel}>
              Я ознакомлен(а) и согласен(на) с{' '}
            </Text>
            <Pressable onPress={() => setShowPrivacyModal(true)}>
              <Text style={styles.linkText}>условиями обработки данных</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title="Сохранить и начать"
          onPress={handleSave}
          disabled={!agreed}
        />
      </View>

      {/* Модальное окно с политикой конфиденциальности */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Обработка персональных данных</Text>
            <Pressable
              onPress={() => setShowPrivacyModal(false)}
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.modalCloseButtonPressed
              ]}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </Pressable>
          </View>
          
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            <Text style={styles.modalParagraph}>
              Все данные, которые вы вводите в приложение, надежно защищены и синхронизируются
              с облачным хранилищем. Это обеспечивает сохранность ваших данных и доступ к ним
              с любого устройства.
            </Text>

            <Text style={styles.modalParagraph}>
              Приложение использует следующие данные:
            </Text>

            <Text style={styles.modalListItem}>• Электронная почта (для авторизации)</Text>
            <Text style={styles.modalListItem}>• Пол и год рождения (для расчёта нормы ПСВ)</Text>
            <Text style={styles.modalListItem}>• Рост (для расчёта нормы ПСВ)</Text>
            <Text style={styles.modalListItem}>• Показатели пикфлоуметрии</Text>
            <Text style={styles.modalListItem}>• Симптомы (кашель, одышка, мокрота)</Text>

            <Text style={styles.modalParagraph}>
              Ваши данные защищены и не передаются третьим лицам. Вы можете в любой момент
              удалить все данные через настройки приложения.
            </Text>

            <Text style={styles.modalParagraph}>
              Для анализа использования приложения и улучшения качества сервиса используется
              Яндекс.Метрика. Собираются только обезличенные данные о взаимодействии с
              приложением (клики, просмотры страниц). Личные медицинские данные не передаются
              в Яндекс.Метрику.
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 32,
    padding: 12,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#F44336',
    marginTop: 6,
    marginBottom: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderButtonActive: {
    backgroundColor: '#0000000D',
    borderColor: '#ddd',
  },
  genderText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
  },
  genderTextActive: {
    fontFamily: FONTS.semibold,
    color: '#333',
    fontWeight: FONT_WEIGHTS.semibold,
  },
  normMethodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  normMethodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  normMethodButtonActive: {
    backgroundColor: '#0000000D',
    borderColor: '#ddd',
  },
  normMethodText: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
  },
  normMethodTextActive: {
    fontFamily: FONTS.semibold,
    color: '#333',
    fontWeight: FONT_WEIGHTS.semibold,
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    fontFamily: FONTS.bold,
    color: '#fff',
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.bold,
  },
  checkboxTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
    lineHeight: 22,
  },
  linkText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#007AFF',
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    padding: 20,
  },
  // Стили для модального окна
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    color: '#333',
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalCloseButtonPressed: {
    backgroundColor: '#E0E0E0',
  },
  modalCloseButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 20,
    color: '#666',
    fontWeight: FONT_WEIGHTS.regular,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
  },
  modalParagraph: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  modalListItem: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 8,
  },
});



