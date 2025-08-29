-- إنشاء الجداول الأساسية للأكاديمية
CREATE TABLE public.academy_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  guardian_phone TEXT,
  age INTEGER,
  address TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'trainer', 'admin')),
  sport_type TEXT,
  subscription_days INTEGER DEFAULT 0,
  subscription_start_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجل الحضور
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.academy_users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.academy_users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول طلبات الأعذار
CREATE TABLE public.excuse_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.academy_users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  trainer_response TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- جدول الإشعارات
CREATE TABLE public.academy_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.academy_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('attendance', 'excuse', 'subscription', 'maintenance', 'general')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات الأكاديمية
CREATE TABLE public.academy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المحادثات
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.academy_users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES public.academy_users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل المحادثات
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.academy_users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS على جميع الجداول
ALTER TABLE public.academy_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuse_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "الجميع يمكنهم رؤية المستخدمين" ON public.academy_users FOR SELECT USING (true);
CREATE POLICY "المدربون والإدارة يمكنهم إدارة المستخدمين" ON public.academy_users FOR ALL USING (true);

CREATE POLICY "الجميع يمكنهم رؤية سجل الحضور" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "المدربون والإدارة يمكنهم إدارة الحضور" ON public.attendance_records FOR ALL USING (true);

CREATE POLICY "الجميع يمكنهم رؤية الأعذار" ON public.excuse_submissions FOR SELECT USING (true);
CREATE POLICY "الجميع يمكنهم إنشاء أعذار" ON public.excuse_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "المدربون والإدارة يمكنهم تحديث الأعذار" ON public.excuse_submissions FOR UPDATE USING (true);

CREATE POLICY "الجميع يمكنهم رؤية الإشعارات" ON public.academy_notifications FOR SELECT USING (true);
CREATE POLICY "النظام يمكنه إنشاء إشعارات" ON public.academy_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم" ON public.academy_notifications FOR UPDATE USING (true);

CREATE POLICY "الجميع يمكنهم رؤية الإعدادات" ON public.academy_settings FOR SELECT USING (true);
CREATE POLICY "الإدارة يمكنها تحديث الإعدادات" ON public.academy_settings FOR ALL USING (true);

CREATE POLICY "الجميع يمكنهم رؤية المحادثات" ON public.chat_conversations FOR SELECT USING (true);
CREATE POLICY "الجميع يمكنهم إنشاء محادثات" ON public.chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "المشاركون يمكنهم تحديث المحادثات" ON public.chat_conversations FOR UPDATE USING (true);

CREATE POLICY "الجميع يمكنهم رؤية الرسائل" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "الجميع يمكنهم إنشاء رسائل" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- إدراج بيانات أولية
INSERT INTO public.academy_settings (setting_key, setting_value, description) VALUES
('api_key', '', 'مفتاح API للذكاء الاصطناعي'),
('ai_minutes_limit', '10', 'عدد دقائق الذكاء الاصطناعي للطلاب'),
('maintenance_mode', 'false', 'وضع الصيانة'),
('auto_sync_interval', '2', 'فترة التحديث التلقائي بالثواني');

-- إنشاء المدير الافتراضي
INSERT INTO public.academy_users (code, full_name, phone, user_type, age) VALUES
('V9-912000', 'مدير الأكاديمية', '0500000000', 'admin', 35);

-- إنشاء triggers للتحديث التلقائي
CREATE OR REPLACE FUNCTION public.update_academy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_academy_users_updated_at
  BEFORE UPDATE ON public.academy_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_academy_updated_at();

CREATE TRIGGER update_academy_settings_updated_at
  BEFORE UPDATE ON public.academy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_academy_updated_at();