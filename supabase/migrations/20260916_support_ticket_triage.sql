-- ─── Support ticket triage: assignee, admin-only note, seen/process/done ───
-- Extends contact_messages (the existing support-ticket + contact-form inbox
-- from 20260823_support_tickets.sql) rather than a new table — same "one
-- admin inbox" reasoning that migration used.
--
-- New columns:
--   assigned_admin  — free-text label an admin writes on a ticket to claim
--                      it (e.g. "admin-1"). Not a profiles FK: this mirrors
--                      how the admin actually asked for it ("write admin-1
--                      on it"), a lightweight claim tag, not a formal
--                      assignment system.
--   admin_note      — internal note, distinct from admin_reply (which is
--                      user-facing and optionally emailed back). Never shown
--                      to the ticket submitter.
--   attachment_type — 'image' | 'video'. The quick ticket modal now accepts
--                      a short video of the problem, not just a screenshot;
--                      the admin UI needs this to know whether to render
--                      <img> or <video>.
--
-- Status vocabulary widened from ('new','in_progress','resolved') to
-- ('new','seen','process','done') — the admin wants exactly those three
-- triage states after a ticket lands as 'new'. Existing rows are
-- data-migrated (in_progress -> process, resolved -> done) so nothing sits
-- in a now-invalid status.

ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS assigned_admin  text,
  ADD COLUMN IF NOT EXISTS admin_note      text,
  ADD COLUMN IF NOT EXISTS attachment_type text;

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_attachment_type_check;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_attachment_type_check
  CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'video'));

UPDATE public.contact_messages SET status = 'process' WHERE status = 'in_progress';
UPDATE public.contact_messages SET status = 'done'    WHERE status = 'resolved';

ALTER TABLE public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_status_check;
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_messages_status_check
  CHECK (status IN ('new', 'seen', 'process', 'done'));

DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.contact_messages;
  RAISE NOTICE 'contact_messages triage ready (% row(s)): assigned_admin/admin_note/attachment_type added, status now new/seen/process/done', v_count;
END $$;
