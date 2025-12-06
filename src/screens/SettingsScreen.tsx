import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TextInput, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import ScreenContainer from '../components/ScreenContainer';
import PrimaryButton from '../components/PrimaryButton';
import DatePicker from '../components/DatePicker';
import Storage from '../services/Storage';
import SupabaseService from '../services/SupabaseService';
import { Profile } from '../types/models';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';

// Иконка редактирования
function EditIcon() {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path
        d="M14.166 2.5c.442-.442 1.047-.69 1.677-.69.63 0 1.235.248 1.677.69.442.442.69 1.047.69 1.677 0 .63-.248 1.235-.69 1.677l-9.166 9.166-4.167 1.25 1.25-4.167L14.166 2.5z"
        stroke="#1E4C60"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export default function SettingsScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  
  // Данные для редактирования
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState('');
  const [normMethod, setNormMethod] = useState<'auto' | 'manual'>('auto');
  const [manualNorm, setManualNorm] = useState('');
  
  // Ошибки валидации
  const [birthDateError, setBirthDateError] = useState('');
  const [heightError, setHeightError] = useState('');

  // Валидация даты рождения
  const validateBirthDate = (value: string) => {
    if (!value) {
      setBirthDateError('');
      return;
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      setBirthDateError('Формат: ГГГГ-ММ-ДД (например, 1990-05-15)');
      return;
    }
    
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      setBirthDateError('Введите корректную дату');
      return;
    }
    
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

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [savedProfile, savedChartType] = await Promise.all([
        Storage.getProfile(),
        Storage.getChartType(),
      ]);
      console.log('Loaded chart type from storage:', savedChartType);
      setProfile(savedProfile);
      setChartType(savedChartType);
      
      // Заполняем поля для редактирования
      if (savedProfile) {
        setGender(savedProfile.gender);
        setBirthDate(savedProfile.birthDate || '');
        setHeight(savedProfile.heightCm?.toString() || '');
        setNormMethod(savedProfile.normMethod);
        setManualNorm(savedProfile.manualNormValue?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    const heightNum = parseInt(height, 10);
    
    // Проверка даты рождения
    if (!birthDate) {
      if (Platform.OS === 'web') {
        window.alert('Введите дату рождения');
      } else {
        Alert.alert('Ошибка', 'Введите дату рождения');
      }
      return;
    }
    
    const birthDateObj = new Date(birthDate);
    const today = new Date();
    
    if (isNaN(birthDateObj.getTime()) || birthDateObj > today) {
      if (Platform.OS === 'web') {
        window.alert('Введите корректную дату рождения');
      } else {
        Alert.alert('Ошибка', 'Введите корректную дату рождения');
      }
      return;
    }
    
    const age = today.getFullYear() - birthDateObj.getFullYear();
    if (age < 15 || age > 120) {
      if (Platform.OS === 'web') {
        window.alert('Возраст должен быть от 15 до 120 лет');
      } else {
        Alert.alert('Ошибка', 'Возраст должен быть от 15 до 120 лет');
      }
      return;
    }
    
    if (isNaN(heightNum) || heightNum < 50 || heightNum > 250) {
      if (Platform.OS === 'web') {
        window.alert('Введите корректный рост (50-250 см)');
      } else {
        Alert.alert('Ошибка', 'Введите корректный рост (50-250 см)');
      }
      return;
    }

    if (normMethod === 'manual') {
      const manualNormNum = parseInt(manualNorm, 10);
      if (isNaN(manualNormNum) || manualNormNum <= 0) {
        if (Platform.OS === 'web') {
          window.alert('Введите корректное значение нормы ПСВ');
        } else {
          Alert.alert('Ошибка', 'Введите корректное значение нормы ПСВ');
        }
        return;
      }
    }

    const updatedProfile: Profile = {
      gender,
      birthDate,
      heightCm: heightNum,
      normMethod,
      manualNormValue: normMethod === 'manual' ? parseInt(manualNorm, 10) : null,
    };

    console.log('handleSaveProfile: Attempting to save profile:', updatedProfile);

    try {
      await Storage.saveProfile(updatedProfile);
      
      // Перезагружаем профиль из базы для подтверждения
      const savedProfile = await Storage.getProfile();
      console.log('handleSaveProfile: Profile after save:', savedProfile);
      
      if (savedProfile) {
        setProfile(savedProfile);
        // Обновляем локальные переменные состояния
        setGender(savedProfile.gender);
        setBirthDate(savedProfile.birthDate || '');
        setHeight(savedProfile.heightCm?.toString() || '');
        setNormMethod(savedProfile.normMethod);
        setManualNorm(savedProfile.manualNormValue?.toString() || '');
      }
      
      setIsEditing(false);
      
      if (Platform.OS === 'web') {
        window.alert('✅ Профиль успешно обновлен!');
      } else {
        Alert.alert('Успешно', 'Профиль обновлен');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      if (Platform.OS === 'web') {
        window.alert('❌ Ошибка при сохранении профиля');
      } else {
        Alert.alert('Ошибка', 'Не удалось сохранить профиль');
      }
    }
  };

  const calculateAge = (birthDateStr: string) => {
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Если день рождения еще не наступил в этом году, вычитаем 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };
  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      const confirm = window.confirm('Вы уверены, что хотите выйти из аккаунта?');
      if (!confirm) return;
    } else {
      Alert.alert(
        'Выход из аккаунта',
        'Вы уверены, что хотите выйти?',
        [
          { text: 'Отмена', style: 'cancel' },
          { 
            text: 'Выйти', 
            style: 'destructive',
            onPress: async () => {
              await performSignOut();
            }
          },
        ]
      );
      return;
    }
    
    await performSignOut();
  };

  const performSignOut = async () => {
    try {
      const { error } = await SupabaseService.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        if (Platform.OS === 'web') {
          window.alert('Ошибка при выходе. Попробуйте еще раз.');
        } else {
          Alert.alert('Ошибка', 'Не удалось выйти. Попробуйте еще раз.');
        }
      } else {
        console.log('Sign out successful');
        
        if (Platform.OS === 'web') {
          window.location.reload();
        } else {
          Alert.alert('Успешно', 'Вы вышли из аккаунта');
        }
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      if (Platform.OS === 'web') {
        window.alert('Произошла ошибка при выходе');
      } else {
        Alert.alert('Ошибка', 'Произошла ошибка при выходе');
      }
    }
  };

  const handleClearData = async () => {
    console.log('handleClearData called!');
    
    // Используем нативные браузерные диалоги для веба
    if (Platform.OS === 'web') {
      // Первое подтверждение
      const firstConfirm = window.confirm(
        '⚠️ УДАЛИТЬ ВСЕ ДАННЫЕ?\n\n' +
        'Это действие удалит:\n' +
        '• Все записи PEF\n' +
        '• Данные профиля\n' +
        '• Историю измерений\n\n' +
        'Это действие нельзя отменить!\n\n' +
        'Нажмите OK для продолжения или Отмена для отмены.'
      );
      
      if (!firstConfirm) {
        console.log('User cancelled first confirmation');
        return;
      }
      
      // Второе подтверждение
      const secondConfirm = window.confirm(
        'ВЫ АБСОЛЮТНО УВЕРЕНЫ?\n\n' +
        'Подтвердите удаление всех данных.\n' +
        'Восстановление будет невозможно!\n\n' +
        'Нажмите OK чтобы УДАЛИТЬ ВСЁ.'
      );
      
      if (!secondConfirm) {
        console.log('User cancelled second confirmation');
        return;
      }
      
      try {
        console.log('Starting data deletion...');
        
        // Проверяем данные перед удалением
        const profileBefore = await Storage.getProfile();
        const recordsBefore = await Storage.getAllRecords();
        console.log('Before deletion:', {
          profile: profileBefore,
          recordsCount: recordsBefore.length,
        });
        
        // Удаляем все данные
        await Storage.clearAll();
        
        // Проверяем данные после удаления
        const profileAfter = await Storage.getProfile();
        const recordsAfter = await Storage.getAllRecords();
        const onboardingStatus = await Storage.hasCompletedOnboarding();
        console.log('After deletion:', {
          profile: profileAfter,
          recordsCount: recordsAfter.length,
          hasOnboarded: onboardingStatus,
        });
        
        window.alert('✅ Все данные успешно удалены!\n\nСтраница будет перезагружена.');
        
        // Перезагружаем страницу
        window.location.reload();
        
      } catch (error) {
        console.error('Error clearing data:', error);
        window.alert('❌ Ошибка при удалении данных. Попробуйте еще раз.');
      }
    } else {
      // Для мобильных платформ используем Alert.alert
      Alert.alert(
        '⚠️ Удалить все данные?',
        'Это действие удалит:\n\n• Все записи PEF\n• Данные профиля\n• Историю измерений\n\nЭто действие нельзя отменить!',
        [
          {
            text: 'Отмена',
            style: 'cancel',
          },
          {
            text: 'Продолжить',
            style: 'destructive',
            onPress: () => {
    Alert.alert(
                'Вы уверены?',
                'Подтвердите удаление всех данных. Восстановление будет невозможно.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
                    text: 'Удалить всё',
          style: 'destructive',
          onPress: async () => {
            try {
              await Storage.clearAll();
                        Alert.alert('Готово', 'Все данные удалены. Перезапустите приложение.');
            } catch (error) {
                        Alert.alert('Ошибка', 'Не удалось удалить данные.');
              console.error('Error clearing data:', error);
            }
          },
        },
      ]
    );
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.scrollView}>
        {/* Профиль пользователя */}
        {profile && (
          <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTitle}>Мой профиль</Text>
              {!isEditing && (
                <Pressable 
                  onPress={() => setIsEditing(true)} 
                  style={styles.editIconButton}
                >
                  <EditIcon />
                </Pressable>
              )}
            </View>

            {!isEditing ? (
              // Режим просмотра
              <View style={styles.profileView}>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Пол:</Text>
                  <Text style={styles.profileValue}>{profile.gender === 'M' ? 'Мужской' : 'Женский'}</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Дата рождения:</Text>
                  <View style={styles.profileValueContainer}>
                    {profile.birthDate ? (
                      <>
                        <Text style={styles.profileValue}>{formatDate(profile.birthDate)}</Text>
                        <Text style={styles.profileValue}>({calculateAge(profile.birthDate)} лет)</Text>
                      </>
                    ) : (
                      <Text style={styles.profileValue}>Не указано</Text>
                    )}
                  </View>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Рост:</Text>
                  <Text style={styles.profileValue}>{profile.heightCm} см</Text>
                </View>
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>Метод расчёта нормы:</Text>
                  <Text style={styles.profileValue}>
                    {profile.normMethod === 'auto' ? 'Автоматический' : `Вручную (${profile.manualNormValue} л/мин)`}
                  </Text>
                </View>
              </View>
            ) : (
              // Режим редактирования
              <View style={styles.profileEdit}>
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

                <View style={styles.editButtons}>
                  <PrimaryButton
                    title="Сохранить"
                    onPress={handleSaveProfile}
                  />
                  <PrimaryButton
                    title="Отмена"
                    onPress={() => {
                      setIsEditing(false);
                      loadProfile(); // Восстанавливаем исходные значения
                    }}
                    variant="secondary"
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Тип графика */}
        <View style={styles.chartTypeSection}>
          <Text style={styles.chartTypeSectionTitle}>Тип графика</Text>
          <View style={styles.chartTypeContainer}>
            <Pressable
              style={[styles.chartTypeButton, chartType === 'bar' && styles.chartTypeButtonActive]}
              onPress={async () => {
                console.log('Switching to bar chart');
                setChartType('bar');
                try {
                  await Storage.setChartType('bar');
                  console.log('Bar chart type saved successfully');
                } catch (error) {
                  console.error('Error saving chart type:', error);
                }
              }}
            >
              <Text style={[styles.chartTypeText, chartType === 'bar' && styles.chartTypeTextActive]}>
                Столбчатая
              </Text>
            </Pressable>
            <Pressable
              style={[styles.chartTypeButton, chartType === 'line' && styles.chartTypeButtonActive]}
              onPress={async () => {
                console.log('Switching to line chart');
                setChartType('line');
                try {
                  await Storage.setChartType('line');
                  console.log('Line chart type saved successfully');
                } catch (error) {
                  console.error('Error saving chart type:', error);
                }
              }}
            >
              <Text style={[styles.chartTypeText, chartType === 'line' && styles.chartTypeTextActive]}>
                Линейный
              </Text>
            </Pressable>
          </View>
        </View>

        {/* О приложении и Данные */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>О приложении</Text>
          <Text style={styles.sectionText}>
            Дневник пикфлоуметрии v1.0.0
          </Text>
          <Text style={styles.sectionText}>
            Приложение для отслеживания показателей пиковой скорости выдоха (ПСВ)
          </Text>
          <Text style={styles.disclaimerText}>
            Есть противопоказания. Посоветуйтесь с врачом.
          </Text>
          <View style={styles.linksContainer}>
            <Pressable onPress={() => Linking.openURL('https://oxia.life/page97307316.html')}>
              <Text style={styles.linkText}>Политика конфиденциальности</Text>
            </Pressable>
            <Pressable onPress={() => Linking.openURL('https://oxia.life/page97310226.html')} style={{marginTop: 8}}>
              <Text style={styles.linkText}>Пользовательское соглашение</Text>
            </Pressable>
          </View>
          
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Данные</Text>
          <Text style={styles.sectionText}>
            Ваши данные синхронизируются с облаком.
          </Text>
        </View>

        {/* Выход из аккаунта */}
        <View style={styles.logoutSection}>
          <Pressable 
            style={styles.logoutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
          </Pressable>
        </View>

        {/* Опасная зона */}
        <View style={styles.dangerZone}>
          <Pressable 
            style={styles.dangerButton}
            onPress={handleClearData}
          >
            <Text style={styles.dangerButtonText}>Очистить все данные</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileTitle: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    lineHeight: 18,
  },
  editIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  profileView: {
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  profileLabel: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
  },
  profileValue: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: '#333',
    fontWeight: FONT_WEIGHTS.medium,
    textAlign: 'right',
  },
  profileValueContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  profileEdit: {
    gap: 8,
  },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
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
    fontSize: 15,
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
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
  },
  normMethodTextActive: {
    fontFamily: FONTS.semibold,
    color: '#333',
    fontWeight: FONT_WEIGHTS.semibold,
  },
  editButtons: {
    flexDirection: 'column',
    marginTop: 16,
    gap: 12,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  infoSection: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    lineHeight: 18,
    marginBottom: 12,
  },
  sectionText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    lineHeight: 22,
    marginBottom: 8,
  },
  disclaimerText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#999',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  linksContainer: {
    marginTop: 12,
  },
  linkText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  logoutButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: 18,
    color: '#1E4C60',
  },
  dangerZone: {
    marginTop: 16,
    marginBottom: 32,
    paddingTop: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dangerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  dangerButtonText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: 18,
    color: '#FF5757',
  },
  chartTypeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTypeSectionTitle: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.medium,
    color: '#333',
    lineHeight: 18,
    marginBottom: 12,
  },
  chartTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  chartTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  chartTypeButtonActive: {
    backgroundColor: '#0000000D',
    borderColor: '#ddd',
  },
  chartTypeText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
  },
  chartTypeTextActive: {
    fontFamily: FONTS.semibold,
    color: '#333',
    fontWeight: FONT_WEIGHTS.semibold,
  },
});



