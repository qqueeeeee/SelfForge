-- Create daily_logs table for habit tracking
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sleep_hours DECIMAL(3,1),
  study_hours DECIMAL(3,1),
  gym_completed BOOLEAN DEFAULT false,
  screen_time_hours DECIMAL(3,1),
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Create custom_habits table for user-defined habits
CREATE TABLE public.custom_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_id UUID REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  habit_name TEXT NOT NULL,
  habit_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_notes table for journal/notes with markdown support
CREATE TABLE public.user_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_logs
CREATE POLICY "Users can view their own logs" 
ON public.daily_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own logs" 
ON public.daily_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" 
ON public.daily_logs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs" 
ON public.daily_logs FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for custom_habits
CREATE POLICY "Users can view their own custom habits" 
ON public.custom_habits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own custom habits" 
ON public.custom_habits FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom habits" 
ON public.custom_habits FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom habits" 
ON public.custom_habits FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for user_notes
CREATE POLICY "Users can view their own notes" 
ON public.user_notes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.user_notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.user_notes FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.user_notes FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_daily_logs_updated_at
BEFORE UPDATE ON public.daily_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at
BEFORE UPDATE ON public.user_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();