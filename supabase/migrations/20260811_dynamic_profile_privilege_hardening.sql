-- ============================================================
-- 20260811_dynamic_profile_privilege_hardening.sql
-- Interim privilege correction between migrations 04 and 07.
--
-- WHY: this project's Supabase default privileges grant ALL (SELECT, INSERT,
-- UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) to anon/authenticated/
-- service_role automatically on every new public-schema table. Confirmed live
-- via information_schema.role_table_grants (user-run check) and an anon-key
-- REST probe (SELECT succeeded against profile_values pre-RLS). None of this
-- came from 01/03/04's explicit GRANT statements, which only ever asked for
-- SELECT.
--
-- 20260806_07_dynamic_profile_rls.sql already plans to revoke INSERT/UPDATE/
-- DELETE from anon/authenticated on the 4 config tables, bundled with RLS
-- enablement at step 7 of 7. That leaves an open window from table-creation
-- until 07 runs. This migration closes that window now, without enabling RLS
-- early and without touching 07 — pure privilege correction, reversible,
-- superseded (not duplicated) once 07 lands.
--
-- profile_values is the only table holding real user data, so it is revoked
-- down to service_role-only — zero anon/authenticated access, not even
-- SELECT, until 07's visibility-gated RLS policies exist to make that safe.
-- The 4 config tables keep SELECT for anon/authenticated (matches their own
-- intended final policy: public read of enabled/active rows) but lose every
-- write privilege.
--
-- TRUNCATE/REFERENCES/TRIGGER are not reachable through PostgREST's REST API
-- (no TRUNCATE verb; REFERENCES/TRIGGER need schema CREATE, which anon/
-- authenticated don't have) but are revoked anyway — no reason for a JWT-only
-- role to hold a dormant DDL-adjacent privilege on a live-data table.
--
-- service_role is untouched throughout: full access is correct and required
-- — it bypasses RLS by design and is how adminClient reads/writes today.
--
-- Idempotent. Safe to re-run.
-- ============================================================

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profile_types, public.profile_sections, public.profile_fields, public.profile_layouts
  FROM anon, authenticated;

REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profile_values
  FROM anon, authenticated;

-- Re-affirm the read grants these 4 tables are supposed to keep (idempotent;
-- harmless if already present from 01/03/04).
GRANT SELECT ON public.profile_types    TO anon, authenticated;
GRANT SELECT ON public.profile_sections TO anon, authenticated;
GRANT SELECT ON public.profile_fields   TO anon, authenticated;
GRANT SELECT ON public.profile_layouts  TO anon, authenticated;

-- ─── Verification: exact privilege matrix per role/table ─────────────────────
SELECT table_name, grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema = 'public'
   AND table_name IN ('profile_types','profile_sections','profile_fields','profile_layouts','profile_values')
   AND grantee IN ('anon','authenticated','service_role')
 ORDER BY table_name, grantee, privilege_type;

-- Expected after this runs:
--   profile_types/_sections/_fields/_layouts | anon, authenticated | SELECT only
--   profile_values                            | anon, authenticated | (no rows at all)
--   every table                               | service_role         | full, untouched

NOTIFY pgrst, 'reload schema';
