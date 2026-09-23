-- Typo-tolerant ("fuzzy") search for the server-paginated search boxes that
-- can't load their full dataset client-side (admin talent/admin/notification-
-- recipient search, community questions) — the public marketplace pages
-- (Explore/Jobs/Blog/Brands) already got client-side fuzzy matching in
-- lib/fuzzy-search.ts and needed no DB change.
--
-- Two RPC functions, not raw ILIKE: PostgREST's .ilike()/.or() can't express
-- pg_trgm's similarity()/% operator, so ranking-by-closeness has to happen
-- inside Postgres and come back as a plain id list the existing TS services
-- then .in('id', ids) against, keeping every other filter/pagination/sort
-- line in those services untouched.
--
-- Idempotent — safe to paste more than once.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Accelerates both the ILIKE substring fallback and the similarity() scoring
-- below (pg_trgm's GIN index speeds up ILIKE '%x%' too, not just similarity).
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_handle_trgm ON public.profiles USING gin (handle gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number_trgm ON public.profiles USING gin (phone_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_community_questions_title_trgm ON public.community_questions USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_community_questions_content_trgm ON public.community_questions USING gin (content gin_trgm_ops);

-- ─── profiles search (admin talent search, admin account search, pending-
--     media/avatar review search, notification-recipient picker) ──────────
-- Every existing caller already runs through adminClient (service role) and
-- searches private-ish fields (phone_number), so this stays service-role-
-- only — never a reachable PostgREST RPC endpoint for anon/authenticated.
CREATE OR REPLACE FUNCTION public.search_profiles_fuzzy(
  search_term text,
  role_filter text DEFAULT NULL,
  match_limit integer DEFAULT 200
)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH term AS (
    SELECT
      lower(trim(search_term)) AS q,
      replace(replace(lower(trim(search_term)), '%', '\%'), '_', '\_') AS q_like
  )
  SELECT p.id
  FROM public.profiles p, term
  WHERE term.q <> ''
    AND (role_filter IS NULL OR p.role::text = role_filter)
    AND (
      p.full_name ILIKE '%' || term.q_like || '%'
      OR p.handle ILIKE '%' || term.q_like || '%'
      OR p.phone_number ILIKE '%' || term.q_like || '%'
      OR similarity(coalesce(p.full_name, ''), term.q) > 0.3
      OR similarity(coalesce(p.handle, ''), term.q) > 0.3
    )
  ORDER BY GREATEST(
    similarity(coalesce(p.full_name, ''), term.q),
    similarity(coalesce(p.handle, ''), term.q)
  ) DESC
  LIMIT match_limit;
$$;

REVOKE ALL ON FUNCTION public.search_profiles_fuzzy(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_profiles_fuzzy(text, text, integer) TO service_role;

-- ─── community_questions search (public — the questions themselves are
--     already publicly readable via RLS, see CLAUDE.md §9) ────────────────
CREATE OR REPLACE FUNCTION public.search_community_questions_fuzzy(
  search_term text,
  match_limit integer DEFAULT 200
)
RETURNS TABLE(id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH term AS (
    SELECT
      lower(trim(search_term)) AS q,
      replace(replace(lower(trim(search_term)), '%', '\%'), '_', '\_') AS q_like
  )
  SELECT cq.id
  FROM public.community_questions cq, term
  WHERE term.q <> ''
    AND (
      cq.title ILIKE '%' || term.q_like || '%'
      OR cq.content ILIKE '%' || term.q_like || '%'
      OR EXISTS (SELECT 1 FROM unnest(cq.tags) tg WHERE tg ILIKE '%' || term.q_like || '%')
      OR similarity(coalesce(cq.title, ''), term.q) > 0.25
      OR similarity(coalesce(cq.content, ''), term.q) > 0.2
    )
  ORDER BY GREATEST(
    similarity(coalesce(cq.title, ''), term.q),
    similarity(coalesce(cq.content, ''), term.q)
  ) DESC
  LIMIT match_limit;
$$;

REVOKE ALL ON FUNCTION public.search_community_questions_fuzzy(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_community_questions_fuzzy(text, integer) TO anon, authenticated, service_role;

DO $$
DECLARE
  ext_exists boolean;
  fn1_exists boolean;
  fn2_exists boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') INTO ext_exists;
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_profiles_fuzzy') INTO fn1_exists;
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_community_questions_fuzzy') INTO fn2_exists;
  RAISE NOTICE 'fuzzy_search migration: pg_trgm extension = %, search_profiles_fuzzy = %, search_community_questions_fuzzy = %',
    ext_exists, fn1_exists, fn2_exists;
END $$;
