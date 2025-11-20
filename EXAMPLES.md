# Примеры для будущей разработки

## 1. Добавление записи ПСВ в DiaryScreen

```typescript
import { v4 as uuidv4 } from 'uuid'; // установить: npm install uuid
import Storage from '../services/Storage';
import { PEFRecord, TimePeriod } from '../types/models';
import { getTodayISO } from '../utils/dateUtils';

const handleAddRecord = async () => {
  const newRecord: PEFRecord = {
    id: uuidv4(), // или можно использовать Date.now().toString()
    date: getTodayISO(),
    timePeriod: selectedPeriod, // 'morning' или 'evening'
    value: parseInt(pefValue, 10),
    cough: hasCough,
    breathlessness: hasBreathlessness,
    sputum: hasSputum,
  };

  try {
    await Storage.saveRecord(newRecord);
    Alert.alert('Успешно', 'Запись добавлена');
  } catch (error) {
    Alert.alert('Ошибка', 'Не удалось сохранить запись');
  }
};
```

## 2. Загрузка и отображение истории в HistoryScreen

```typescript
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Storage from '../services/Storage';
import { PEFRecord } from '../types/models';
import { formatDateToRussian } from '../utils/dateUtils';

export default function HistoryScreen() {
  const [records, setRecords] = useState<PEFRecord[]>([]);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const data = await Storage.getAllRecords();
    // Сортировка по дате (новые сверху)
    const sorted = data.sort((a, b) => b.date.localeCompare(a.date));
    setRecords(sorted);
  };

  return (
    <FlatList
      data={records}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.recordCard}>
          <Text>{formatDateToRussian(item.date)}</Text>
          <Text>{item.timePeriod === 'morning' ? 'Утро' : 'Вечер'}</Text>
          <Text>{item.value} л/мин</Text>
        </View>
      )}
    />
  );
}
```

## 3. Расчёт нормы ПСВ (формулы)

```typescript
/**
 * Calculate PEF norm based on gender, age, and height
 * Using European Respiratory Society formulas
 */
export function calculatePEFNorm(
  gender: 'M' | 'F',
  birthYear: number,
  heightCm: number
): number {
  const age = new Date().getFullYear() - birthYear;
  const heightM = heightCm / 100;

  if (gender === 'M') {
    // Мужчины: PEF = (6.14 * height) - (0.043 * age) + 0.15
    return Math.round((6.14 * heightCm) - (0.043 * age) + 0.15);
  } else {
    // Женщины: PEF = (5.50 * height) - (0.030 * age) - 1.11
    return Math.round((5.50 * heightCm) - (0.030 * age) - 1.11);
  }
}

/**
 * Get zone color based on PEF percentage
 */
export function getPEFZone(pefValue: number, normValue: number) {
  const percentage = (pefValue / normValue) * 100;
  
  if (percentage >= 80) return { zone: 'green', color: '#4CAF50' };
  if (percentage >= 50) return { zone: 'yellow', color: '#FFC107' };
  return { zone: 'red', color: '#F44336' };
}
```

## 4. Настройка уведомлений

```typescript
// Сначала установить: expo install expo-notifications
import * as Notifications from 'expo-notifications';

// Настройка обработчика
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Запрос разрешений
async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Планирование ежедневного уведомления
async function scheduleDailyReminder(hour: number, minute: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Время измерения ПСВ',
      body: 'Не забудьте провести измерение пикфлоуметром',
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}
```

## 5. Реализация графика с Victory

```typescript
// Установить: npm install victory-native
import { VictoryLine, VictoryChart, VictoryTheme, VictoryAxis } from 'victory-native';

export default function GraphScreen() {
  const [records, setRecords] = useState<PEFRecord[]>([]);

  const chartData = records.map((record) => ({
    x: new Date(record.date),
    y: record.value,
  }));

  return (
    <VictoryChart theme={VictoryTheme.material}>
      <VictoryAxis
        tickFormat={(date) => `${date.getDate()}/${date.getMonth() + 1}`}
      />
      <VictoryAxis dependentAxis />
      <VictoryLine
        data={chartData}
        style={{
          data: { stroke: '#007AFF' },
        }}
      />
    </VictoryChart>
  );
}
```

## 6. Экспорт данных в CSV

```typescript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function exportToCSV(records: PEFRecord[]) {
  const header = 'Дата,Время дня,ПСВ (л/мин),Кашель,Одышка,Мокрота\n';
  
  const rows = records.map((r) => 
    `${r.date},${r.timePeriod === 'morning' ? 'Утро' : 'Вечер'},${r.value},` +
    `${r.cough ? 'Да' : 'Нет'},${r.breathlessness ? 'Да' : 'Нет'},${r.sputum ? 'Да' : 'Нет'}`
  ).join('\n');

  const csv = header + rows;
  const fileUri = FileSystem.documentDirectory + 'pef_data.csv';
  
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri);
  }
}
```

## 7. Использование React Context для глобального состояния

```typescript
// src/contexts/DataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, PEFRecord } from '../types/models';
import Storage from '../services/Storage';

interface DataContextType {
  profile: Profile | null;
  records: PEFRecord[];
  loadData: () => Promise<void>;
  addRecord: (record: PEFRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<PEFRecord[]>([]);

  const loadData = async () => {
    const [loadedProfile, loadedRecords] = await Promise.all([
      Storage.getProfile(),
      Storage.getAllRecords(),
    ]);
    setProfile(loadedProfile);
    setRecords(loadedRecords);
  };

  const addRecord = async (record: PEFRecord) => {
    await Storage.saveRecord(record);
    await loadData();
  };

  const deleteRecord = async (id: string) => {
    await Storage.deleteRecord(id);
    await loadData();
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ profile, records, loadData, addRecord, deleteRecord }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}

// Использование в App.tsx:
// <DataProvider>
//   <AppNavigator />
// </DataProvider>
```

## 8. Кастомный хук для работы с формой

```typescript
// src/hooks/useForm.ts
import { useState } from 'react';

export function useForm<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = (field: keyof T) => (value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Очистить ошибку при изменении
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  const validate = (rules: Partial<Record<keyof T, (value: any) => string | undefined>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(rules).forEach((key) => {
      const field = key as keyof T;
      const rule = rules[field];
      if (rule) {
        const error = rule(values[field]);
        if (error) {
          newErrors[field] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  return { values, errors, handleChange, reset, validate, setErrors };
}

// Использование:
// const { values, errors, handleChange, validate } = useForm({
//   pefValue: '',
//   timePeriod: 'morning' as TimePeriod,
// });
```

## 9. Модальное окно для редактирования записи

```typescript
import { Modal, View, TextInput } from 'react-native';

function EditRecordModal({ 
  visible, 
  record, 
  onSave, 
  onClose 
}: EditRecordModalProps) {
  const [value, setValue] = useState(record?.value.toString() || '');

  const handleSave = async () => {
    if (record) {
      const updated = { ...record, value: parseInt(value, 10) };
      await onSave(updated);
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text>Изменить значение ПСВ</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            keyboardType="number-pad"
          />
          <PrimaryButton title="Сохранить" onPress={handleSave} />
          <PrimaryButton title="Отмена" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
```

## 10. Фильтрация данных по периоду

```typescript
function useFilteredRecords(records: PEFRecord[], filter: 'all' | 'morning' | 'evening') {
  return useMemo(() => {
    if (filter === 'all') return records;
    return records.filter((r) => r.timePeriod === filter);
  }, [records, filter]);
}

// Использование:
const [filter, setFilter] = useState<'all' | 'morning' | 'evening'>('all');
const filteredRecords = useFilteredRecords(records, filter);
```

---

Эти примеры помогут вам быстро добавить нужную функциональность в приложение!



