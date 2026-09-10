-- ══════════════════════════════════════════════════════════════════════════
-- P0 — unblock the payments / escrow flow                        2026-09-10
-- ══════════════════════════════════════════════════════════════════════════
-- Two production-blocking bugs, both found by probing the live DB:
--
--   1. A trigger on public.payments fires on every real status change and
--      throws  ERROR 42703: column "user_id" of relation "notifications"
--      does not exist  — so payments.status can never move off "pending".
--      pending -> held / released / refunded / disputed all fail. Confirmed
--      by direct write: an update that does NOT change status succeeds, any
--      update that does change it throws. The notifications table has
--      recipient_id, never user_id.
--
--   2. public.increment_balance(user_id, amount) — called by the
--      deliverables-approve branch to credit a talent's profiles.balance —
--      does not exist. (The migration file 20260909_increment_balance.sql
--      was written but never pasted in.) Every approved booking has left
--      the talent's balance uncredited.
--
-- This migration is idempotent and self-diagnosing — run it in the Supabase
-- SQL editor and READ THE NOTICES it prints before/after.
-- ══════════════════════════════════════════════════════════════════════════


-- ─── 1a. Show every trigger currently on public.payments ──────────────────
-- (informational — so you can see exactly what was there and what got
--  removed. Copy this output back if anything looks load-bearing.)
DO $$
DECLARE
  t   record;
  src text;
BEGIN
  RAISE NOTICE '=== triggers on public.payments (before) ===';
  FOR t IN
    SELECT tg.tgname,
           p.proname   AS func,
           n.nspname   AS func_schema
    FROM pg_trigger tg
    JOIN pg_class   c ON c.oid = tg.tgrelid
    JOIN pg_proc    p ON p.oid = tg.tgfoid
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE c.relname = 'payments'
      AND c.relnamespace = 'public'::regnamespace
      AND NOT tg.tgisinternal
  LOOP
    RAISE NOTICE 'trigger %  ->  %.%()', t.tgname, t.func_schema, t.func;
    BEGIN
      src := pg_get_functiondef(format('%I.%I', t.func_schema, t.func)::regprocedure);
      RAISE NOTICE '--- % source ---%', t.func, E'\n' || src;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '(could not read source of %.%: %)', t.func_schema, t.func, SQLERRM;
    END;
  END LOOP;
END $$;


-- ─── 1b. Drop any payments trigger whose function writes to notifications ──
-- The app already sends both payment notifications itself:
--   * POST /api/admin/bookings/[id]/payment/confirm  -> brand + talent
--   * PATCH /api/bookings/[id]/deliverables (approve) -> release
-- so a DB-side notification trigger is redundant, and this one is broken in
-- a way that blocks the whole escrow lifecycle. We drop the TRIGGER only
-- (not the function — another table may share it). booking_history is a
-- separate audit table and is untouched.
DO $$
DECLARE
  t          record;
  src        text;
  dropped_n  int := 0;
BEGIN
  FOR t IN
    SELECT tg.tgname,
           p.oid::regprocedure AS func_ref,
           p.proname           AS func
    FROM pg_trigger tg
    JOIN pg_class   c ON c.oid = tg.tgrelid
    JOIN pg_proc    p ON p.oid = tg.tgfoid
    WHERE c.relname = 'payments'
      AND c.relnamespace = 'public'::regnamespace
      AND NOT tg.tgisinternal
  LOOP
    BEGIN
      src := pg_get_functiondef(t.func_ref);
    EXCEPTION WHEN OTHERS THEN
      src := '';
    END;

    IF src ILIKE '%notification%' THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.payments', t.tgname);
      RAISE NOTICE 'DROPPED broken notification trigger: % (was calling %)', t.tgname, t.func;
      dropped_n := dropped_n + 1;

      -- if that function is now orphaned (no remaining triggers anywhere) and
      -- it is clearly payment-scoped, drop it too so it can't be re-attached.
      IF (SELECT count(*) FROM pg_trigger WHERE tgfoid = (t.func_ref::oid)) = 0
         AND t.func ILIKE '%payment%' THEN
        EXECUTE format('DROP FUNCTION IF EXISTS %s', t.func_ref);
        RAISE NOTICE 'DROPPED now-orphaned function: %', t.func;
      END IF;
    END IF;
  END LOOP;

  IF dropped_n = 0 THEN
    RAISE NOTICE 'No notification-writing trigger found on payments (already fixed, or the block is elsewhere — check the source dump above).';
  END IF;
END $$;


-- ─── 1c. Confirm payments is now writable ─────────────────────────────────
DO $$
DECLARE
  test_id uuid;
  cur     text;
BEGIN
  SELECT id, status INTO test_id, cur FROM public.payments LIMIT 1;
  IF test_id IS NULL THEN
    RAISE NOTICE 'payments has no rows to verify against — skipping write test.';
    RETURN;
  END IF;

  BEGIN
    UPDATE public.payments SET status = 'held', held_at = now() WHERE id = test_id;
    UPDATE public.payments SET status = cur, held_at = NULL     WHERE id = test_id;  -- restore
    RAISE NOTICE 'VERIFIED: payments.status is now writable (test row % round-tripped through held).', test_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'payments.status STILL blocked: %  — read the trigger source dump above and fix the remaining trigger by hand.', SQLERRM;
  END;
END $$;


-- ─── 2. increment_balance — create it (was never applied) ─────────────────
-- Same lockdown as track_talent_profile_view()/touch_last_active(): SECURITY
-- DEFINER, pinned search_path, EXECUTE revoked from PUBLIC/anon/authenticated
-- and granted only to service_role. Touches money — never a public RPC.
CREATE OR REPLACE FUNCTION public.increment_balance(user_id uuid, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET balance = COALESCE(balance, 0) + amount
   WHERE id = user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_balance(uuid, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_balance(uuid, numeric) TO service_role;

DO $$
BEGIN
  PERFORM public.increment_balance('00000000-0000-0000-0000-000000000000'::uuid, 0);
  RAISE NOTICE 'VERIFIED: increment_balance(uuid, numeric) exists and is callable.';
END $$;


-- ─── 3. proof_url — belt & braces (already live, harmless re-run) ─────────
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS proof_url text;


-- ─── 4. show the triggers that remain ────────────────────────────────────
DO $$
DECLARE t record;
BEGIN
  RAISE NOTICE '=== triggers on public.payments (after) ===';
  FOR t IN
    SELECT tg.tgname, p.proname AS func
    FROM pg_trigger tg
    JOIN pg_class c ON c.oid = tg.tgrelid
    JOIN pg_proc  p ON p.oid = tg.tgfoid
    WHERE c.relname = 'payments' AND c.relnamespace = 'public'::regnamespace
      AND NOT tg.tgisinternal
  LOOP
    RAISE NOTICE 'kept: %  ->  %()', t.tgname, t.func;
  END LOOP;
END $$;
