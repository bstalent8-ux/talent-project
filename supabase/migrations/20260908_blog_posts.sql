-- ─── Blog CMS ────────────────────────────────────────────────────────────
-- Backs the new /admin/blog editor tab and the public /blog + /blog/[slug]
-- pages. Was 100% hardcoded (BlogClient.tsx's SAMPLE_POSTS array, no
-- /blog/[slug] route at all — every card linked to a 404). Per CLAUDE.md §6,
-- this file is pasted into the Supabase SQL editor by a human — it is not
-- auto-applied.
--
-- One row = one language version of one article (not a paired ar/en row) —
-- simpler authoring than forcing every post translated before it can ship,
-- and matches how a lot of bilingual sites structure a blog in practice.
-- `category` is a closed set, not free text, because components/blog/
-- BlogCard.tsx's CATEGORY_COLORS map is keyed by these exact strings.

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text        NOT NULL UNIQUE,
  lang             text        NOT NULL DEFAULT 'ar' CHECK (lang IN ('ar', 'en')),
  title            text        NOT NULL,
  excerpt          text        NOT NULL DEFAULT '',
  content          text        NOT NULL DEFAULT '',
  category         text        NOT NULL DEFAULT 'Tips'
                   CHECK (category IN ('UGC', 'Talent', 'Branding', 'Marketing', 'Tips', 'News')),
  cover_image_url  text,
  tags             text[]      NOT NULL DEFAULT '{}',
  seo_title        text,
  seo_description  text,
  status           text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at     timestamptz,
  author_id        uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  view_count       int         NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Defence-in-depth only, same posture as every other table here (CLAUDE.md
-- §9) — the app reads through adminClient and reapplies this same
-- status='published' filter in code (features/blog/services/public-
-- blog.service.ts). A direct/anon client can still only ever see published
-- rows even if that app-layer filter were ever dropped by mistake.
DROP POLICY IF EXISTS "public read published posts" ON public.blog_posts;
CREATE POLICY "public read published posts" ON public.blog_posts
  FOR SELECT USING (status = 'published');
-- No insert/update/delete policy — writes go through service-role admin
-- routes only (app/api/admin/blog/**), each with its own requireAdmin() +
-- requirePermission("blog", ...) check.

CREATE OR REPLACE FUNCTION public.touch_blog_posts_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_posts_touch_updated_at ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_touch_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_blog_posts_updated_at();

-- Single-statement view-count bump, called from the public /blog/[slug]
-- page. `SET search_path = public` + revoking PUBLIC/anon/authenticated
-- execute and granting only service_role is the same lockdown every other
-- SECURITY DEFINER function in this schema uses (see
-- track_talent_profile_view() in 20260823_user_events.sql) — without it,
-- Postgres's default "grant EXECUTE to PUBLIC on create" plus Supabase
-- auto-exposing this as a PostgREST RPC endpoint would let the public anon
-- key call it directly and inflate any post's count with no rate limit.
CREATE OR REPLACE FUNCTION public.increment_blog_post_view_count(post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.blog_posts SET view_count = view_count + 1 WHERE id = post_id;
$$;

REVOKE ALL ON FUNCTION public.increment_blog_post_view_count(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_blog_post_view_count(uuid) TO service_role;
