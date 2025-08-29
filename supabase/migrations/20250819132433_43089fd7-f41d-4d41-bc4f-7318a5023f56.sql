-- حذف جميع البيانات الحالية
DELETE FROM academy_notifications;
DELETE FROM excuse_submissions; 
DELETE FROM attendance_records;
DELETE FROM chat_messages;
DELETE FROM chat_conversations;
DELETE FROM academy_users;

-- إعادة تعيين الإعدادات
UPDATE academy_settings SET setting_value = 'false' WHERE setting_key = 'maintenance_mode';
UPDATE academy_settings SET setting_value = 'true' WHERE setting_key = 'notifications_enabled';

-- إدراج المدير الوحيد بكود مخفي
INSERT INTO academy_users (
  id,
  full_name,
  phone, 
  user_type,
  code,
  status,
  age,
  created_at
) VALUES (
  gen_random_uuid(),
  'عيسى المحياني',
  '0501234567',
  'admin',
  'V9-912000',
  'active', 
  35,
  now()
);