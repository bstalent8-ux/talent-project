-- ─── email_log ────────────────────────────────────────────────────────────────
-- Every email this app sends through Resend (lib/email/send.ts) gets one row
-- here — approval congrats, admin-composed one-offs, future templates. Backs
-- /admin/emails' history table and its "Resend" button (which just re-POSTs
-- the stored subject/body_html to the same recipient).
--
-- Same posture as notifications/user_events: RLS enabled, no policies —
-- service-role only, never written from the browser directly.
CREATE TABLE IF NOT EXISTS public.email_log (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email text        NOT NULL,
  recipient_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject         text        NOT NULL,
  body_html       text        NOT NULL,
  template        text        NOT NULL DEFAULT 'custom',
  status          text        NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error           text,
  resend_id       text,
  sent_by         uuid        REFERENCES public.profiles(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_created_at  ON public.email_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_log_recipient_id ON public.email_log(recipient_id);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
