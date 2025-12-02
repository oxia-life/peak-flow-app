import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, Alert, Platform, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../components/ScreenContainer';
import PrimaryButton from '../components/PrimaryButton';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import Storage from '../services/Storage';
import { PEFRecord } from '../types/models';
import { DiaryStackParamList } from '../AppNavigator';
import { FONTS, FONT_WEIGHTS } from '../styles/fonts';

type AddEntryScreenNavigationProp = NativeStackNavigationProp<DiaryStackParamList, 'AddEntry'>;

interface AddEntryScreenProps {
  navigation: AddEntryScreenNavigationProp;
}

// Функция для форматирования локальной даты в YYYY-MM-DD без проблем с часовым поясом
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddEntryScreen({ navigation }: AddEntryScreenProps) {
  // Текущая дата и время по умолчанию
  const now = new Date();
  const defaultDate = formatLocalDate(now);
  const defaultTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [value, setValue] = useState('');
  const [cough, setCough] = useState(false);
  const [breathlessness, setBreathlessness] = useState(false);
  const [sputum, setSputum] = useState(false);

  const handleSave = async () => {
    // Валидация
    const pefValue = parseInt(value, 10);
    
    if (!value || isNaN(pefValue)) {
      if (Platform.OS === 'web') {
        window.alert('Введите значение PEF');
      } else {
        Alert.alert('Ошибка', 'Введите значение PEF');
      }
      return;
    }

    if (pefValue < 50 || pefValue > 1000) {
      if (Platform.OS === 'web') {
        window.alert('Значение PEF должно быть от 50 до 1000 л/мин');
      } else {
        Alert.alert('Ошибка', 'Значение PEF должно быть от 50 до 1000 л/мин');
      }
      return;
    }

    try {
      // Создаем новую запись
      const newRecord: PEFRecord = {
        id: Date.now().toString(),
        date,
        time,
        value: pefValue,
        cough,
        breathlessness,
        sputum,
      };

      // Сохраняем только новую запись (безопасно, не удаляет существующие)
      await Storage.saveRecord(newRecord);

      // Возвращаемся назад
      navigation.goBack();

      // Показываем уведомление об успехе
      setTimeout(() => {
        if (Platform.OS === 'web') {
          window.alert('✅ Запись добавлена');
        } else {
          Alert.alert('Успешно', 'Запись добавлена');
        }
      }, 300);
    } catch (error) {
      console.error('Error saving record:', error);
      if (Platform.OS === 'web') {
        window.alert('❌ Ошибка при сохранении записи');
      } else {
        Alert.alert('Ошибка', 'Не удалось сохранить запись');
      }
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <ScreenContainer 
      title="Новая запись"
      showCloseButton={true}
      onClose={handleCancel}
      scrollable={false}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Дата */}
        <View style={styles.section}>
          <Text style={styles.label}>Дата</Text>
          <DatePicker
            value={date}
            onChange={setDate}
          />
        </View>

        {/* Время */}
        <View style={styles.section}>
          <Text style={styles.label}>Время</Text>
          <TimePicker
            value={time}
            onChange={setTime}
          />
        </View>

        {/* Значение PEF */}
        <View style={styles.section}>
          <Text style={styles.label}>Значение PEF (л/мин)</Text>
          <TextInput
            style={styles.input}
            placeholder="Например, 450"
            value={value}
            onChangeText={(text) => setValue(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor="#999"
            autoFocus={false}
            blurOnSubmit={true}
          />
          <Text style={styles.hint}>Диапазон: 50-1000 л/мин</Text>
        </View>

        {/* Симптомы */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Симптомы</Text>
          <Text style={styles.sectionDescription}>
            Отметьте симптомы, если они есть
          </Text>

          <View style={styles.symptomRow}>
            <Text style={styles.symptomLabel}>Кашель</Text>
            <Switch
              value={cough}
              onValueChange={setCough}
              trackColor={{ false: '#ddd', true: '#1E4C60' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#ddd"
            />
          </View>

          <View style={styles.symptomRow}>
            <Text style={styles.symptomLabel}>Одышка</Text>
            <Switch
              value={breathlessness}
              onValueChange={setBreathlessness}
              trackColor={{ false: '#ddd', true: '#1E4C60' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#ddd"
            />
          </View>

          <View style={styles.symptomRow}>
            <Text style={styles.symptomLabel}>Мокрота</Text>
            <Switch
              value={sputum}
              onValueChange={setSputum}
              trackColor={{ false: '#ddd', true: '#1E4C60' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#ddd"
            />
          </View>
        </View>

        {/* Кнопки */}
        <View style={styles.buttons}>
          <PrimaryButton
            title="Сохранить"
            onPress={handleSave}
          />
          <PrimaryButton
            title="Отмена"
            onPress={handleCancel}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FONTS.semibold,
    fontSize: 18,
    fontWeight: FONT_WEIGHTS.semibold,
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    backgroundColor: '#fff',
    color: '#333',
  },
  hint: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#999',
    marginTop: 6,
  },
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 8,
  },
  symptomLabel: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    color: '#333',
  },
  buttons: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});
