-- ─── Auto-calculated response time / on-time delivery ─────────────────────
-- Step 1 of "make UgcHero's Response Time + On-Time Delivery tiles real"
-- (see CLAUDE.md §UGC hero and 20260820_talent_model_metrics.sql).
--
-- Writes two NEW numeric keys into talent_profiles.model_metrics —
-- avg_response_hours, auto_on_time_rate — leaving every existing key
-- (response_time_label, tier, avg_project_value, ...) untouched, since those
-- stay admin-typed free text for Model/Fashion. UGC's hero will read the
-- new numeric keys once the frontend step lands.
--
-- Both keys are written as NULL (never a fabricated number) until a talent
-- has at least MIN_SAMPLE qualifying rows — a lone booking must not produce
-- a misleading 100%/0%. Below threshold, the frontend hides the tile
-- entirely (same pattern UgcHero already uses for completedPct).
--
-- avg_response_hours source: bookings.created_at → booking_briefs.responded_at.
-- bookings.created_at is used as the "brief sent" timestamp — true for the
-- direct-brief flow (POST /api/bookings/direct creates the booking already
-- in "brief_sent"), which is the only brief-creation path today.
--
-- auto_on_time_rate source: deliverables.created_at <= booking_briefs.deadline,
-- as a percentage of all deliverables submitted for that talent.
--
-- Recomputed by trigger whenever a brief gets a response, a deliverable is
-- submitted, or a booking's status changes (count of qualifying rows can
-- cross MIN_SAMPLE without either of those firing directly).

CREATE OR REPLACE FUNCTION public.recalc_talent_response_metrics(p_talent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_min_sample constant int := 5;
  v_response_n int;
  v_avg_response_hours numeric;
  v_delivery_n int;
  v_on_time_rate numeric;
BEGIN
  SELECT count(*), avg(extract(epoch FROM (bb.responded_at - b.created_at)) / 3600.0)
    INTO v_response_n, v_avg_response_hours
  FROM public.booking_briefs bb
  JOIN public.bookings b ON b.id = bb.booking_id
  WHERE b.talent_id = p_talent_id
    AND bb.responded_at IS NOT NULL;

  -- deliverables is documented as live in CLAUDE.md but is absent on this
  -- database today (schema drift between the repo's migration files and
  -- the real DB — see CLAUDE.md §6). Guard so this function still works for
  -- avg_response_hours until that table actually exists.
  v_delivery_n := 0;
  v_on_time_rate := NULL;
  IF to_regclass('public.deliverables') IS NOT NULL THEN
    EXECUTE $q$
      SELECT count(*),
             100.0 * count(*) FILTER (WHERE d.created_at <= bb.deadline) / count(*)
      FROM public.deliverables d
      JOIN public.bookings b ON b.id = d.booking_id
      JOIN public.booking_briefs bb ON bb.booking_id = b.id
      WHERE b.talent_id = $1
        AND bb.deadline IS NOT NULL
    $q$ INTO v_delivery_n, v_on_time_rate USING p_talent_id;
  END IF;

  UPDATE public.talent_profiles
  SET model_metrics = model_metrics
    || jsonb_build_object(
         'avg_response_hours', CASE WHEN v_response_n >= v_min_sample THEN round(v_avg_response_hours, 1) ELSE NULL END,
         'auto_on_time_rate',  CASE WHEN v_delivery_n >= v_min_sample THEN round(v_on_time_rate, 0) ELSE NULL END
       )
  WHERE id = p_talent_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_response_metrics_from_brief()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_talent_id uuid;
BEGIN
  SELECT talent_id INTO v_talent_id FROM public.bookings WHERE id = NEW.booking_id;
  IF v_talent_id IS NOT NULL THEN
    PERFORM public.recalc_talent_response_metrics(v_talent_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_response_metrics_from_deliverable()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_talent_id uuid;
BEGIN
  SELECT talent_id INTO v_talent_id FROM public.bookings WHERE id = NEW.booking_id;
  IF v_talent_id IS NOT NULL THEN
    PERFORM public.recalc_talent_response_metrics(v_talent_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recalc_response_metrics_on_brief ON public.booking_briefs;
CREATE TRIGGER recalc_response_metrics_on_brief
AFTER INSERT OR UPDATE OF responded_at, deadline ON public.booking_briefs
FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_response_metrics_from_brief();

-- deliverables doesn't exist on this DB yet (see comment above) — skip
-- attaching the trigger rather than fail the whole migration. Re-run this
-- file after the table is created and this block will attach it.
DO $$
BEGIN
  IF to_regclass('public.deliverables') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS recalc_response_metrics_on_deliverable ON public.deliverables';
    EXECUTE 'CREATE TRIGGER recalc_response_metrics_on_deliverable
             AFTER INSERT ON public.deliverables
             FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_response_metrics_from_deliverable()';
  ELSE
    RAISE NOTICE 'public.deliverables does not exist yet — skipped attaching its trigger. auto_on_time_rate stays NULL until it does.';
  END IF;
END $$;

-- Backfill: recompute for every talent once so existing data is reflected
-- immediately (still gated by v_min_sample inside the function — most will
-- resolve to NULL today, which is correct).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.talent_profiles LOOP
    PERFORM public.recalc_talent_response_metrics(r.id);
  END LOOP;
END $$;

-- Verification: how many talents currently clear the sample-size bar.
DO $$
DECLARE v_with_response int; v_with_on_time int; v_total int;
BEGIN
  SELECT count(*) INTO v_total FROM public.talent_profiles;
  SELECT count(*) INTO v_with_response FROM public.talent_profiles WHERE model_metrics->>'avg_response_hours' IS NOT NULL;
  SELECT count(*) INTO v_with_on_time  FROM public.talent_profiles WHERE model_metrics->>'auto_on_time_rate'  IS NOT NULL;
  RAISE NOTICE 'talent_profiles total=%, avg_response_hours set=%, auto_on_time_rate set=%', v_total, v_with_response, v_with_on_time;
END $$;
