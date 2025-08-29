-- إضافة كود المدير V9-91200 إلى قاعدة البيانات
INSERT INTO public.academy_users (
    code, 
    full_name, 
    phone, 
    user_type, 
    status,
    age,
    job_position
) VALUES (
    'V9-91200',
    'مدير الأكاديمية',
    '0500000000',
    'admin',
    'active',
    35,
    'مدير عام'
) ON CONFLICT (code) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    user_type = EXCLUDED.user_type,
    status = EXCLUDED.status,
    updated_at = now();