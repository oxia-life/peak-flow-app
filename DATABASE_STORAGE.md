# DatabaseStorage - Модуль работы с SQLite базой данных

## 📋 Описание

`DatabaseStorage.ts` - модуль для работы с локальной базой данных SQLite через `expo-sqlite`. Обеспечивает надёжное хранение записей PEF, профиля пользователя и настроек приложения.

## 📍 Расположение

```
src/services/DatabaseStorage.ts
```

## 🗄️ Структура базы данных

### Таблица `pef_records`
Хранит записи измерений PEF

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | INTEGER | Primary Key (автоинкремент) |
| `date` | TEXT | Дата измерения (YYYY-MM-DD) |
| `timePeriod` | TEXT | Время суток ('morning' или 'evening') |
| `value` | INTEGER | Значение PEF в л/мин |
| `cough` | INTEGER | Кашель (0 или 1) |
| `breathlessness` | INTEGER | Одышка (0 или 1) |
| `sputum` | INTEGER | Мокрота (0 или 1) |
| `createdAt` | TEXT | Время создания записи |

**Индексы:**
- `idx_pef_date` на `(date, timePeriod)` - для быстрого поиска

### Таблица `profile`
Хранит профиль пользователя (всегда 1 запись с id=1)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | INTEGER | Primary Key (всегда 1) |
| `gender` | TEXT | Пол ('M' или 'F') |
| `birthYear` | INTEGER | Год рождения |
| `heightCm` | INTEGER | Рост в см |
| `normMethod` | TEXT | Метод расчёта нормы ('auto' или 'manual') |
| `manualNorm` | INTEGER | Ручное значение нормы (опционально) |
| `updatedAt` | TEXT | Время обновления |

### Таблица `app_settings`
Хранит настройки приложения (ключ-значение)

| Поле | Тип | Описание |
|------|-----|----------|
| `key` | TEXT | Primary Key (название настройки) |
| `value` | TEXT | Значение настройки |

## 🔧 API Методов

### Работа с записями PEF

#### `saveRecord(record)`
Сохраняет новую запись PEF в базу данных.

**Параметры:**
```typescript
{
  date: string;           // YYYY-MM-DD
  timePeriod: 'morning' | 'evening';
  value: number;          // л/мин
  cough: boolean;
  breathlessness: boolean;
  sputum: boolean;
}
```

**Возвращает:** `Promise<number>` - ID созданной записи

**Пример:**
```typescript
import { storage } from './services/DatabaseStorage';

const id = await storage.saveRecord({
  date: '2024-11-19',
  timePeriod: 'morning',
  value: 450,
  cough: false,
  breathlessness: true,
  sputum: false,
});
console.log(`Создана запись с ID: ${id}`);
```

---

#### `getRecords(fromDate?, toDate?)`
Получает записи за указанный период.

**Параметры:**
- `fromDate?: string` - Начальная дата (YYYY-MM-DD), опционально
- `toDate?: string` - Конечная дата (YYYY-MM-DD), опционально

**Возвращает:** `Promise<PEFRecord[]>` - Массив записей (отсортирован по дате, новые сначала)

**Примеры:**
```typescript
// Все записи
const allRecords = await storage.getRecords();

// За последнюю неделю
const weekRecords = await storage.getRecords('2024-11-12', '2024-11-19');

// С определённой даты
const recentRecords = await storage.getRecords('2024-11-01');
```

---

#### `getAllRecords()`
Получает все записи из базы.

**Возвращает:** `Promise<PEFRecord[]>`

**Пример:**
```typescript
const records = await storage.getAllRecords();
console.log(`Всего записей: ${records.length}`);
```

---

#### `getRecordById(id)`
Получает одну запись по ID.

**Параметры:**
- `id: number` - ID записи

**Возвращает:** `Promise<PEFRecord | null>`

**Пример:**
```typescript
const record = await storage.getRecordById(42);
if (record) {
  console.log(`PEF: ${record.value} л/мин`);
}
```

---

#### `updateRecord(id, record)`
Обновляет существующую запись.

**Параметры:**
- `id: number` - ID записи для обновления
- `record: { date, timePeriod, value, cough, breathlessness, sputum }`

**Возвращает:** `Promise<void>`

**Пример:**
```typescript
await storage.updateRecord(42, {
  date: '2024-11-19',
  timePeriod: 'evening',
  value: 480,
  cough: false,
  breathlessness: false,
  sputum: false,
});
```

---

#### `deleteRecord(id)`
Удаляет запись по ID.

**Параметры:**
- `id: number` - ID записи для удаления

**Возвращает:** `Promise<void>`

**Пример:**
```typescript
await storage.deleteRecord(42);
console.log('Запись удалена');
```

---

### Работа с профилем

#### `saveProfile(profile)`
Сохраняет или обновляет профиль пользователя.

**Параметры:**
```typescript
{
  gender: 'M' | 'F';
  birthYear: number;
  heightCm: number;
  normMethod: 'auto' | 'manual';
  manualNorm?: number | null;
}
```

**Возвращает:** `Promise<void>`

**Пример:**
```typescript
await storage.saveProfile({
  gender: 'M',
  birthYear: 1990,
  heightCm: 180,
  normMethod: 'auto',
});
```

---

#### `getProfile()`
Получает профиль пользователя.

**Возвращает:** `Promise<Profile | null>`

**Пример:**
```typescript
const profile = await storage.getProfile();
if (profile) {
  console.log(`Пол: ${profile.gender}, Рост: ${profile.heightCm} см`);
}
```

---

### Работа с настройками

#### `hasCompletedOnboarding()`
Проверяет, завершён ли онбординг.

**Возвращает:** `Promise<boolean>`

**Пример:**
```typescript
const completed = await storage.hasCompletedOnboarding();
if (!completed) {
  // Показать онбординг
}
```

---

#### `setOnboardingCompleted()`
Устанавливает статус завершения онбординга.

**Возвращает:** `Promise<void>`

**Пример:**
```typescript
await storage.setOnboardingCompleted();
```

---

### Статистика и аналитика

#### `getRecordsCount()`
Получает общее количество записей.

**Возвращает:** `Promise<number>`

**Пример:**
```typescript
const count = await storage.getRecordsCount();
console.log(`В базе ${count} записей`);
```

---

#### `getStatistics(fromDate?, toDate?)`
Получает статистику за период.

**Параметры:**
- `fromDate?: string` - Начальная дата
- `toDate?: string` - Конечная дата

**Возвращает:**
```typescript
Promise<{
  min: number;    // Минимальное значение PEF
  max: number;    // Максимальное значение PEF
  avg: number;    // Среднее значение PEF (округлённое)
  count: number;  // Количество записей
} | null>
```

**Пример:**
```typescript
const stats = await storage.getStatistics('2024-11-01', '2024-11-19');
if (stats) {
  console.log(`Мин: ${stats.min}, Макс: ${stats.max}, Средн: ${stats.avg}`);
}
```

---

### Управление данными

#### `clearAll()`
Удаляет все данные (записи, профиль, настройки).

**Возвращает:** `Promise<void>`

**Пример:**
```typescript
await storage.clearAll();
console.log('Все данные удалены');
```

---

#### `dropAllTables()`
Полностью удаляет все таблицы и создаёт их заново.

**Возвращает:** `Promise<void>`

**Пример:**
```typescript
await storage.dropAllTables();
console.log('База данных пересоздана');
```

---

### Импорт/Экспорт

#### `exportData()`
Экспортирует все данные в JSON.

**Возвращает:**
```typescript
Promise<{
  profile: Profile | null;
  records: PEFRecord[];
  exportDate: string;
}>
```

**Пример:**
```typescript
const backup = await storage.exportData();
console.log(JSON.stringify(backup, null, 2));
// Можно сохранить в файл или отправить на сервер
```

---

#### `importData(data)`
Импортирует данные из JSON.

**Параметры:**
```typescript
{
  profile?: Profile | null;
  records?: PEFRecord[];
}
```

**Возвращает:** `Promise<void>`

**Пример:**
```typescript
await storage.importData({
  profile: {
    gender: 'M',
    birthYear: 1990,
    heightCm: 180,
    normMethod: 'auto',
  },
  records: [
    {
      id: '1',
      date: '2024-11-19',
      timePeriod: 'morning',
      value: 450,
      cough: false,
      breathlessness: false,
      sputum: false,
    },
  ],
});
```

---

## 💡 Использование в приложении

### Синглтон
Модуль экспортирует готовый экземпляр:

```typescript
import { storage } from './services/DatabaseStorage';

// Использование напрямую
const records = await storage.getAllRecords();
```

### В React компонентах

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { storage } from '../services/DatabaseStorage';
import { PEFRecord } from '../types/models';

export default function RecordsList() {
  const [records, setRecords] = useState<PEFRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      const data = await storage.getAllRecords();
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text>Загрузка...</Text>;
  }

  return (
    <View>
      {records.map(record => (
        <Text key={record.id}>
          {record.date}: {record.value} л/мин
        </Text>
      ))}
    </View>
  );
}
```

---

## ⚠️ Важные замечания

1. **Автоинициализация:** База данных и таблицы создаются автоматически при первом запуске
2. **Транзакции:** Все операции выполняются внутри транзакций для обеспечения целостности данных
3. **Обработка ошибок:** Все методы логируют ошибки в консоль и выбрасывают исключения
4. **Булевы значения:** В SQLite boolean хранится как 0/1, автоматически конвертируется
5. **Профиль:** Всегда хранится с id=1, обновляется при повторном сохранении

---

## 🔄 Миграция с AsyncStorage

Если у вас уже есть данные в AsyncStorage (старый `Storage.ts`), можно создать скрипт миграции:

```typescript
import { storage as oldStorage } from './services/Storage';
import { storage as newStorage } from './services/DatabaseStorage';

async function migrateData() {
  try {
    // Получаем данные из AsyncStorage
    const profile = await oldStorage.getProfile();
    const records = await oldStorage.getAllRecords();

    // Импортируем в SQLite
    await newStorage.importData({ profile, records });

    console.log('Миграция завершена успешно!');
  } catch (error) {
    console.error('Ошибка миграции:', error);
  }
}
```

---

## 📚 Связанные файлы

- **Типы:** `src/types/models.ts`
- **Старое хранилище:** `src/services/Storage.ts` (AsyncStorage)
- **Использование:** Все экраны приложения

---

## 🚀 Преимущества SQLite vs AsyncStorage

| Критерий | SQLite | AsyncStorage |
|----------|--------|--------------|
| **Скорость** | ✅ Быстрее для больших данных | ⚠️ Медленнее |
| **Запросы** | ✅ SQL запросы, фильтрация, сортировка | ❌ Только ключ-значение |
| **Транзакции** | ✅ Поддерживаются | ❌ Нет |
| **Индексы** | ✅ Поддерживаются | ❌ Нет |
| **Сложность** | ⚠️ Требует знания SQL | ✅ Простой |
| **Надёжность** | ✅ Высокая | ⚠️ Средняя |

---

**Рекомендация:** Используйте DatabaseStorage для production приложения с большим объёмом данных.


