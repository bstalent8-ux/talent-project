-- ─── Support tickets on contact_messages ───────────────────────────────────
-- Quick "having trouble?" tickets from the register/login pages reuse the
-- existing contact_messages table (type='support') instead of a new table —
-- one admin inbox for both the full Contact Us form and these quick tickets.
--
-- New columns: phone (second contact channel alongside email — required on
-- the full contact form's email already, phone stays optional), status
-- (admin triage), admin_reply + replied_at (admin's reply, shown/emailed
-- back to the submitter), context (jsonb: which page, what error was on
-- screen, when — captured automatically so the admin doesn't have to ask).
--
-- contact_messages itself turned out to not exist on this database at all —
-- 005_contact_messages.sql (the table's original migration) was written but
-- never actually run here, same class of drift as 20260727_fix_schema_drift
-- (deliverables). Creating it below, idempotently, so this file works
-- standalone regardless of whether 005 was ever applied.

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  type       text        NOT NULL DEFAULT 'other',
  subject    text        NOT NULL,
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages(created_at DESC);

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS phone      text,
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS admin_reply text,
  ADD COLUMN IF NOT EXISTS replied_at timestamptz,
  ADD COLUMN IF NOT EXISTS context    jsonb;

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_type_check;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_type_check
  CHECK (type IN ('brand', 'talent', 'other', 'support'));

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_status_check;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_status_check
  CHECK (status IN ('new', 'in_progress', 'resolved'));

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);

DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.contact_messages;
  RAISE NOTICE 'contact_messages ready, % existing row(s), new columns: phone/status/admin_reply/replied_at/context', v_count;
END $$;
