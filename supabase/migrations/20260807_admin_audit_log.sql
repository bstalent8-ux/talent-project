-- ============================================================
-- 20260807_admin_audit_log.sql
-- Admin audit trail for profile-config mutations.
--
-- SUPPLIED SEPARATELY AND NOT REQUIRED TO SHIP THE ADMIN UI.
-- Until this is applied, features/profiles/services/audit.service.ts detects
-- the missing table (PostgREST 42P01), logs one warning, and falls back to
-- console entries. An audit write must never break the mutation it records.
--
-- ADDITIVE ONLY. Idempotent. Paste into the Supabase SQL editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Acting admin. ON DELETE SET NULL: removing an admin account must never
  -- erase the history of what they did.
  admin_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  action       text NOT NULL CHECK (action IN (
                 'create', 'update', 'delete', 'enable', 'disable', 'reorder'
               )),

  entity_type  text NOT NULL CHECK (entity_type IN (
                 'profile_type', 'profile_section', 'profile_field', 'profile_layout'
               )),

  -- Not a foreign key: the row it points at may since have been deleted, and
  -- the audit entry must survive that.
  entity_id    uuid NOT NULL,

  -- Full row state either side of the mutation. NULL on create / delete
  -- respectively. Passed through a redaction pass in the service first.
  before_value jsonb,
  after_value  jsonb,

  metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_audit_log IS
  'Append-only audit trail for admin profile-config mutations. Never updated, never deleted by application code.';
COMMENT ON COLUMN public.admin_audit_log.entity_id IS
  'Deliberately not a foreign key — the audited row may have been deleted, and the entry must outlive it.';

-- "What happened to this entity?"
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity
  ON public.admin_audit_log(entity_type, entity_id, created_at DESC);

-- "What did this admin do?"
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin
  ON public.admin_audit_log(admin_id, created_at DESC);

-- "What happened recently?"
CREATE INDEX IF NOT EXISTS idx_admin_audit_created
  ON public.admin_audit_log(created_at DESC);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Writes go through the service role. Admins may read; nobody may UPDATE or
-- DELETE through the API — an audit log that can be edited is not an audit log.
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit admin read" ON public.admin_audit_log;
CREATE POLICY "audit admin read" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = auth.uid() AND p.role::text = 'admin'
    )
  );

-- No INSERT / UPDATE / DELETE policies: only the service role can write.
REVOKE INSERT, UPDATE, DELETE ON public.admin_audit_log FROM anon, authenticated;
GRANT SELECT ON public.admin_audit_log TO authenticated;

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.admin_audit_log') IS NULL THEN
    RAISE EXCEPTION '20260807 failed: admin_audit_log missing';
  END IF;
  RAISE NOTICE 'OK 20260807: admin_audit_log ready';
END $$;

-- ─── Rollback ────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.admin_audit_log;
-- The service degrades to console logging automatically; no code change needed.
