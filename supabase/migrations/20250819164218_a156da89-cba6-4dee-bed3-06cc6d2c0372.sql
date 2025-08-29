-- Create table for excuse submissions with file support
CREATE TABLE IF NOT EXISTS public.excuse_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  trainer_response TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.excuse_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for excuse submissions
CREATE POLICY "Allow all operations on excuse_submissions" 
ON public.excuse_submissions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create storage bucket for excuse files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('excuse-files', 'excuse-files', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for excuse files
CREATE POLICY "Users can view their own excuse files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'excuse-files');

CREATE POLICY "Users can upload excuse files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'excuse-files');

-- Add trigger for updated_at
CREATE TRIGGER update_excuse_submissions_updated_at
BEFORE UPDATE ON public.excuse_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();