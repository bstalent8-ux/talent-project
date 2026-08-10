-- ============================================================
-- 20260806_02_profiles_profile_type_id.sql
-- Profile Architecture V2 — Phase 1, step 2 of 7: the seam.
--
-- Adds profiles.profile_type_id and backfills it from the existing `role`.
--
-- CRITICAL: `profiles.role` is NOT touched, NOT deprecated, NOT constrained.
-- Middleware, the admin layout, and every API role check keep reading `role`
-- exactly as before. profile_type_id is a parallel, nullable pointer that
-- nothing reads until Phase 2.
--
-- ADDITIVE ONLY. Idempotent.
-- Depends on: 20260806_01_profile_types.sql
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_type_id uuid
    REFERENCES public.profile_types(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.profiles.profile_type_id IS
  'Profile Architecture V2 seam. Nullable through Phases 1-3. Derived from `role` by trigger trg_sync_profile_type. `role` remains the authorization source of truth — do not read this column for auth checks.';

-- Partial index: admins are intentionally left NULL (no public profile surface),
-- and every lookup filters on a non-null type.
CREATE INDEX IF NOT EXISTS idx_profiles_profile_type
  ON public.profiles(profile_type_id)
  WHERE profile_type_id IS NOT NULL;

-- ─── Backfill from the existing role enum ────────────────────────────────────
-- 'client' is the pre-003 legacy spelling of 'brand'; it still exists in the
-- user_role enum and is mapped here so no row is missed.
UPDATE public.profiles p
   SET profile_type_id = t.id
  FROM public.profile_types t
 WHERE p.profile_type_id IS NULL
   AND t.slug = 'talent'
   AND p.role::text = 'talent';

UPDATE public.profiles p
   SET profile_type_id = t.id
  FROM public.profile_types t
 WHERE p.profile_type_id IS NULL
   AND t.slug = 'brand'
   AND p.role::text IN ('brand', 'client');

-- Admins are deliberately left NULL. They have no public profile, no sections,
-- and no completion score. Do not seed a synthetic 'admin' profile type.

-- ─── Verification ────────────────────────────────────────────────────────────
-- Reports how many non-admin profiles are still unmapped. Must be 0.
DO $$
DECLARE unmapped integer; mapped integer;
BEGIN
  SELECT count(*) INTO unmapped
    FROM public.profiles
   WHERE profile_type_id IS NULL
     AND role::text NOT IN ('admin');

  SELECT count(*) INTO mapped
    FROM public.profiles WHERE profile_type_id IS NOT NULL;

  RAISE NOTICE 'OK 20260806_02: % profiles mapped, % non-admin profiles unmapped', mapped, unmapped;

  IF unmapped > 0 THEN
    RAISE WARNING 'profile_type_id backfill incomplete: % non-admin rows still NULL. Inspect with: SELECT id, role FROM public.profiles WHERE profile_type_id IS NULL AND role::text <> ''admin'';', unmapped;
  END IF;
END $$;

-- ─── Verification: column exists (PostgreSQL ground truth) ──────────────────
SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public'
   AND table_name   = 'profiles'
   AND column_name  = 'profile_type_id';

-- ─── Verification: FK points exactly to profile_types(id) ───────────────────
SELECT
  tc.constraint_name,
  kcu.column_name        AS fk_column,
  ccu.table_name          AS references_table,
  ccu.column_name         AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name   = 'profiles'
  AND kcu.column_name = 'profile_type_id';

-- ─── Verification: backfill result by role / profile type ───────────────────
SELECT p.role, t.slug AS profile_type, count(*) AS n
  FROM public.profiles p
  LEFT JOIN public.profile_types t ON t.id = p.profile_type_id
 GROUP BY p.role, t.slug
 ORDER BY p.role, t.slug;

-- ─── Verification: no unexpected non-admin NULLs ─────────────────────────────
-- Expect 0 rows.
SELECT id, role
  FROM public.profiles
 WHERE profile_type_id IS NULL
   AND role::text <> 'admin';

-- ─── PostgREST cache ─────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- After the NOTIFY, the PostgREST-side check (run outside SQL Editor, via the
-- app's service-role REST path) is:
--   GET /profiles?select=id,handle,profile_types(slug)&limit=1
-- Expect 200 with a nested profile_types object, not PGRST200/PGRST205.
