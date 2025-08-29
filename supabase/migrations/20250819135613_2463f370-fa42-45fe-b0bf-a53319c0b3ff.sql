-- Add missing columns to academy_users table
ALTER TABLE public.academy_users 
ADD COLUMN IF NOT EXISTS guardian_phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS sport_type text,
ADD COLUMN IF NOT EXISTS subscription_start_date date,
ADD COLUMN IF NOT EXISTS subscription_days integer;

-- Update user_type constraint to include 'student' alongside 'player'
ALTER TABLE public.academy_users DROP CONSTRAINT IF EXISTS academy_users_user_type_check;
ALTER TABLE public.academy_users ADD CONSTRAINT academy_users_user_type_check 
CHECK (user_type IN ('player', 'student', 'trainer', 'admin'));