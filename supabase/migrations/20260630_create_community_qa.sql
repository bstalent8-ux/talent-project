-- ============================================================
-- 20260630_create_community_qa.sql
-- Create community Q&A tables with proper schema
-- ============================================================

-- 1. Create community_questions table
CREATE TABLE IF NOT EXISTS public.community_questions (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  content          text        NOT NULL,
  tags             text[]      DEFAULT '{}'::text[],
  views            integer     DEFAULT 0,
  status           text        DEFAULT 'open' CHECK (status IN ('open', 'pinned', 'closed')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 2. Create community_answers (comments) table
CREATE TABLE IF NOT EXISTS public.community_answers (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id      uuid        NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content          text        NOT NULL,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.community_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_answers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for community_questions
DROP POLICY IF EXISTS "questions_select_public" ON public.community_questions;
CREATE POLICY "questions_select_public"
  ON public.community_questions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "questions_insert_auth" ON public.community_questions;
CREATE POLICY "questions_insert_auth"
  ON public.community_questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "questions_update_own" ON public.community_questions;
CREATE POLICY "questions_update_own"
  ON public.community_questions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "questions_delete_own" ON public.community_questions;
CREATE POLICY "questions_delete_own"
  ON public.community_questions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. RLS Policies for community_answers
DROP POLICY IF EXISTS "answers_select_public" ON public.community_answers;
CREATE POLICY "answers_select_public"
  ON public.community_answers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "answers_insert_auth" ON public.community_answers;
CREATE POLICY "answers_insert_auth"
  ON public.community_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "answers_update_own" ON public.community_answers;
CREATE POLICY "answers_update_own"
  ON public.community_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "answers_delete_own" ON public.community_answers;
CREATE POLICY "answers_delete_own"
  ON public.community_answers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. Indexes for fast query resolution
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON public.community_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.community_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_status ON public.community_questions(status);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.community_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON public.community_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_created_at ON public.community_answers(created_at DESC);
