# Настройка Supabase для приложения Peak Flow Diary

Это приложение использует **Supabase** для авторизации пользователей и хранения данных. Следуйте этой инструкции для настройки проекта.

## Шаг 1: Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте аккаунт или войдите
3. Нажмите **"New Project"**
4. Заполните поля:
   - **Name**: peak-flow-diary (или любое другое имя)
   - **Database Password**: создайте надежный пароль (сохраните его)
   - **Region**: выберите ближайший к вашим пользователям регион
5. Нажмите **"Create new project"**
6. Дождитесь завершения создания проекта (~2 минуты)

## Шаг 2: Получение ключей API

1. В левом меню выберите **Settings** (⚙️)
2. Выберите **API**
3. Найдите раздел **Project API keys**
4. Скопируйте два значения:
   - **Project URL** (например, `https://xxxxx.supabase.co`)
   - **anon public** key (длинный ключ начинающийся с `eyJ...`)

## Шаг 3: Настройка переменных окружения

### Для Web и React Native (Expo)

1. Создайте файл `.env` в корне проекта:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_ключ
```

2. Добавьте `.env` в `.gitignore`, чтобы не коммитить секреты:

```
.env
```

### Для iOS (после ejecting)

Если вы используете bare React Native:

1. В Xcode откройте `Info.plist`
2. Добавьте ключи:
   - `SUPABASE_URL`: ваш URL
   - `SUPABASE_ANON_KEY`: ваш ключ

### Для Android (после ejecting)

Если вы используете bare React Native:

1. Откройте `android/app/build.gradle`
2. Добавьте в `defaultConfig`:

```gradle
buildConfigField "String", "SUPABASE_URL", "\"https://xxxxx.supabase.co\""
buildConfigField "String", "SUPABASE_ANON_KEY", "\"ваш_ключ\""
```

## Шаг 4: Создание таблиц в базе данных

1. В левом меню Supabase выберите **SQL Editor**
2. Нажмите **"New query"**
3. Скопируйте и выполните следующий SQL код:

```sql
-- Таблица профилей пользователей
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
  birth_date DATE NOT NULL,
  height_cm INTEGER NOT NULL CHECK (height_cm >= 50 AND height_cm <= 250),
  norm_method VARCHAR(10) NOT NULL CHECK (norm_method IN ('auto', 'manual')),
  manual_norm_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Таблица записей PEF
CREATE TABLE pef_records (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  value INTEGER NOT NULL CHECK (value >= 50 AND value <= 1000),
  cough BOOLEAN DEFAULT FALSE,
  breathlessness BOOLEAN DEFAULT FALSE,
  sputum BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица настроек пользователя
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chart_type VARCHAR(10) NOT NULL CHECK (chart_type IN ('bar', 'line')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Индексы для улучшения производительности
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_pef_records_user_id ON pef_records(user_id);
CREATE INDEX idx_pef_records_date ON pef_records(date DESC);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Row Level Security (RLS) политики

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pef_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы profiles
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" 
  ON profiles FOR DELETE 
  USING (auth.uid() = user_id);

-- Политики для таблицы pef_records
CREATE POLICY "Users can view own records" 
  ON pef_records FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records" 
  ON pef_records FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records" 
  ON pef_records FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own records" 
  ON pef_records FOR DELETE 
  USING (auth.uid() = user_id);

-- Политики для таблицы user_settings
CREATE POLICY "Users can view own settings" 
  ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
  ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
  ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" 
  ON user_settings FOR DELETE 
  USING (auth.uid() = user_id);
```

4. Нажмите **"Run"** для выполнения запроса

## Шаг 5: Настройка Email аутентификации

1. В левом меню выберите **Authentication**
2. Выберите **Providers**
3. Найдите **Email** и нажмите на него
4. Убедитесь, что включены:
   - ✅ **Enable Email provider**
   - ✅ **Enable Magic Link**
5. В разделе **Email templates** → **Magic Link**:
   - Можете настроить текст письма (опционально)
   - По умолчанию он уже готов к использованию
6. Нажмите **Save**

## Шаг 6: Настройка URL для редиректа (важно!)

### Для Web

1. В **Authentication** → **URL Configuration**
2. В **Site URL** укажите URL вашего веб-приложения:
   - Для локальной разработки: `http://localhost:19006`
   - Для продакшена: `https://your-domain.com`
3. В **Redirect URLs** добавьте:
   - `http://localhost:19006/**` (для локальной разработки)
   - `https://your-domain.com/**` (для продакшена)

### Для iOS и Android

1. В **Redirect URLs** также добавьте:
   - `peakflowdiary://auth` (для мобильных приложений)

2. Для iOS нужно настроить Deep Linking в `app.json`:

```json
{
  "expo": {
    "scheme": "peakflowdiary"
  }
}
```

3. Для Android также укажите в `app.json`:

```json
{
  "expo": {
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "peakflowdiary"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Шаг 7: Проверка настройки

1. Запустите приложение:
   ```bash
   npm start
   ```

2. При первом запуске вы увидите экран авторизации
3. Введите email и нажмите "Получить ссылку для входа"
4. Проверьте почту и перейдите по ссылке
5. Приложение должно автоматически авторизовать вас

## Troubleshooting

### Письмо не приходит

1. Проверьте папку "Спам"
2. В Supabase → **Authentication** → **Email templates** проверьте настройки
3. На бесплатном плане есть лимит на количество писем (можно проверить в Dashboard)

### Ошибка "Invalid API key"

1. Убедитесь, что скопировали правильный ключ (`anon public`, а не `service_role`)
2. Проверьте, что `.env` файл находится в корне проекта
3. Перезапустите приложение после создания `.env`

### Magic link не работает на мобильных устройствах

1. Убедитесь, что настроили Deep Linking (см. Шаг 6)
2. Проверьте, что URL `peakflowdiary://auth` добавлен в Redirect URLs в Supabase
3. Для iOS может потребоваться настройка Associated Domains

### Ошибка "Row Level Security policy violation"

1. Убедитесь, что выполнили весь SQL код из Шага 4
2. Проверьте в Supabase → **Database** → **Tables**, что для каждой таблицы включен RLS
3. Проверьте политики в **Database** → **Policies**

## Безопасность

⚠️ **Важно:**

- Никогда не коммитьте `.env` файл в Git
- Никогда не используйте `service_role` ключ в клиентском коде
- Используйте только `anon public` ключ
- Row Level Security (RLS) защищает данные на уровне базы данных

## Мониторинг и лимиты

### Бесплатный план Supabase включает:

- 500 MB хранилища базы данных
- 1 GB трансфера в месяц
- 2 GB файлового хранилища
- 50,000 активных пользователей

Для большинства персональных проектов этого достаточно. Можно отслеживать использование в Supabase Dashboard → **Settings** → **Usage**.

## Дополнительные ресурсы

- [Документация Supabase](https://supabase.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)


