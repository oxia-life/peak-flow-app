# Модуль расчёта PEF и зон контроля

## 📋 Описание

Модуль `calculation.ts` содержит функции для:
- Расчёта нормальных значений PEF по формулам Nunn & Gregg (BMJ 1989)
- Определения цветовых зон контроля астмы
- Вычисления процента от нормы

## 📍 Расположение

```
src/utils/calculation.ts
```

## 🔧 Основные функции

### 1. `calculateNormPEF(gender, age, heightCm)`

Рассчитывает прогнозируемую норму PEF для пациента.

**Параметры:**
- `gender` - Пол: `'M'` (мужской) или `'F'` (женский)
- `age` - Возраст в годах (рекомендуется 15-85 лет)
- `heightCm` - Рост в сантиметрах

**Возвращает:** `number` - Норма PEF в л/мин

**Пример:**
```typescript
import { calculateNormPEF } from './utils/calculation';

const norm = calculateNormPEF('M', 30, 180);
console.log(norm); // ~600 л/мин

const normFemale = calculateNormPEF('F', 25, 165);
console.log(normFemale); // ~450 л/мин
```

### 2. `getZoneColor(pefValue, normValue)`

Определяет зону контроля для измеренного значения PEF.

**Зоны:**
- 🟢 **Зелёная** (`green`): ≥ 80% от нормы - хороший контроль
- 🟡 **Жёлтая** (`yellow`): 50-79% от нормы - требуется внимание
- 🔴 **Красная** (`red`): < 50% от нормы - опасная зона

**Параметры:**
- `pefValue` - Измеренное значение PEF в л/мин
- `normValue` - Нормальное значение PEF в л/мин

**Возвращает:** `'green' | 'yellow' | 'red'`

**Пример:**
```typescript
import { getZoneColor } from './utils/calculation';

const zone1 = getZoneColor(500, 600); // 'green' (83%)
const zone2 = getZoneColor(450, 600); // 'yellow' (75%)
const zone3 = getZoneColor(250, 600); // 'red' (42%)
```

### 3. `getPercentageOfNorm(pefValue, normValue)`

Вычисляет процент от нормы.

**Параметры:**
- `pefValue` - Измеренное значение PEF в л/мин
- `normValue` - Нормальное значение PEF в л/мин

**Возвращает:** `number` - Процент от нормы (0-100+)

**Пример:**
```typescript
import { getPercentageOfNorm } from './utils/calculation';

const percent = getPercentageOfNorm(450, 600); // 75
```

### 4. `getZoneDescription(zone)`

Возвращает описание зоны на русском языке.

**Пример:**
```typescript
import { getZoneDescription } from './utils/calculation';

const desc = getZoneDescription('green'); // "Хороший контроль"
```

### 5. `getZoneColorHex(zone)`

Возвращает hex-код цвета для UI.

**Пример:**
```typescript
import { getZoneColorHex } from './utils/calculation';

const color = getZoneColorHex('green'); // "#34C759"
```

## 📊 Константы

```typescript
export const GREEN_ZONE_THRESHOLD = 0.8;  // 80%
export const YELLOW_ZONE_THRESHOLD = 0.5; // 50%
```

## 💡 Полный пример использования

```typescript
import { 
  calculateNormPEF, 
  getZoneColor, 
  getPercentageOfNorm,
  getZoneDescription 
} from './utils/calculation';

// 1. Получаем данные профиля пользователя
const profile = {
  gender: 'M' as const,
  age: 35,
  height: 175,
};

// 2. Рассчитываем норму
const normalPEF = calculateNormPEF(
  profile.gender, 
  profile.age, 
  profile.height
);
console.log(`Норма: ${normalPEF} л/мин`);

// 3. Пользователь сделал измерение
const measuredPEF = 450;

// 4. Определяем зону
const zone = getZoneColor(measuredPEF, normalPEF);
const percentage = getPercentageOfNorm(measuredPEF, normalPEF);
const description = getZoneDescription(zone);

// 5. Показываем результат
console.log(`PEF: ${measuredPEF} л/мин`);
console.log(`${percentage}% от нормы`);
console.log(`Зона: ${description}`);
```

## 🧪 Тестирование

Тестовый файл находится в:
```
src/utils/__tests__/calculation.test.ts
```

Запустите его командой:
```bash
npx ts-node src/utils/__tests__/calculation.test.ts
```

## 📚 Научная база

Формулы основаны на исследовании:
- **Nunn AJ, Gregg I.** "New regression equations for predicting peak expiratory flow in adults." *BMJ* 1989;298:1068-70.

Формулы:
- **Мужчины:** `log(PEF) = 0.544 * log(age) - 0.0151 * age - 74.7/height + 5.48`
- **Женщины:** `log(PEF) = 0.376 * log(age) - 0.0120 * age - 58.8/height + 5.63`

Где:
- `log` - натуральный логарифм
- `age` - возраст в годах
- `height` - рост в сантиметрах
- `PEF` получается через `Math.exp(log(PEF))`

## ⚠️ Важные замечания

1. **Валидация возраста:** Формулы рекомендуются для возраста 15-85 лет
2. **Обработка ошибок:** Все функции выбрасывают ошибки при некорректных данных
3. **Чистые функции:** Модуль не зависит от React или других библиотек
4. **TypeScript:** Полная типизация всех функций и параметров

## 🔗 Использование в компонентах

### Пример в React Native компоненте:

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { calculateNormPEF, getZoneColor } from '../utils/calculation';
import Storage from '../services/Storage';

export default function PEFIndicator() {
  const [norm, setNorm] = useState<number>(0);
  const [zone, setZone] = useState<'green' | 'yellow' | 'red'>('green');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
    <View>
      <Text>Ваша норма: {norm} л/мин</Text>
    </View>
  );
}
```

## 📖 Дополнительная информация

Подробнее о зонах контроля астмы:
- Зелёная зона: продолжайте принимать обычные лекарства
- Жёлтая зона: возможно ухудшение, следуйте плану действий
- Красная зона: требуется срочная медицинская помощь


