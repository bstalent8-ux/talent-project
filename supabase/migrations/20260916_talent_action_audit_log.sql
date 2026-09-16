-- ─── Talent Actions CRM: change history ─────────────────────────────────────
-- Every edit or delete on a talent_actions row (the CRM follow-up log at
-- /admin/talents/[id]) is now recorded here — same "who changed what, when"
-- posture as admin_role_audit_log for the /admin/roles tab. A deleted action
-- keeps its full snapshot in old_value even after the parent row is gone
-- (ON DELETE SET NULL on talent_action_id, not CASCADE), so an admin can
-- still see exactly what was removed and by whom.
--
-- Per CLAUDE.md §6, this file is pasted into the Supabase SQL editor by a
-- human — it is not auto-applied.

CREATE TABLE IF NOT EXISTS public.talent_action_audit_log (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_action_id  uuid        REFERENCES public.talent_actions(id) ON DELETE SET NULL,
  talent_id         uuid        NOT NULL REFERENCES public.talent_profiles(id) ON DELETE CASCADE,
  changed_by        uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action            text        NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  old_value         jsonb,
  new_value         jsonb,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_talent_action_audit_log_talent_id ON public.talent_action_audit_log(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_action_audit_log_action_id ON public.talent_action_audit_log(talent_action_id);

ALTER TABLE public.talent_action_audit_log ENABLE ROW LEVEL SECURITY;
-- No policies — service-role only, same pattern as talent_actions itself
-- and admin_role_audit_log.

DO $$
BEGIN
  RAISE NOTICE 'talent_action_audit_log created.';
END $$;
