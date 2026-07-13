-- Function: recalculate avg_rating + total_reviews for one talent
CREATE OR REPLACE FUNCTION sync_talent_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_talent_id uuid;
  v_avg       numeric;
  v_count     int;
BEGIN
  v_talent_id := COALESCE(NEW.talent_id, OLD.talent_id);

  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE talent_id = v_talent_id;

  UPDATE public.talent_profiles
  SET
    avg_rating    = v_avg,
    total_reviews = v_count
  WHERE id = v_talent_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger if exists, then recreate
DROP TRIGGER IF EXISTS trg_sync_talent_rating ON public.reviews;

CREATE TRIGGER trg_sync_talent_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION sync_talent_rating();

-- Backfill: sync current data immediately
UPDATE public.talent_profiles tp
SET
  avg_rating    = sub.avg,
  total_reviews = sub.cnt
FROM (
  SELECT
    talent_id,
    ROUND(AVG(rating)::numeric, 1) AS avg,
    COUNT(*)                        AS cnt
  FROM public.reviews
  GROUP BY talent_id
) sub
WHERE tp.id = sub.talent_id;

-- Talents with no reviews → reset to 0
UPDATE public.talent_profiles
SET avg_rating = 0, total_reviews = 0
WHERE id NOT IN (SELECT DISTINCT talent_id FROM public.reviews);
