# Примеры использования модуля calculation.ts

## 🎯 Быстрый старт

### 1. Простой расчёт нормы

```typescript
import { calculateNormPEF } from './src/utils/calculation';

const norm = calculateNormPEF('M', 30, 180);
console.log(`Норма PEF: ${norm} л/мин`); // ~600
```

### 2. Определение зоны

```typescript
import { getZoneColor, getZoneDescription } from './src/utils/calculation';

const zone = getZoneColor(450, 600);
console.log(zone); // 'yellow'
console.log(getZoneDescription(zone)); // "Требуется внимание"
```

## 📱 Примеры для React Native компонентов

### Пример 1: Отображение нормы в профиле

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Storage from '../services/Storage';
import { calculateNormPEF } from '../utils/calculation';

export default function ProfileNorm() {
  const [norm, setNorm] = useState<number | null>(null);

  useEffect(() => {
    loadNorm();
  }, []);

  const loadNorm = async () => {
    const profile = await Storage.getProfile();
    if (profile && profile.birthYear && profile.heightCm) {
      const age = new Date().getFullYear() - profile.birthYear;
      const calculatedNorm = calculateNormPEF(
        profile.gender,
        age,
        profile.heightCm
      );
      setNorm(calculatedNorm);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Ваша норма PEF:</Text>
      <Text style={styles.value}>
        {norm ? `${norm} л/мин` : 'Заполните профиль'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 4,
  },
});
```

### Пример 2: Индикатор зоны с цветом

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getZoneColor, getZoneColorHex, getPercentageOfNorm } from '../utils/calculation';

interface ZoneIndicatorProps {
  pefValue: number;
  normValue: number;
}

export default function ZoneIndicator({ pefValue, normValue }: ZoneIndicatorProps) {
  const zone = getZoneColor(pefValue, normValue);
  const color = getZoneColorHex(zone);
  const percentage = getPercentageOfNorm(pefValue, normValue);

  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <Text style={styles.percentage}>{percentage}%</Text>
      <Text style={styles.label}>от нормы</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  label: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
  },
});
```

### Пример 3: Список записей с цветовой кодировкой

```typescript
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import Storage from '../services/Storage';
import { PEFRecord } from '../types/models';
import { calculateNormPEF, getZoneColor, getZoneColorHex } from '../utils/calculation';

export default function RecordsList() {
  const [records, setRecords] = useState<PEFRecord[]>([]);
  const [norm, setNorm] = useState<number>(500);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Загружаем профиль для расчёта нормы
    const profile = await Storage.getProfile();
    if (profile && profile.birthYear && profile.heightCm) {
      const age = new Date().getFullYear() - profile.birthYear;
      const calculatedNorm = calculateNormPEF(
        profile.gender,
        age,
        profile.heightCm
      );
      setNorm(calculatedNorm);
    }

    // Загружаем записи
    const allRecords = await Storage.getAllRecords();
    setRecords(allRecords);
  };

  const renderItem = ({ item }: { item: PEFRecord }) => {
    const zone = getZoneColor(item.value, norm);
    const color = getZoneColorHex(zone);

    return (
      <View style={styles.item}>
        <View style={[styles.indicator, { backgroundColor: color }]} />
        <View style={styles.content}>
          <Text style={styles.date}>{item.date}</Text>
          <Text style={styles.time}>
            {item.timePeriod === 'morning' ? 'Утро' : 'Вечер'}
          </Text>
        </View>
        <Text style={styles.value}>{item.value} л/мин</Text>
      </View>
    );
  };

  return (
    <FlatList
      data={records}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  time: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});
```

### Пример 4: Предупреждение при низком PEF

```typescript
import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { getZoneColor } from '../utils/calculation';

interface PEFAlertProps {
  pefValue: number;
  normValue: number;
}

export function usePEFAlert({ pefValue, normValue }: PEFAlertProps) {
  useEffect(() => {
    const zone = getZoneColor(pefValue, normValue);

    if (zone === 'red') {
      Alert.alert(
        '⚠️ Внимание!',
        'Ваш показатель PEF находится в красной зоне (менее 50% от нормы). ' +
        'Следуйте плану действий и обратитесь к врачу.',
        [{ text: 'Понятно', style: 'destructive' }]
      );
    } else if (zone === 'yellow') {
      Alert.alert(
        '⚡ Будьте внимательны',
        'Ваш показатель PEF находится в жёлтой зоне (50-79% от нормы). ' +
        'Возможно ухудшение состояния. Следите за симптомами.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, [pefValue, normValue]);
}

// Использование в компоненте:
export default function AddEntryScreen() {
  const [pefValue, setPefValue] = useState(0);
  const [norm] = useState(600);

  usePEFAlert({ pefValue, normValue: norm });

  // ... остальной код
}
```

### Пример 5: График с зонами (подготовка данных)

```typescript
import { calculateNormPEF, GREEN_ZONE_THRESHOLD, YELLOW_ZONE_THRESHOLD } from '../utils/calculation';

interface ChartData {
  greenZoneMin: number;
  yellowZoneMin: number;
  redZoneMax: number;
  records: Array<{ date: string; value: number }>;
}

export function prepareChartData(
  records: PEFRecord[],
  norm: number
): ChartData {
  return {
    greenZoneMin: norm * GREEN_ZONE_THRESHOLD,
    yellowZoneMin: norm * YELLOW_ZONE_THRESHOLD,
    redZoneMax: norm * YELLOW_ZONE_THRESHOLD,
    records: records.map(r => ({
      date: r.date,
      value: r.value,
    })),
  };
}

// Использование:
// const profile = await Storage.getProfile();
// const norm = calculateNormPEF(profile.gender, age, profile.heightCm);
// const chartData = prepareChartData(records, norm);
// // Теперь можно нарисовать график с зонами
```

## 🧪 Тестирование расчётов

### Запуск тестов в консоли:

```bash
# Вариант 1: Через ts-node (если установлен)
npx ts-node src/utils/__tests__/calculation.test.ts

# Вариант 2: Через Node.js
node test-calculation.js
```

### Проверка формул вручную:

```typescript
import { calculateNormPEF } from './src/utils/calculation';

// Тест 1: Мужчина 30 лет, 180 см
console.assert(
  calculateNormPEF('M', 30, 180) > 550 && 
  calculateNormPEF('M', 30, 180) < 650,
  'Норма для мужчины 30 лет должна быть ~600'
);

// Тест 2: Женщина 25 лет, 165 см  
console.assert(
  calculateNormPEF('F', 25, 165) > 400 && 
  calculateNormPEF('F', 25, 165) < 500,
  'Норма для женщины 25 лет должна быть ~450'
);
```

## 🎨 UI/UX паттерны

### Цветовая кодировка

```typescript
import { getZoneColorHex } from '../utils/calculation';

// В стилях компонента
const styles = StyleSheet.create({
  greenZone: {
    backgroundColor: getZoneColorHex('green'), // #34C759
  },
  yellowZone: {
    backgroundColor: getZoneColorHex('yellow'), // #FFCC00
  },
  redZone: {
    backgroundColor: getZoneColorHex('red'), // #FF3B30
  },
});
```

### Текстовые описания

```typescript
import { getZoneDescription } from '../utils/calculation';

const zoneMessages = {
  green: 'Отлично! Продолжайте в том же духе.',
  yellow: 'Будьте внимательны к своему состоянию.',
  red: 'Срочно обратитесь к врачу!',
};

// Использование
const zone = getZoneColor(pefValue, norm);
const message = zoneMessages[zone];
```

## 📚 Полезные ссылки

- **Основная документация:** `CALCULATION_MODULE.md`
- **Индекс файлов:** `FILES_INDEX.md`
- **Примеры кода:** `EXAMPLES.md`

## ⚡ Быстрые команды

```bash
# Запустить приложение
npx expo start

# Перезагрузить с новыми изменениями
# (в терминале где запущен expo, нажать 'r')

# Запустить тесты расчётов
node test-calculation.js
```


