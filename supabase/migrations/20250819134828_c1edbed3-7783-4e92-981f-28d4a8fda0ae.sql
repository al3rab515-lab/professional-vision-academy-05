-- إنشاء جدول المستخدمين
CREATE TABLE public.academy_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  age INTEGER,
  email TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'trainer', 'player')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  -- خاص باللاعبين
  residential_area TEXT,
  subscription_duration TEXT,
  learning_goals TEXT,
  parent_phone TEXT,
  -- خاص بالمدربين
  salary DECIMAL(10,2),
  job_position TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول سجلات الحضور
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول طلبات الأعذار
CREATE TABLE public.excuse_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES academy_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  trainer_response TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- إنشاء جدول الإشعارات
CREATE TABLE public.academy_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES academy_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  phone_number TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول الإعدادات
CREATE TABLE public.academy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.academy_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuse_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان (السماح للجميع مؤقتاً لأنه لا يوجد نظام مصادقة)
CREATE POLICY "Allow all operations on academy_users" ON public.academy_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on attendance_records" ON public.attendance_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on excuse_submissions" ON public.excuse_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on academy_notifications" ON public.academy_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on academy_settings" ON public.academy_settings FOR ALL USING (true) WITH CHECK (true);

-- إدراج الإعدادات الافتراضية
INSERT INTO public.academy_settings (key, value) VALUES
('academy_name', 'أكاديمية الرؤية المحترفة'),
('admin_code', 'V9-912000'),
('maintenance_mode', 'false'),
('notification_enabled', 'true'),
('whatsapp_api_key', ''),
('openai_api_key', '');

-- إدراج المدير الافتراضي
INSERT INTO public.academy_users (full_name, code, phone, user_type, email) VALUES
('عيسى المحياني', 'V9-912000', '966500000000', 'admin', 'admin@academy.com');

-- إنشاء دالة تحديث الوقت
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفزات
CREATE TRIGGER update_academy_users_updated_at
  BEFORE UPDATE ON public.academy_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academy_settings_updated_at
  BEFORE UPDATE ON public.academy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();