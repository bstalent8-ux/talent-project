-- ─── Talent Actions CRM ──────────────────────────────────────────────────────
-- Same shape and intent as the leads CRM (supabase/migrations/
-- 20260906_leads_crm.sql's lead_actions table) but for talents an admin has
-- already onboarded (any category — UGC and model both use talent_profiles):
-- log a call/message/note against them, who did it and when, and an
-- optional follow-up date that fires an in-app reminder notification once
-- it's due. Per CLAUDE.md §6, pasted into the Supabase SQL editor by a
-- human — not auto-applied.

CREATE TABLE IF NOT EXISTS public.talent_actions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id      uuid        NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  action_type    text        NOT NULL,
  note           text,
  performed_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- No DB default (unlike lead_actions, where the app applies a +2 day
  -- default) — a talent follow-up is opt-in per action, not assumed.
  follow_up_at   timestamptz,
  -- Stamped once the follow-up reminder notification has actually been
  -- sent, so the daily check never double-notifies the same action.
  notified_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_actions_talent_id ON public.talent_actions(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_actions_follow_up ON public.talent_actions(follow_up_at) WHERE notified_at IS NULL;

-- Same "service-role only" pattern as lead_actions / notifications /
-- user_events — RLS enabled, no policies, every read/write goes through
-- adminClient with an app-layer requireAdmin() check.
ALTER TABLE public.talent_actions ENABLE ROW LEVEL SECURITY;

-- ─── New notification type ──────────────────────────────────────────────────
-- notifications.type -> FK on notification_types(code), same pattern as
-- LEAD_FOLLOW_UP_DUE.
INSERT INTO public.notification_types (code, category, default_priority) VALUES
  ('TALENT_FOLLOW_UP_DUE', 'talents', 'normal')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.notification_types WHERE code = 'TALENT_FOLLOW_UP_DUE';
  RAISE NOTICE 'TALENT_FOLLOW_UP_DUE notification type registered: %', (v_count = 1);
END $$;
