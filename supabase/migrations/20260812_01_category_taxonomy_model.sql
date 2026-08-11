-- ============================================================
-- 20260812_01_category_taxonomy_model.sql
-- Sprint 1 (Profile Category Foundation) — step 1 of 4.
--
-- Adds the missing `model` talent category. Confirmed via live data audit
-- (docs/audits/profile-system-mvp-audit-2026-08-11.md §5/§8/§12): 0 of 36
-- talent_profiles rows have ever used `model`, and the registration form's
-- `media_buyers` option was never a row in this table — nothing to migrate
-- away from, it was only ever a client-side string that would fail the
-- profile_categories FK on submit. This file adds `model`; the registration
-- form itself is fixed in application code (app/(auth)/register/page.tsx),
-- not here — categories is config data, not registration logic.
--
-- ADDITIVE ONLY. No existing row is modified. Idempotent.
-- ============================================================

INSERT INTO public.categories (id, role_type, label_ar, label_en, sort_order)
VALUES
  ('model', 'talent', 'موديل', 'Model', 75)
ON CONFLICT (id) DO UPDATE SET
  role_type  = EXCLUDED.role_type,
  label_ar   = EXCLUDED.label_ar,
  label_en   = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  is_active  = true;
  -- Re-running this file always re-activates `model` if an admin had
  -- disabled it — acceptable here (unlike profile_types' seed) because this
  -- migration exists specifically to guarantee `model` is selectable; an
  -- admin who wants it off should use the categories admin screen after
  -- this migration has landed once, not have re-runs silently undo that.

-- ─── Verification ────────────────────────────────────────────────────────────
DO $$
DECLARE model_row record;
BEGIN
  SELECT * INTO model_row FROM public.categories WHERE id = 'model';

  IF model_row IS NULL THEN
    RAISE EXCEPTION '20260812_01 failed: model category was not created';
  END IF;

  IF model_row.role_type <> 'talent' OR model_row.is_active <> true THEN
    RAISE EXCEPTION '20260812_01 failed: model category has wrong role_type/is_active: %', row_to_json(model_row);
  END IF;

  RAISE NOTICE 'OK 20260812_01: model category present, role_type=%, is_active=%', model_row.role_type, model_row.is_active;
END $$;

-- ─── Verification: full live talent-category list post-migration ────────────
SELECT id, label_ar, label_en, sort_order, is_active
  FROM public.categories
 WHERE role_type = 'talent'
 ORDER BY sort_order;

-- ─── Verification: confirm media_buyers was never a row (informational) ─────
-- Expect 0 rows — this is not something this migration removes, because it
-- never existed as a row. If this ever returns a row, STOP and investigate
-- before running 20260812_02 (the category FK would reject it).
SELECT id FROM public.categories WHERE id = 'media_buyers';

NOTIFY pgrst, 'reload schema';
