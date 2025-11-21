-- 🛡️ AUDIT LOG - Защита от потери данных
-- Скопируйте и выполните весь этот SQL в Supabase SQL Editor

-- ==================== ШАГ 1: СОЗДАНИЕ ТАБЛИЦЫ АУДИТА ====================

-- Создаем таблицу для логирования всех операций
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
  record_id TEXT,
  user_id UUID,
  old_data JSONB,            -- Данные ДО изменения
  new_data JSONB,            -- Данные ПОСЛЕ изменения
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  performed_by UUID REFERENCES auth.users(id)
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- Включаем Row Level Security
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Политика: только service_role может читать логи
CREATE POLICY "Service role can read audit log"
  ON audit_log
  FOR SELECT
  TO service_role
  USING (true);

-- Политика: authenticated пользователи могут видеть свои логи
CREATE POLICY "Users can read own audit log"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (performed_by = auth.uid());

-- ==================== ШАГ 2: ФУНКЦИЯ АУДИТА ====================

-- Создаем универсальную функцию для логирования всех операций
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- DELETE: сохраняем старые данные
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
  
  -- INSERT: сохраняем новые данные
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
  
  -- UPDATE: сохраняем старые и новые данные
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

-- ==================== ШАГ 3: ТРИГГЕРЫ ====================

-- Применяем аудит к таблице pef_records
DROP TRIGGER IF EXISTS audit_pef_records ON pef_records;
CREATE TRIGGER audit_pef_records
  AFTER INSERT OR UPDATE OR DELETE ON pef_records
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();

-- Применяем аудит к таблице profiles (опционально)
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_trigger();

-- ==================== ШАГ 4: ПОЛЕЗНЫЕ ЗАПРОСЫ ====================

-- Создаем VIEW для удобного просмотра аудита
CREATE OR REPLACE VIEW audit_log_readable AS
SELECT 
  id,
  table_name,
  operation,
  record_id,
  user_id,
  old_data->>'date' as old_date,
  old_data->>'time' as old_time,
  old_data->>'value' as old_value,
  new_data->>'date' as new_date,
  new_data->>'time' as new_time,
  new_data->>'value' as new_value,
  performed_at,
  performed_by
FROM audit_log
WHERE table_name = 'pef_records'
ORDER BY performed_at DESC;

-- ==================== ГОТОВО! ====================

-- Проверьте, что все создалось успешно:
SELECT 
  'audit_log table' as component,
  COUNT(*) as count
FROM audit_log
UNION ALL
SELECT 
  'triggers on pef_records',
  COUNT(*)
FROM information_schema.triggers
WHERE event_object_table = 'pef_records'
  AND trigger_name LIKE 'audit%';

-- Если вы видите результаты - ВСЁ ГОТОВО! ✅
-- Теперь все операции с данными логируются в audit_log

-- ==================== ПОЛЕЗНЫЕ ЗАПРОСЫ ДЛЯ МОНИТОРИНГА ====================

-- 1. Все удаления за последние 24 часа
/*
SELECT * FROM audit_log_readable
WHERE operation = 'DELETE'
  AND performed_at > NOW() - INTERVAL '24 hours'
ORDER BY performed_at DESC;
*/

-- 2. Массовые удаления (более 5 записей за час)
/*
SELECT 
  user_id,
  COUNT(*) as deleted_count,
  MIN(performed_at) as first_delete,
  MAX(performed_at) as last_delete
FROM audit_log
WHERE operation = 'DELETE'
  AND table_name = 'pef_records'
  AND performed_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 5;
*/

-- 3. Восстановление удаленных данных конкретного пользователя
/*
SELECT 
  old_data->>'id' as id,
  old_data->>'date' as date,
  old_data->>'time' as time,
  old_data->>'value' as value,
  old_data->>'cough' as cough,
  old_data->>'breathlessness' as breathlessness,
  old_data->>'sputum' as sputum,
  performed_at as deleted_at
FROM audit_log
WHERE operation = 'DELETE'
  AND table_name = 'pef_records'
  AND user_id = 'ВСТАВЬТЕ_USER_ID_СЮДА'::UUID
ORDER BY performed_at DESC;
*/

-- 4. Статистика операций за неделю
/*
SELECT 
  DATE(performed_at) as date,
  operation,
  COUNT(*) as count
FROM audit_log
WHERE performed_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(performed_at), operation
ORDER BY date DESC, operation;
*/

-- ==================== КАК ВОССТАНОВИТЬ ДАННЫЕ ====================

-- Если данные были случайно удалены, вы можете их восстановить:
/*
-- 1. Найдите удаленные записи в audit_log
SELECT * FROM audit_log
WHERE operation = 'DELETE'
  AND table_name = 'pef_records'
  AND user_id = 'USER_ID'::UUID
ORDER BY performed_at DESC;

-- 2. Восстановите данные (замените на реальные данные из old_data)
INSERT INTO pef_records (id, user_id, date, time, value, cough, breathlessness, sputum)
SELECT 
  (old_data->>'id')::TEXT,
  (old_data->>'user_id')::UUID,
  (old_data->>'date')::DATE,
  (old_data->>'time')::TIME,
  (old_data->>'value')::INTEGER,
  (old_data->>'cough')::BOOLEAN,
  (old_data->>'breathlessness')::BOOLEAN,
  (old_data->>'sputum')::BOOLEAN
FROM audit_log
WHERE id = 'КОНКРЕТНЫЙ_AUDIT_LOG_ID'::UUID;
*/

