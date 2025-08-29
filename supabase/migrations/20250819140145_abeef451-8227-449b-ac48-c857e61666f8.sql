-- Update admin code setting
INSERT INTO public.academy_settings (key, value) 
VALUES ('admin_code', 'V9-91200')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;