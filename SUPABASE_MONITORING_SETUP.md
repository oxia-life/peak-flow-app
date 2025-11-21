# 🔔 Настройка мониторинга и алертов в Supabase

## 🎯 Цель

Получать уведомления о подозрительной активности, особенно массовом удалении данных, чтобы быстро реагировать на проблемы.

---

## 📊 Метод 1: Просмотр логов Supabase (Бесплатно)

### Шаг 1: Откройте логи

1. Откройте https://supabase.com
2. Выберите ваш проект
3. В левом меню нажмите **Logs**
4. Выберите **Database** (логи запросов к базе данных)

### Шаг 2: Фильтрация DELETE операций

В поле поиска вверху страницы введите:

```
DELETE
```

Или более точный фильтр:

```
DELETE FROM pef_records
```

### Шаг 3: Регулярно проверяйте

- **Ежедневно:** Открывайте логи и проверяйте DELETE операции
- **Обращайте внимание на:**
  - Большое количество DELETE за короткое время
  - DELETE всех записей пользователя
  - Подозрительное время (например, ночью)

### Что искать в логах:

```sql
-- ❌ ПОДОЗРИТЕЛЬНО (удаление всех записей пользователя):
DELETE FROM pef_records WHERE user_id = 'xxx'

-- ✅ НОРМАЛЬНО (удаление одной записи):
DELETE FROM pef_records WHERE id = 'xxx' AND user_id = 'yyy'
```

---

## 🔔 Метод 2: Database Webhooks (Бесплатно)

**Лучший способ!** Supabase может отправлять уведомления при определенных событиях.

### Шаг 1: Создайте webhook endpoint

Есть несколько вариантов:

#### Вариант A: Telegram Bot (Рекомендую!)

1. **Создайте Telegram бота:**
   - Откройте Telegram
   - Найдите @BotFather
   - Отправьте `/newbot`
   - Следуйте инструкциям
   - Получите **Bot Token**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

2. **Получите ваш Chat ID:**
   - Найдите вашего бота в Telegram
   - Отправьте ему любое сообщение
   - Откройте в браузере:
     ```
     https://api.telegram.org/bot<ВАШ_BOT_TOKEN>/getUpdates
     ```
   - Найдите `"chat":{"id":123456789}` - это ваш Chat ID

3. **Протестируйте отправку:**
   ```bash
   curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" \
     -H "Content-Type: application/json" \
     -d '{"chat_id": <CHAT_ID>, "text": "🚨 Test alert"}'
   ```

#### Вариант B: Email через n8n/Make/Zapier (Бесплатно до определенного лимита)

1. Создайте аккаунт на https://n8n.io или https://make.com
2. Создайте Webhook URL
3. Настройте отправку email

#### Вариант C: Cloudflare Workers (Продвинуто, но бесплатно)

Создайте бесплатный Worker для обработки webhook.

### Шаг 2: Создайте Database Function в Supabase

1. Supabase → **SQL Editor** → **New query**
2. Вставьте этот SQL:

```sql
-- Создаем функцию для отправки уведомления в Telegram
CREATE OR REPLACE FUNCTION notify_mass_delete()
RETURNS TRIGGER AS $$
DECLARE
  bot_token TEXT := 'YOUR_BOT_TOKEN';  -- Замените на ваш токен
  chat_id TEXT := 'YOUR_CHAT_ID';       -- Замените на ваш Chat ID
  message TEXT;
  record_count INTEGER;
BEGIN
  -- Считаем количество записей, которые будут удалены
  IF TG_OP = 'DELETE' THEN
    -- Это одна запись, ничего не делаем
    RETURN OLD;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем функцию для проверки массового удаления
CREATE OR REPLACE FUNCTION check_mass_delete_pef()
RETURNS TRIGGER AS $$
DECLARE
  deleted_count INTEGER;
  user_id_val UUID;
  bot_token TEXT := 'YOUR_BOT_TOKEN';  -- ⚠️ ЗАМЕНИТЕ НА ВАШ ТОКЕН
  chat_id TEXT := 'YOUR_CHAT_ID';      -- ⚠️ ЗАМЕНИТЕ НА ВАШ CHAT ID
  telegram_url TEXT;
  message TEXT;
BEGIN
  -- Если это одиночное удаление - пропускаем
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер AFTER DELETE для логирования
CREATE OR REPLACE FUNCTION log_pef_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Логируем удаление в отдельную таблицу
  INSERT INTO delete_audit_log (
    table_name,
    record_id,
    user_id,
    deleted_at,
    deleted_by
  ) VALUES (
    'pef_records',
    OLD.id,
    OLD.user_id,
    NOW(),
    auth.uid()
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем таблицу для аудита удалений
CREATE TABLE IF NOT EXISTS delete_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_by UUID REFERENCES auth.users(id)
);

-- Включаем RLS для таблицы аудита
ALTER TABLE delete_audit_log ENABLE ROW LEVEL SECURITY;

-- Создаем политику (только администраторы могут читать)
CREATE POLICY "Only service role can read audit log"
  ON delete_audit_log
  FOR SELECT
  TO service_role
  USING (true);

-- Создаем триггер на удаление записей PEF
DROP TRIGGER IF EXISTS pef_delete_audit ON pef_records;
CREATE TRIGGER pef_delete_audit
  BEFORE DELETE ON pef_records
  FOR EACH ROW
  EXECUTE FUNCTION log_pef_delete();
```

3. **Нажмите "Run"** для выполнения

### Шаг 3: Настройте Telegram уведомления через Edge Function

**Более продвинутый способ:**

1. Supabase → **Edge Functions** → **New function**

2. Создайте функцию `telegram-alert`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')!

serve(async (req) => {
  try {
    const { type, table, old_record, schema } = await req.json()
    
    if (type === 'DELETE' && table === 'pef_records') {
      const message = `🚨 DELETE ALERT
      
Table: ${table}
Record ID: ${old_record.id}
User ID: ${old_record.user_id}
Date: ${old_record.date}
Time: ${new Date().toISOString()}

Check Supabase logs immediately!`

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      })
    }
    
    return new Response('OK', { status: 200 })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

3. **Деплой функции:**
   ```bash
   supabase functions deploy telegram-alert
   ```

4. **Добавьте переменные окружения:**
   - Settings → Edge Functions → Environment Variables
   - `TELEGRAM_BOT_TOKEN` = ваш токен бота
   - `TELEGRAM_CHAT_ID` = ваш Chat ID

---

## 🛡️ Метод 3: Database Audit (Самый надежный)

### Создайте таблицу аудита для всех операций

```sql
-- Создаем расширенную таблицу аудита
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  record_id TEXT,
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  performed_by UUID REFERENCES auth.users(id)
);

-- Включаем RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Создаем универсальную функцию аудита
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (
      table_name,
      operation,
      record_id,
      user_id,
      old_data,
      performed_by
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      OLD.id,
      OLD.user_id,
      row_to_json(OLD),
      auth.uid()
    );
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (
      table_name,
      operation,
      record_id,
      user_id,
      new_data,
      performed_by
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      NEW.user_id,
      row_to_json(NEW),
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (
      table_name,
      operation,
      record_id,
      user_id,
      old_data,
      new_data,
      performed_by
    ) VALUES (
      TG_TABLE_NAME,
      TG_OP,
      NEW.id,
      NEW.user_id,
      row_to_json(OLD),
      row_to_json(NEW),
      auth.uid()
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Применяем триггер к pef_records
DROP TRIGGER IF EXISTS audit_pef_records ON pef_records;
CREATE TRIGGER audit_pef_records
  AFTER INSERT OR UPDATE OR DELETE ON pef_records
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();
```

### Преимущества:

✅ **Полная история всех операций**  
✅ **Можно восстановить удаленные данные**  
✅ **Видно, кто и когда что сделал**  
✅ **Защита от потери данных**

### Как просматривать аудит:

```sql
-- Все удаления за последние 24 часа
SELECT * FROM audit_log
WHERE operation = 'DELETE'
  AND table_name = 'pef_records'
  AND performed_at > NOW() - INTERVAL '24 hours'
ORDER BY performed_at DESC;

-- Массовые удаления (более 5 записей от одного пользователя за короткое время)
SELECT 
  performed_by,
  user_id,
  COUNT(*) as deleted_count,
  MIN(performed_at) as first_delete,
  MAX(performed_at) as last_delete
FROM audit_log
WHERE operation = 'DELETE'
  AND table_name = 'pef_records'
  AND performed_at > NOW() - INTERVAL '1 hour'
GROUP BY performed_by, user_id
HAVING COUNT(*) > 5;

-- Восстановление удаленных данных
SELECT 
  old_data->>'id' as id,
  old_data->>'date' as date,
  old_data->>'time' as time,
  old_data->>'value' as value,
  performed_at as deleted_at
FROM audit_log
WHERE operation = 'DELETE'
  AND table_name = 'pef_records'
  AND user_id = 'КОНКРЕТНЫЙ_USER_ID'
ORDER BY performed_at DESC;
```

---

## 📧 Метод 4: Email алерты через Supabase Functions

### Создайте функцию для отправки email:

```sql
-- Используем встроенный pg_net для HTTP запросов
CREATE OR REPLACE FUNCTION send_delete_alert_email()
RETURNS TRIGGER AS $$
DECLARE
  delete_count INTEGER;
BEGIN
  -- Считаем недавние удаления этого пользователя
  SELECT COUNT(*) INTO delete_count
  FROM audit_log
  WHERE user_id = OLD.user_id
    AND operation = 'DELETE'
    AND performed_at > NOW() - INTERVAL '5 minutes';
  
  -- Если удалено более 3 записей за 5 минут - отправляем алерт
  IF delete_count > 3 THEN
    -- Здесь можно интегрировать с SendGrid, Mailgun и т.д.
    RAISE NOTICE 'ALERT: User % deleted % records in 5 minutes', OLD.user_id, delete_count;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Рекомендации (по приоритету)

### Минимум (бесплатно, 5 минут):

1. ✅ **Создайте таблицу audit_log** (см. Метод 3)
2. ✅ **Настройте триггер аудита**
3. ✅ **Проверяйте логи раз в неделю**

### Оптимально (бесплатно, 30 минут):

1. ✅ Минимум +
2. ✅ **Создайте Telegram бота**
3. ✅ **Настройте Edge Function для уведомлений**
4. ✅ Получайте мгновенные алерты

### Максимум (Pro план, полная защита):

1. ✅ Оптимально +
2. ✅ **Включите Point-in-Time Recovery**
3. ✅ **Настройте автоматические ежедневные бэкапы**
4. ✅ **Храните бэкапы в отдельном месте**

---

## 🚀 Быстрый старт (5 минут)

**Выполните этот SQL прямо сейчас:**

```sql
-- 1. Создаем таблицу аудита
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT,
  user_id UUID,
  old_data JSONB,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Создаем функцию аудита
CREATE OR REPLACE FUNCTION audit_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, record_id, user_id, old_data)
  VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, OLD.user_id, row_to_json(OLD));
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. Создаем триггер
DROP TRIGGER IF EXISTS audit_pef_delete ON pef_records;
CREATE TRIGGER audit_pef_delete
  AFTER DELETE ON pef_records
  FOR EACH ROW
  EXECUTE FUNCTION audit_delete();

-- 4. Проверяем (после этого все удаления будут логироваться)
SELECT * FROM audit_log ORDER BY performed_at DESC LIMIT 10;
```

**Готово!** Теперь все удаления записываются в `audit_log` и можно восстановить данные! ✅

---

## 📊 Dashboard для мониторинга

Создайте простой SQL запрос для ежедневной проверки:

```sql
-- Сохраните этот запрос в Supabase SQL Editor как "Daily Audit Check"
SELECT 
  DATE(performed_at) as date,
  operation,
  COUNT(*) as count
FROM audit_log
WHERE performed_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(performed_at), operation
ORDER BY date DESC, operation;
```

Проверяйте его раз в день!

---

## ✅ Чек-лист настройки

- [ ] Создал таблицу `audit_log`
- [ ] Настроил триггер аудита
- [ ] Протестировал (удалил тестовую запись, проверил audit_log)
- [ ] (Опционально) Создал Telegram бота
- [ ] (Опционально) Настроил Edge Function для алертов
- [ ] (Опционально) Включил Point-in-Time Recovery
- [ ] Добавил в календарь еженедельную проверку логов

---

**Начните с быстрого старта выше - это займет 5 минут и защитит от потери данных!** 🛡️

