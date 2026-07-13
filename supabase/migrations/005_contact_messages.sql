-- ============================================================
-- 005_contact_messages.sql
-- Contact form submissions table
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  type       text        NOT NULL DEFAULT 'other',
  subject    text        NOT NULL,
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT contact_messages_type_check CHECK (
    type IN ('brand', 'talent', 'other')
  )
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages(created_at DESC);

-- No RLS needed — insert-only via service role (adminClient)
-- Admins read via Supabase dashboard / adminClient
