// ─── Blog CMS — admin service (server only) ─────────────────────────────
import { adminClient } from "@/lib/supabase/admin";
import type { BlogPostRow, BlogPostInput, BlogStatus } from "../types";

function mapRow(r: Record<string, unknown>, authorName: string | null = null): BlogPostRow {
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
    authorName,
    viewCount:      (r.view_count as number) ?? 0,
    createdAt:      r.created_at as string,
    updatedAt:      r.updated_at as string,
  };
}

// Joins across tables are avoided deliberately here (CLAUDE.md §11 rule
// 10) — batch the author names in a second query and zip them in JS,
// same pattern as fetchAdminEmailLogPage/fetchAdminNotificationLogPage.
const SELECT_COLUMNS = `
  id, slug, lang, title, excerpt, content, category, cover_image_url, tags,
  seo_title, seo_description, status, published_at, author_id, view_count,
  created_at, updated_at
`;

async function attachAuthorNames(rows: Record<string, unknown>[]): Promise<BlogPostRow[]> {
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id as string | null).filter((id): id is string => !!id)));
  const namesById: Record<string, string | null> = {};
  if (authorIds.length) {
    const { data: profiles } = await adminClient.from("profiles").select("id, full_name").in("id", authorIds);
    for (const p of profiles ?? []) namesById[p.id] = p.full_name;
  }
  return rows.map((r) => mapRow(r, r.author_id ? namesById[r.author_id as string] ?? null : null));
}

export interface AdminBlogPageParams {
  page?:     number;
  pageSize?: number;
  status?:   string;
}

export interface AdminBlogPageResult {
  posts: BlogPostRow[];
  total: number;
}

export async function fetchAdminBlogPage({
  page = 1,
  pageSize = 20,
  status,
}: AdminBlogPageParams): Promise<AdminBlogPageResult> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = adminClient
    .from("blog_posts")
    .select(SELECT_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return { posts: [], total: 0 };

  return { posts: await attachAuthorNames(data ?? []), total: count ?? data?.length ?? 0 };
}

export async function fetchAdminBlogPost(id: string): Promise<BlogPostRow | null> {
  const { data, error } = await adminClient
    .from("blog_posts")
    .select(SELECT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const [row] = await attachAuthorNames([data]);
  return row;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  let query = adminClient.from("blog_posts").select("id").eq("slug", slug).limit(1);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  return !!data?.length;
}

export async function createBlogPost(input: BlogPostInput, authorId: string): Promise<{ id: string } | { error: string }> {
  const { data, error } = await adminClient
    .from("blog_posts")
    .insert({
      slug: input.slug,
      lang: input.lang,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      category: input.category,
      cover_image_url: input.coverImageUrl,
      tags: input.tags,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      status: input.status,
      published_at: input.status === "published" ? new Date().toISOString() : null,
      author_id: authorId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

export async function updateBlogPost(id: string, input: BlogPostInput, previousStatus: BlogStatus): Promise<{ ok: true } | { error: string }> {
  // A draft going to "published" for the first time gets published_at now;
  // re-saving an already-published post (or one going back to draft) leaves
  // it alone — the article's original publish date shouldn't move every
  // time an admin fixes a typo.
  const justPublished = previousStatus !== "published" && input.status === "published";

  const { error } = await adminClient
    .from("blog_posts")
    .update({
      slug: input.slug,
      lang: input.lang,
      title: input.title,
      excerpt: input.excerpt,
      content: input.content,
      category: input.category,
      cover_image_url: input.coverImageUrl,
      tags: input.tags,
      seo_title: input.seoTitle,
      seo_description: input.seoDescription,
      status: input.status,
      ...(justPublished ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const { error } = await adminClient.from("blog_posts").delete().eq("id", id);
  return !error;
}
