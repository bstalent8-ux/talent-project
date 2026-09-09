// ─── Blog CMS — public service (server only) ────────────────────────────
// Backs /blog and /blog/[slug]. Reads through adminClient (RLS bypassed)
// and reapplies status === "published" in code — same "public server page
// through adminClient must reapply public filters" rule as every other
// guest-facing listing (CLAUDE.md §8).

import { adminClient } from "@/lib/supabase/admin";
import type { BlogPostRow, BlogStatus } from "../types";

const PUBLIC_COLUMNS = `
  id, slug, lang, title, excerpt, content, category, cover_image_url, tags,
  seo_title, seo_description, status, published_at, author_id, view_count,
  created_at, updated_at
`;

function mapRow(r: Record<string, unknown>): BlogPostRow {
  return {
    id:             r.id as string,
    slug:           r.slug as string,
    lang:           r.lang as BlogPostRow["lang"],
    title:          r.title as string,
    excerpt:        r.excerpt as string,
    content:        r.content as string,
    category:       r.category as BlogPostRow["category"],
    coverImageUrl:  (r.cover_image_url as string | null) ?? null,
    tags:           (r.tags as string[] | null) ?? [],
    seoTitle:       (r.seo_title as string | null) ?? null,
    seoDescription: (r.seo_description as string | null) ?? null,
    status:         r.status as BlogStatus,
    publishedAt:    (r.published_at as string | null) ?? null,
    authorId:       (r.author_id as string | null) ?? null,
    authorName:     null, // not needed on the public site today
    viewCount:      (r.view_count as number) ?? 0,
    createdAt:      r.created_at as string,
    updatedAt:      r.updated_at as string,
  };
}

export async function fetchPublishedBlogPosts(lang?: "ar" | "en"): Promise<BlogPostRow[]> {
  let query = adminClient
    .from("blog_posts")
    .select(PUBLIC_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (lang) query = query.eq("lang", lang);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map(mapRow);
}

export async function fetchPublishedBlogPostBySlug(slug: string): Promise<BlogPostRow | null> {
  const { data, error } = await adminClient
    .from("blog_posts")
    .select(PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data);
}

/** Fire-and-forget, same posture as every other analytics-adjacent counter
 *  in this app (lib/events/service.ts) — a failed view-count bump must
 *  never break rendering the article. */
export async function incrementBlogPostViewCount(id: string): Promise<void> {
  try {
    await adminClient.rpc("increment_blog_post_view_count", { post_id: id });
  } catch {
    // swallow — see doc comment above
  }
}

/** Every published slug — feeds app/sitemap.ts. */
export async function fetchPublishedBlogSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  const { data, error } = await adminClient
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published");
  if (error) return [];
  return (data ?? []).map((r) => ({ slug: r.slug, updatedAt: r.updated_at }));
}
