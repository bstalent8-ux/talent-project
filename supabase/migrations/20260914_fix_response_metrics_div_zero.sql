-- ─── Fix division-by-zero in recalc_talent_response_metrics — 2026-09-14 ────
-- trg_recalc_response_metrics_from_brief fires AFTER INSERT/UPDATE on
-- booking_briefs and calls recalc_talent_response_metrics(talent_id), which
-- computes an on-time-delivery percentage as:
--   100.0 * count(*) FILTER (WHERE d.created_at <= bb.deadline) / count(*)
-- The denominator count(*) is 0 for any talent with zero deliverables yet —
-- true of every talent's first-ever booking, confirmed live: any custom
-- brief (app/api/bookings/direct) throws "division by zero" (Postgres error
-- 22012) the moment its booking_briefs row is inserted, for a brand-new
-- talent. Found via direct reproduction against qa-test-ugc, then confirmed
-- by reading this function's real definition (pg_get_functiondef).
--
-- Fix: NULLIF(count(*), 0) — matches the same guard already used one query
-- above for v_avg_response_hours's implicit avg() empty-set handling; makes
-- the ratio NULL (not an error) when there is nothing to divide by. The
-- calling UPDATE already only trusts this value when v_delivery_n >=
-- v_min_sample, so a NULL here changes nothing else.
--
-- Idempotent — CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.recalc_talent_response_metrics(p_talent_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

  v_delivery_n := 0;
  v_on_time_rate := NULL;
  IF to_regclass('public.deliverables') IS NOT NULL THEN
    EXECUTE $q$
      SELECT count(*),
             100.0 * count(*) FILTER (WHERE d.created_at <= bb.deadline) / NULLIF(count(*), 0)
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
$function$;
