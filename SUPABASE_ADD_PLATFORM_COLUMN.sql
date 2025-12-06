-- ============================================
-- Добавление колонки registered_platform в таблицу profiles
-- Выполните этот SQL в Supabase SQL Editor
-- ============================================

-- 1. Добавляем колонку registered_platform
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS registered_platform TEXT;

-- 2. Добавляем комментарий для документации
COMMENT ON COLUMN profiles.registered_platform IS 'Платформа, с которой пользователь зарегистрировался: web, ios, android';

-- 3. (Опционально) Создаём индекс для быстрой фильтрации
CREATE INDEX IF NOT EXISTS idx_profiles_registered_platform 
ON profiles(registered_platform);

-- ============================================
-- Полезные запросы для аналитики
-- ============================================

-- Количество пользователей по платформам
-- SELECT 
--   registered_platform, 
--   COUNT(*) as user_count 
-- FROM profiles 
-- GROUP BY registered_platform 
-- ORDER BY user_count DESC;

-- Пользователи без указанной платформы (зарегистрированные до этого обновления)
-- SELECT COUNT(*) as legacy_users 
-- FROM profiles 
-- WHERE registered_platform IS NULL;

-- Детальная статистика с датами
-- SELECT 
--   registered_platform,
--   DATE(created_at) as registration_date,
--   COUNT(*) as users
-- FROM profiles 
-- GROUP BY registered_platform, DATE(created_at)
-- ORDER BY registration_date DESC;
