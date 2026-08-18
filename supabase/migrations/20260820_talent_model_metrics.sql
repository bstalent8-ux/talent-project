-- ─── talent_profiles.model_metrics ────────────────────────────────────────────
-- Admin-managed trust/performance metrics for Model/Fashion public profiles —
-- response_time_label, response_rate, repeat_client_rate, on_time_rate,
-- avg_project_value, no_show_rate, tier. None of these are derivable from
-- tracked data today (see CLAUDE.md's model-profile report), so an admin
-- enters them by hand via /admin/talents/[id]; every field is optional and a
-- missing field must render as "not shown", never a fabricated number.
--
-- A single jsonb column (not seven typed columns) mirrors the existing
-- packages/social_links/usage_addons convention for admin-curated blobs that
-- haven't earned a normalized table yet.
ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS model_metrics jsonb NOT NULL DEFAULT '{}'::jsonb;
