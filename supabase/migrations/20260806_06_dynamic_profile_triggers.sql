-- ============================================================
-- 20260806_06_dynamic_profile_triggers.sql
-- Profile Architecture V2 — Phase 1, step 6 of 7: sync triggers.
--
-- Two triggers keep the new columns correct WITHOUT any application change.
-- This is deliberate: three separate code paths create profiles rows
-- (POST /api/profile, the GET /api/me self-heal, POST /api/sync-profile) and
-- two create bookings rows, and none of them know these columns exist.
-- Doing the sync in the database means zero orphans and zero app edits.
--
-- Both triggers are strictly ADDITIVE in effect: they only ever populate NULL
-- columns that no existing query reads. They never overwrite a value an
-- application write supplied, and they never touch role, talent_id, or any
-- other pre-existing column.
--
-- Idempotent.
-- Depends on: 20260806_02, 20260806_05
-- ============================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 1 — profiles.profile_type_id derived from profiles.role
-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER + pinned search_path: the function reads profile_types, and
-- must behave identically no matter which role performs the INSERT (anon
-- signup, authenticated edit, or service role).
CREATE OR REPLACE FUNCTION public.sync_profile_type_from_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_slug text;
BEGIN
  -- Never override an explicit value. Once Phase 2 code sets profile_type_id
  -- directly, this trigger becomes a no-op and can be dropped.
  IF NEW.profile_type_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  target_slug := CASE
    WHEN NEW.role::text = 'talent'              THEN 'talent'
    WHEN NEW.role::text IN ('brand', 'client')  THEN 'brand'
    ELSE NULL                                   -- admin: no public profile
  END;

  IF target_slug IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve without regard to is_active: a type can be switched off for new
  -- signups while existing rows still need a valid pointer.
  SELECT t.id INTO NEW.profile_type_id
    FROM public.profile_types t
   WHERE t.slug = target_slug;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_profile_type_from_role() IS
  'Profile Architecture V2 Phase 1. Populates profiles.profile_type_id from role for legacy writers. Drop in Phase 4 once all writers set the column explicitly.';

DROP TRIGGER IF EXISTS trg_sync_profile_type ON public.profiles;
CREATE TRIGGER trg_sync_profile_type
  BEFORE INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_type_from_role();

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER 2 — bookings provider shadow columns derived from talent_id
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_booking_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- ── Forward direction: the only one active in Phase 1. ────────────────────
  -- A legacy write supplies talent_id and nothing else. Derive the shadow.
  IF NEW.talent_id IS NOT NULL AND NEW.provider_profile_id IS NULL THEN
    NEW.provider_type       := 'talent';
    NEW.provider_profile_id := NEW.talent_id;
    NEW.provider_user_id    := COALESCE(
      NEW.talent_user_id,
      (SELECT tp.user_id FROM public.talent_profiles tp WHERE tp.id = NEW.talent_id)
    );

  -- ── Reverse direction: INERT until Phase 5. ───────────────────────────────
  -- Unreachable today because no application code writes provider_* columns.
  -- Present so that when Phase 2 flips booking creation over to the adapter,
  -- the legacy talent_id column keeps being populated automatically and every
  -- existing query, RLS policy, and admin report continues to return the same
  -- rows. Guarded on provider_type = 'talent' so a future agency booking is
  -- never given a bogus talent_id.
  ELSIF NEW.provider_type = 'talent'
    AND NEW.provider_profile_id IS NOT NULL
    AND NEW.talent_id IS NULL THEN
    NEW.talent_id      := NEW.provider_profile_id;
    NEW.talent_user_id := COALESCE(NEW.talent_user_id, NEW.provider_user_id);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_booking_provider() IS
  'Profile Architecture V2 Phase 1. Bidirectional mirror between bookings.talent_id and the provider_* shadow columns. The reverse branch is inert until Phase 5. Invariant asserted by view booking_provider_drift.';

DROP TRIGGER IF EXISTS trg_sync_booking_provider ON public.bookings;
CREATE TRIGGER trg_sync_booking_provider
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_booking_provider();

-- ─── Re-run the backfills ────────────────────────────────────────────────────
-- Closes the window between running steps 02/05 and this file, during which
-- new rows could have been created without the triggers in place.
UPDATE public.profiles p
   SET profile_type_id = t.id
  FROM public.profile_types t
 WHERE p.profile_type_id IS NULL
   AND ((t.slug = 'talent' AND p.role::text = 'talent')
     OR (t.slug = 'brand'  AND p.role::text IN ('brand', 'client')));

UPDATE public.bookings b
   SET provider_type       = 'talent',
       provider_profile_id = b.talent_id,
       provider_user_id    = COALESCE(
         b.talent_user_id,
         (SELECT tp.user_id FROM public.talent_profiles tp WHERE tp.id = b.talent_id)
       )
 WHERE b.provider_type IS NULL
   AND b.talent_id IS NOT NULL;

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE drift integer; unmapped integer;
BEGIN
  SELECT count(*) INTO drift FROM public.booking_provider_drift;
  SELECT count(*) INTO unmapped
    FROM public.profiles WHERE profile_type_id IS NULL AND role::text <> 'admin';

  RAISE NOTICE 'OK 20260806_06: triggers installed. drift=%, unmapped profiles=%', drift, unmapped;

  IF drift > 0 THEN
    RAISE EXCEPTION 'booking_provider_drift returned % rows after installing triggers. Investigate before continuing.', drift;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-DEPLOY SMOKE TEST — run manually, in a transaction you ROLL BACK.
-- Proves an unmodified legacy write still produces correct shadow columns.
-- ─────────────────────────────────────────────────────────────────────────────
-- BEGIN;
--   INSERT INTO public.bookings (brand_id, talent_id, status)
--   SELECT (SELECT id FROM public.profiles WHERE role::text = 'brand' LIMIT 1),
--          (SELECT id FROM public.talent_profiles LIMIT 1),
--          'contacting'
--   RETURNING id, talent_id, provider_type, provider_profile_id, provider_user_id;
--   -- Expect: provider_type = 'talent' AND provider_profile_id = talent_id
--   SELECT count(*) AS must_be_zero FROM public.booking_provider_drift;
-- ROLLBACK;
