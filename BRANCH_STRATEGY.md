# 🌳 Стратегия веток для Peak Flow Diary

## 🔴 КРИТИЧЕСКОЕ ПРАВИЛО:

**`main` ветка ТОЛЬКО для веба!**

Любой push в `main` → автоматический деплой на `peakflow.oxia.life`

---

## 📊 **СТРУКТУРА ВЕТОК:**

```
main
  └── Веб-версия (peakflow.oxia.life)
      ├── Автодеплой через Vercel/GitHub
      └── Только веб-фичи и общие изменения

mobile/staging
  └── Разработка мобильных фич
      ├── Тестирование на Expo Go
      ├── Превью сборки (eas build --profile preview)
      └── Активная разработка

mobile/production
  └── Готовые релизы для App Store / Google Play
      ├── Стабильная версия
      ├── Продакшн сборки (eas build --profile production)
      └── Только после полного тестирования

feature/*
  └── Временные ветки для экспериментов
      └── Удаляются после merge
```

---

## 🎯 **СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ:**

### **Сценарий 1: Правка бага в вебе**

```bash
# Находитесь в main
git checkout main

# Вносите изменения
# Редактируете файлы в Cursor

# Тестируете
npm run web

# Коммитите
git add .
git commit -m "Web: Fix bug in settings"

# Пушите → автодеплой!
git push origin main
```

✅ **Безопасно:** Не влияет на мобильные ветки

---

### **Сценарий 2: Новая фича только для мобильных**

```bash
# Переключаемся на mobile/staging
git checkout mobile/staging

# Синхронизируем с main (берем последние общие изменения)
git merge main

# Создаем feature ветку (опционально)
git checkout -b feature/mobile-push-notifications

# Вносите изменения
# Редактируете файлы в Cursor

# Используете Platform.OS проверки
if (Platform.OS !== 'web') {
  // Код только для мобильных
}

# Тестируете на телефоне
npm start  # Сканируете QR

# Коммитите
git add .
git commit -m "Mobile: Add push notifications"

# Пушите в mobile/staging
git checkout mobile/staging
git merge feature/mobile-push-notifications
git push origin mobile/staging

# Собираете превью билд
eas build --platform all --profile preview

# Тестируете билд
# Если ОК → переносите в production (см. Сценарий 4)
```

✅ **Безопасно:** main не затронут, веб продолжает работать

---

### **Сценарий 3: Общие изменения (для всех платформ)**

```bash
# Находитесь в main
git checkout main

# Вносите изменения (например, новый цвет кнопок)
# Редактируете src/components/PrimaryButton.tsx

# Тестируете ВСЕ платформы
npm run web        # Проверка веба
npm start          # Проверка мобильных на Expo Go

# Коммитите в main
git add .
git commit -m "All: Update button colors"
git push origin main

# Веб обновится автоматически

# Синхронизируете с mobile ветками
git checkout mobile/staging
git merge main
git push origin mobile/staging

git checkout mobile/production
git merge main
git push origin mobile/production

git checkout main
```

✅ **Безопасно:** Общие изменения применяются везде

---

### **Сценарий 4: Релиз мобильного приложения в сторы**

```bash
# 1. Убедитесь, что mobile/staging протестирован
git checkout mobile/staging
# Все работает? ОК

# 2. Мержите в production
git checkout mobile/production
git merge mobile/staging

# 3. Обновите версию в app.config.js
# Например: version: "1.0.1" → "1.1.0"
# buildNumber: "1" → "2" (iOS)
# versionCode: 1 → 2 (Android)

# 4. Коммитите версию
git add app.config.js
git commit -m "Mobile: Bump version to 1.1.0"
git push origin mobile/production

# 5. Собираете продакшн билд
eas build --platform ios --profile production
eas build --platform android --profile production

# Ждете ~20-30 минут

# 6. Загружаете в сторы
eas submit --platform ios
eas submit --platform android

# 7. После успешной публикации - тегаете релиз
git tag -a mobile-v1.1.0 -m "Mobile Release 1.1.0"
git push origin mobile-v1.1.0
```

✅ **Безопасно:** Веб не затронут вообще!

---

### **Сценарий 5: Хотфикс для мобильных (срочный баг)**

```bash
# 1. Создаем hotfix ветку от production
git checkout mobile/production
git checkout -b hotfix/mobile-crash-fix

# 2. Фиксите баг
# Редактируете в Cursor

# 3. Коммитите
git add .
git commit -m "Hotfix: Fix crash in AddEntry screen"

# 4. Мержите в обе ветки
git checkout mobile/production
git merge hotfix/mobile-crash-fix

git checkout mobile/staging
git merge hotfix/mobile-crash-fix

# 5. Собираете и деплоите
git checkout mobile/production
eas build --platform all --profile production
eas submit --platform all

# 6. Удаляете hotfix ветку
git branch -d hotfix/mobile-crash-fix
```

✅ **Безопасно:** main не затронут

---

## 🔄 **СИНХРОНИЗАЦИЯ ВЕТОК:**

### **Когда синхронизировать mobile ← main:**

**Регулярно (каждую неделю или после важных фиксов):**

```bash
# Берем изменения из main в mobile
git checkout mobile/staging
git merge main

# Решаем конфликты если есть
# Тестируем

git push origin mobile/staging

# Тоже самое для production
git checkout mobile/production
git merge main
git push origin mobile/production
```

### **Когда НЕ синхронизировать main ← mobile:**

**Почти никогда!** Мобильные изменения остаются в mobile ветках.

**Исключение:** Если вы добавили общую фичу в mobile, которая нужна и вебу:
1. Cherry-pick нужный коммит
2. Применяете к main
3. Проверяете веб

```bash
# Находим нужный коммит в mobile/staging
git log mobile/staging

# Cherry-pick в main
git checkout main
git cherry-pick <commit-hash>

# Тестируем веб!
npm run web

# Пушим
git push origin main
```

---

## 📂 **ОРГАНИЗАЦИЯ В CURSOR:**

### **Рекомендую: Использовать Workspaces**

**Workspace 1: Web Development**
- Ветка: `main`
- Терминал 1: `npm run web`
- Фокус: веб-разработка

**Workspace 2: Mobile Development**
- Ветка: `mobile/staging`
- Терминал 1: `npm start`
- Терминал 2: `eas build ...`
- Фокус: мобильная разработка

**Как переключаться:**
```
File → Open Folder → peak-flow-diary
# Выбираете нужную ветку в Git панели Cursor
```

---

## 🔍 **ВИЗУАЛЬНАЯ ИНДИКАЦИЯ ВЕТКИ В CURSOR:**

Всегда смотрите на индикатор ветки внизу Cursor:

```
main          → ✅ Можно пушить (только веб-изменения!)
mobile/*      → ✅ Можно пушить (мобильные изменения)
feature/*     → ✅ Можно пушить (экспериментальные)
```

---

## 📱 **НАСТРОЙКА APP STORE / GOOGLE PLAY:**

### **iOS (App Store Connect):**

#### **Один раз:**
1. [ ] https://appstoreconnect.apple.com
2. [ ] My Apps → + → New App
3. [ ] Заполняете:
   - Name: "Дневник пикфлоуметрии"
   - Bundle ID: `com.oxia.peakflowdiary`
   - SKU: `peakflow-diary`
4. [ ] App Information:
   - Privacy Policy URL: `https://oxia.life/page97307316.html`
   - Category: Health & Fitness
5. [ ] Подготовка скриншотов (3-5 штук)

#### **При каждом релизе:**
```bash
# В mobile/production ветке
eas build --platform ios --profile production
eas submit --platform ios

# Затем в App Store Connect:
# → TestFlight → проверить билд
# → Submit for Review
# → Ждать 1-3 дня
```

### **Android (Google Play Console):**

#### **Один раз:**
1. [ ] https://play.google.com/console
2. [ ] Create app ($25 регистрация)
3. [ ] App Details:
   - Name: "Дневник пикфлоуметрии"
   - Package: `com.oxia.peakflowdiary`
   - Category: Health & Fitness
4. [ ] Store listing:
   - Short description
   - Full description
   - Screenshots (минимум 2)
   - Privacy Policy: `https://oxia.life/page97307316.html`

#### **Настройка Service Account:**
```bash
# 1. Google Cloud Console
# 2. IAM & Admin → Service Accounts
# 3. Create Service Account
# 4. Grant "Service Account User" role
# 5. Keys → Add Key → JSON
# 6. Скачать и сохранить как:
#    google-play-service-account.json
# 7. НЕ коммитить этот файл! (уже в .gitignore)
```

#### **При каждом релизе:**
```bash
# В mobile/production ветке
eas build --platform android --profile production
eas submit --platform android

# Затем в Google Play Console:
# → Production → Review and rollout
# → Ждать несколько часов
```

---

## 🎨 **PLATFORM-SPECIFIC КОД:**

### **Как писать код, который работает везде:**

```typescript
// src/components/ShareButton.tsx
import { Platform } from 'react-native';

export default function ShareButton() {
  if (Platform.OS === 'web') {
    // Веб-специфичный код
    return <WebShareButton />;
  }
  
  if (Platform.OS === 'ios') {
    // iOS-специфичный код
    return <IOSShareButton />;
  }
  
  // Android
  return <AndroidShareButton />;
}
```

### **Или создавайте отдельные файлы:**

```
src/components/
├── ShareButton.tsx          # Общий интерфейс
├── ShareButton.web.tsx      # Веб версия
├── ShareButton.ios.tsx      # iOS версия
└── ShareButton.android.tsx  # Android версия
```

React Native автоматически выберет нужный!

---

## 📦 **PACKAGE.JSON ОБНОВЛЕНИЕ:**

Я обновлю scripts с защитой:

<function_calls>
<invoke name="read_file">
<parameter name="target_file">/Users/monastyrskaya/Documents/peak-flow-diary/package.json
