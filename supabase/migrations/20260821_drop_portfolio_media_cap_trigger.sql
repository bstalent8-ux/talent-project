-- ─── Remove the portfolio_items media-count cap trigger ──────────────────────
-- Confirmed live behavior (2026-08-21): an undocumented trigger on
-- portfolio_items rejects any INSERT past 5 "photo" rows or past 1 "video"
-- row per talent, raising "الحد الأقصى 5 صور للموهبة الواحدة". No migration
-- file for it exists in this repo — it was created directly against the
-- live DB (CLAUDE.md §6: the DB is the source of truth, not this folder).
--
-- The exact trigger/function name isn't known, so this finds and drops
-- whatever non-internal trigger(s) exist on portfolio_items rather than
-- guessing a name. Scope check before running: this table should only carry
-- this one quota-style trigger — if `\d portfolio_items` in the SQL editor
-- shows something else attached, stop and paste it back instead of running
-- this blind.
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'portfolio_items' AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.portfolio_items', trig.tgname);
    RAISE NOTICE 'Dropped trigger: %', trig.tgname;
  END LOOP;
END $$;
