-- ─── Admin health checkup runs ──────────────────────────────────────────────
-- Backs /admin/health-check. Each row is one on-demand "Run Checkup" click —
-- Cloudinary usage, a small live security checklist, a live performance
-- probe, a 7-day traffic snapshot, and (if ANTHROPIC_API_KEY is set) AI
-- recommendations, all bundled as `results` plus a single 0-100 `score` for
-- quick history/trend display. Per CLAUDE.md §6, this file is pasted into
-- the Supabase SQL editor by a human — it is not auto-applied.

CREATE TABLE IF NOT EXISTS public.health_check_runs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  score       int         NOT NULL CHECK (score >= 0 AND score <= 100),
  results     jsonb       NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_check_runs_created_at ON public.health_check_runs(created_at DESC);

ALTER TABLE public.health_check_runs ENABLE ROW LEVEL SECURITY;
-- No policies — same service-role-only pattern as leads/notifications/
-- user_events. Every read/write goes through adminClient with an app-layer
-- requirePermission()/requireAdmin() check (see CLAUDE.md §3, §9).
