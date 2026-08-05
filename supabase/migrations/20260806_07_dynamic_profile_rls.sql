-- ============================================================
-- 20260806_07_dynamic_profile_rls.sql
-- Profile Architecture V2 — Phase 1, step 7 of 7: RLS.
--
-- ⚠ READ THIS BEFORE RELYING ON ANY POLICY BELOW ⚠
--
-- This codebase reads and writes almost everything through the service_role
-- key (lib/supabase/admin.ts), which BYPASSES RLS entirely. These policies are
-- therefore a defence-in-depth backstop against direct anon/authenticated
-- access — NOT the primary authorization mechanism.
--
-- The primary mechanism is, and remains, the hand-written ownership check in
-- each route handler. Any Phase 2+ route that touches profile_values without an
-- explicit `profile_id === user.id` check is a data-leak bug, regardless of
-- what is written here.
--
-- Idempotent.
-- Depends on: 20260806_03, 20260806_04
-- ============================================================

ALTER TABLE public.profile_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_fields   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_values   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_layouts  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- CONFIG TABLES — public read of enabled rows, no write policy at all.
-- No write policy means anon and authenticated cannot INSERT/UPDATE/DELETE.
-- Admin edits go through service_role, which is unaffected by RLS.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "profile_sections public read" ON public.profile_sections;
CREATE POLICY "profile_sections public read" ON public.profile_sections
  FOR SELECT
  USING (
    is_enabled = true
    -- 'owner' and 'admin' sections are not part of the public schema surface.
    AND visibility IN ('public', 'authenticated')
  );

DROP POLICY IF EXISTS "profile_sections owner read" ON public.profile_sections;
CREATE POLICY "profile_sections owner read" ON public.profile_sections
  FOR SELECT
  USING (
    -- A signed-in user can see the definitions of every enabled section that
    -- belongs to their own profile type, including 'owner'-visibility ones,
    -- so the edit form can render them.
    is_enabled = true
    AND auth.uid() IS NOT NULL
    AND profile_type_id = (
      SELECT p.profile_type_id FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "profile_fields public read" ON public.profile_fields;
CREATE POLICY "profile_fields public read" ON public.profile_fields
  FOR SELECT
  USING (
    is_enabled = true
    AND EXISTS (
      SELECT 1 FROM public.profile_sections s
       WHERE s.id = profile_fields.section_id
         AND s.is_enabled = true
    )
  );
-- Note: the EXISTS subquery is itself subject to the SELECT policies above, so
-- a field inside an 'owner'-visibility section is only readable by that owner.

DROP POLICY IF EXISTS "profile_layouts public read" ON public.profile_layouts;
CREATE POLICY "profile_layouts public read" ON public.profile_layouts
  FOR SELECT USING (is_active = true);

-- ─────────────────────────────────────────────────────────────────────────────
-- profile_values — THE ONLY V2 TABLE HOLDING USER DATA.
--
-- profiles.id is 1:1 with auth.users.id, so `profile_id = auth.uid()` is the
-- ownership test. This matches the existing `profiles` policies in
-- fix_profiles_rls.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- READ: a value is publicly visible only when its section says so.
DROP POLICY IF EXISTS "profile_values public read" ON public.profile_values;
CREATE POLICY "profile_values public read" ON public.profile_values
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.profile_fields   f
        JOIN public.profile_sections s ON s.id = f.section_id
       WHERE f.id = profile_values.field_id
         AND f.is_enabled = true
         AND s.is_enabled = true
         AND (
              s.visibility = 'public'
           OR (s.visibility = 'authenticated' AND auth.uid() IS NOT NULL)
         )
    )
  );

-- READ: the owner always sees everything on their own profile, including
-- 'owner' and 'admin' visibility sections and disabled ones.
DROP POLICY IF EXISTS "profile_values owner read" ON public.profile_values;
CREATE POLICY "profile_values owner read" ON public.profile_values
  FOR SELECT
  USING (profile_id = auth.uid());

-- WRITE: owner only, on their own profile, and only for a field that belongs
-- to their own profile type. The second condition stops a talent from writing
-- values against brand-only or agency-only field definitions.
DROP POLICY IF EXISTS "profile_values owner insert" ON public.profile_values;
CREATE POLICY "profile_values owner insert" ON public.profile_values
  FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
        FROM public.profile_fields   f
        JOIN public.profile_sections s ON s.id = f.section_id
        JOIN public.profiles         p ON p.id = auth.uid()
       WHERE f.id = profile_values.field_id
         AND f.is_enabled = true
         AND s.is_enabled = true
         AND s.profile_type_id = p.profile_type_id
    )
  );

DROP POLICY IF EXISTS "profile_values owner update" ON public.profile_values;
CREATE POLICY "profile_values owner update" ON public.profile_values
  FOR UPDATE
  USING      (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1
        FROM public.profile_fields   f
        JOIN public.profile_sections s ON s.id = f.section_id
        JOIN public.profiles         p ON p.id = auth.uid()
       WHERE f.id = profile_values.field_id
         AND f.is_enabled = true
         AND s.is_enabled = true
         AND s.profile_type_id = p.profile_type_id
    )
  );

DROP POLICY IF EXISTS "profile_values owner delete" ON public.profile_values;
CREATE POLICY "profile_values owner delete" ON public.profile_values
  FOR DELETE
  USING (profile_id = auth.uid());

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- RLS filters rows; grants decide whether the role may touch the table at all.
-- Both are required.
GRANT SELECT ON public.profile_types    TO anon, authenticated;
GRANT SELECT ON public.profile_sections TO anon, authenticated;
GRANT SELECT ON public.profile_fields   TO anon, authenticated;
GRANT SELECT ON public.profile_layouts  TO anon, authenticated;
GRANT SELECT ON public.profile_values   TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profile_values TO authenticated;

-- Config tables are never writable by end users, only by service_role.
REVOKE INSERT, UPDATE, DELETE ON public.profile_types    FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.profile_sections FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.profile_fields   FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.profile_layouts  FROM anon, authenticated;

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('profile_types','profile_sections','profile_fields','profile_values','profile_layouts');

  RAISE NOTICE 'OK 20260806_07: % RLS policies on V2 tables', n;

  IF n < 9 THEN
    RAISE EXCEPTION 'expected at least 9 policies, found %', n;
  END IF;
END $$;
