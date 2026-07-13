-- ============================================================
-- create_community_tables.sql
-- Run this in Supabase Dashboard → SQL Editor
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
  created_at       timestamptz DEFAULT now()
);

-- 2. Create community_answers (comments) table
CREATE TABLE IF NOT EXISTS public.community_answers (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id      uuid        NOT NULL REFERENCES public.community_questions(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content          text        NOT NULL,
  created_at       timestamptz DEFAULT now()
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
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON public.community_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_user_id ON public.community_answers(user_id);

-- 7. Seed Initial Community Data using existing profile IDs
INSERT INTO public.community_questions (id, user_id, title, content, tags, views, status)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111', 
    'b4807ee7-b141-47fe-b67a-ebaab8f31a5d', -- Rana Tarek
    'ما هي أفضل الطرق لتسعير جلسات تصوير الـ UGC للبراندات الناشئة؟', 
    'بقالي فترة بشتغل كصانع محتوى وبواجه مشكلة في تحديد سعر السيشن للشركات اللي لسه بتبدأ، هل السعر يكون ثابت ولا على حسب حجم الحملة الإعلانية؟ مفضل خبرتكم..', 
    ARRAY['تسعير', 'صناعة المحتوى', 'UGC'], 
    142, 
    'open'
  ),
  (
    '22222222-2222-2222-2222-222222222222', 
    'c8419e18-4863-4b69-8877-de6581fc828e', -- Omar Digital
    'مطلوب نصيحة: براند فاشون بيبحث عن مواهب لعمل حملة صيفية بالأسكندرية', 
    'بنرتب لحملة تصوير خارجية ومحتاجين موديلز وإنفلونسرز مقيمين في الأسكندرية أو يقدروا يتواجدوا هناك، إيه أفضل طريقة لتصفية المتقدمين عشان نضمن التزامهم بالوقت؟', 
    ARRAY['حملة_صيفية', 'تنسيق', 'فاشون'], 
    310, 
    'pinned'
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Answers
INSERT INTO public.community_answers (question_id, user_id, content)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'c8419e18-4863-4b69-8877-de6581fc828e',
    'أهلاً رنا، كبراند، بنفضّل نشتري حِزم (packages) بعدد الفيديوهات، مثلاً 3 فيديوهات بسعر مخفّض. التسعير الثابت أفضل في البداية.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'b4807ee7-b141-47fe-b67a-ebaab8f31a5d',
    'بنصح بعمل نموذج تعاقد بسيط يلتزم فيه صانع المحتوى بالتواريخ المتفق عليها، مع دفع عربون بسيط كعامل التزام.'
  )
ON CONFLICT DO NOTHING;
