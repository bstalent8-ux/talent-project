-- ─── Leads CRM: per-task assignee ───────────────────────────────────────────
-- `leads.assigned_to` (already existed) is who OWNS the lead overall.
-- `lead_actions.assigned_to` is new: who a specific logged task/follow-up is
-- assigned to — may differ from the lead's owner (e.g. the owner hands one
-- follow-up call off to a teammate without transferring the whole lead).
-- Reassigning the lead itself is still logged as a `lead_actions` row too
-- (action_type = 'lead_assigned', app-level constant, no DB CHECK — see
-- STAGE_CHANGE_ACTION_TYPE's precedent in 20260907_leads_dynamic_stages.sql).
-- Per CLAUDE.md §6, pasted into the Supabase SQL editor by a human.

ALTER TABLE public.lead_actions
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lead_actions_assigned_to ON public.lead_actions(assigned_to);

DO $$
BEGIN
  RAISE NOTICE 'lead_actions.assigned_to added.';
END $$;
