-- ============================================================
-- 004_notifications.sql
-- Notification system for the Talents marketplace platform
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           text        NOT NULL,
  title          text        NOT NULL,
  message        text        NOT NULL,
  reference_id   uuid        DEFAULT NULL,
  reference_type text        DEFAULT NULL,
  is_read        boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT notifications_type_check CHECK (
    type IN ('message', 'job_application', 'brief', 'booking', 'payment', 'review', 'system')
  ),
  CONSTRAINT notifications_ref_type_check CHECK (
    reference_type IN ('chat', 'job', 'brief', 'booking', 'payment', 'review')
    OR reference_type IS NULL
  )
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);

-- Partial index for fast unread badge queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE is_read = false;

-- 3. Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can SELECT only their own notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can UPDATE only their own notifications (mark as read)
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- INSERT is blocked for regular users — only service role (adminClient) can insert
-- (service role automatically bypasses RLS, no policy needed)

-- 4. Enable Realtime on this table
-- If the publication already exists, just add the table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
