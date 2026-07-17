
-- Profiles table (auto-created on signup)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  target_exam TEXT DEFAULT 'pte_academic' CHECK (target_exam IN ('pte_academic', 'pte_core')),
  target_score INTEGER DEFAULT 65,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Questions table (AI-generated + seeded)
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type TEXT NOT NULL DEFAULT 'pte_academic' CHECK (exam_type IN ('pte_academic', 'pte_core')),
  skill TEXT NOT NULL CHECK (skill IN ('speaking', 'writing', 'reading', 'listening')),
  sub_type TEXT NOT NULL,
  title TEXT NOT NULL,
  instruction TEXT NOT NULL,
  content TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  audio_url TEXT,
  image_url TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are readable by authenticated users" ON public.questions FOR SELECT TO authenticated USING (true);

-- Practice sessions
CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_audio_url TEXT,
  score JSONB,
  overall_score INTEGER,
  feedback TEXT,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.practice_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.practice_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mock tests
CREATE TABLE public.mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL DEFAULT 'pte_academic',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  question_ids JSONB NOT NULL DEFAULT '[]',
  answers JSONB NOT NULL DEFAULT '{}',
  scores JSONB,
  overall_score INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own mock tests" ON public.mock_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mock tests" ON public.mock_tests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mock tests" ON public.mock_tests FOR UPDATE USING (auth.uid() = user_id);

-- User vocabulary
CREATE TABLE public.user_vocab (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  pronunciation TEXT,
  meaning TEXT NOT NULL,
  example_sentence TEXT,
  is_mastered BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_vocab ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own vocab" ON public.user_vocab FOR ALL USING (auth.uid() = user_id);

-- Study progress / analytics
CREATE TABLE public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  questions_done INTEGER DEFAULT 0,
  speaking_score INTEGER,
  writing_score INTEGER,
  reading_score INTEGER,
  listening_score INTEGER,
  study_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own stats" ON public.daily_stats FOR ALL USING (auth.uid() = user_id);
