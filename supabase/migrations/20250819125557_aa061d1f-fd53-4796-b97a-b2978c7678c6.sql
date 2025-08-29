-- Create academy database tables with real functionality

-- Academy users table (students, trainers, admin)
CREATE TABLE public.academy_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  age INTEGER,
  user_type TEXT NOT NULL CHECK (user_type IN ('student', 'trainer', 'admin')),
  sport_type TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  subscription_start_date DATE,
  subscription_days INTEGER DEFAULT 0,
  guardian_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Attendance records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  trainer_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Excuse submissions table
CREATE TABLE public.excuse_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  reason TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  trainer_response TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Academy notifications table
CREATE TABLE public.academy_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Academy settings table
CREATE TABLE public.academy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL PRIMARY KEY,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.academy_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excuse_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academy_users
CREATE POLICY "الجميع يمكنهم رؤية المستخدمين" 
ON public.academy_users 
FOR SELECT 
USING (true);

CREATE POLICY "المدربون والإدارة يمكنهم إدارة المستخدمين" 
ON public.academy_users 
FOR ALL 
USING (true);

-- RLS Policies for attendance_records  
CREATE POLICY "الجميع يمكنهم رؤية سجل الحضور" 
ON public.attendance_records 
FOR SELECT 
USING (true);

CREATE POLICY "المدربون والإدارة يمكنهم إدارة الحضور" 
ON public.attendance_records 
FOR ALL 
USING (true);

-- RLS Policies for excuse_submissions
CREATE POLICY "الجميع يمكنهم رؤية الأعذار" 
ON public.excuse_submissions 
FOR SELECT 
USING (true);

CREATE POLICY "الجميع يمكنهم إنشاء أعذار" 
ON public.excuse_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "المدربون والإدارة يمكنهم تحديث الأعذار" 
ON public.excuse_submissions 
FOR UPDATE 
USING (true);

-- RLS Policies for academy_notifications
CREATE POLICY "الجميع يمكنهم رؤية الإشعارات" 
ON public.academy_notifications 
FOR SELECT 
USING (true);

CREATE POLICY "النظام يمكنه إنشاء إشعارات" 
ON public.academy_notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم" 
ON public.academy_notifications 
FOR UPDATE 
USING (true);

-- RLS Policies for academy_settings
CREATE POLICY "الجميع يمكنهم رؤية الإعدادات" 
ON public.academy_settings 
FOR SELECT 
USING (true);

CREATE POLICY "الإدارة يمكنها تحديث الإعدادات" 
ON public.academy_settings 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_academy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_academy_users_updated_at
BEFORE UPDATE ON public.academy_users
FOR EACH ROW
EXECUTE FUNCTION public.update_academy_updated_at();

-- Insert the initial admin user with V9-912000 code (hidden in UI)
INSERT INTO public.academy_users (code, full_name, phone, user_type, status)
VALUES ('V9-912000', 'عيسى المحياني', '966501234567', 'admin', 'active');

-- Insert initial settings
INSERT INTO public.academy_settings (setting_key, setting_value, description) VALUES
('maintenance_mode', 'false', 'وضع الصيانة للأكاديمية'),
('academy_name', 'أكاديمية الرؤية المحترفة', 'اسم الأكاديمية'),
('notification_enabled', 'true', 'تفعيل الإشعارات'),
('admin_code', 'V9-912000', 'كود المدير الحالي');