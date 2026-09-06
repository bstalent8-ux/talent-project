-- ─── Leads CRM ──────────────────────────────────────────────────────────────
-- A lightweight CRM for people who asked about the platform but never signed
-- up (DMs, WhatsApp, comments...). Deliberately loose: whoever logs a lead
-- rarely has more than one identifier (phone OR handle OR email, almost
-- never all three), so every identity column is nullable and anything else
-- collected lands in `extra` rather than being rejected. Per CLAUDE.md §6,
-- this file is pasted into the Supabase SQL editor by a human — it is not
-- auto-applied.

CREATE TABLE IF NOT EXISTS public.leads (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             text,
  phone                 text,
  email                 text,
  social_handle         text,
  extra                 jsonb       NOT NULL DEFAULT '{}'::jsonb,
  status                text        NOT NULL DEFAULT 'new'
                          CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'converted')),
  source                text        NOT NULL DEFAULT 'manual'
                          CHECK (source IN ('manual', 'excel', 'sheet')),
  assigned_to           uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by            uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Set only when a new lead matched an existing one by phone but NOT by
  -- email — a same-number match is a hint, not proof, so it's surfaced for
  -- manual review instead of auto-merged (an email match merges outright,
  -- see the app-layer dedupe in features/leads/services/leads.service.ts).
  possible_duplicate_of uuid        REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_email       ON public.leads(email)       WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone       ON public.leads(phone)       WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_handle      ON public.leads(social_handle) WHERE social_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status      ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON public.leads(created_at DESC);

CREATE TABLE IF NOT EXISTS public.lead_actions (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type   text        NOT NULL,
  note          text,
  performed_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Defaults to created_at + 2 days at the app layer (not a DB default. so a
  -- caller can pass an explicit date without a race against `now()`).
  -- Editable afterwards by whoever logged it or any other admin.
  follow_up_at  timestamptz,
  -- Stamped once the follow-up reminder notification has actually been
  -- sent, so the daily check never double-notifies the same action.
  notified_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_actions_lead_id     ON public.lead_actions(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_actions_follow_up   ON public.lead_actions(follow_up_at) WHERE notified_at IS NULL;

-- Same "service-role only" pattern as notifications / user_events / leads'
-- sibling tables — RLS enabled, no policies, every read/write goes through
-- adminClient with an app-layer requireAdmin() check.
ALTER TABLE public.leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_actions ENABLE ROW LEVEL SECURITY;

-- Keep updated_at honest without every call site remembering to set it.
CREATE OR REPLACE FUNCTION public.touch_lead_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_leads_touch_updated_at ON public.leads;
CREATE TRIGGER trg_leads_touch_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_lead_updated_at();

-- ─── New notification type ──────────────────────────────────────────────────
-- notifications.type -> FK on notification_types(code) since 20260730's v2
-- migration (see 20260824_new_notification_types.sql for the same pattern).
INSERT INTO public.notification_types (code, category, default_priority) VALUES
  ('LEAD_FOLLOW_UP_DUE', 'leads', 'normal')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.notification_types WHERE code = 'LEAD_FOLLOW_UP_DUE';
  RAISE NOTICE 'LEAD_FOLLOW_UP_DUE notification type registered: %', (v_count = 1);
END $$;
