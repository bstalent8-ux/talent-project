// ─── Blog CMS — request body validation (shared by create + update) ────────
import { slugify } from "@/lib/handle";
import { BLOG_CATEGORIES, type BlogPostInput } from "./types";

function str(v: unknown, maxLen: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > maxLen) return null;
  return t;
}

export function parseBlogPostInput(body: Record<string, unknown>): { input: BlogPostInput } | { error: string } {
  const title = str(body.title, 200);
  if (!title) return { error: "title is required" };

  const category = body.category;
  if (typeof category !== "string" || !(BLOG_CATEGORIES as readonly string[]).includes(category)) {
    return { error: "invalid category" };
  }

  const lang = body.lang === "en" ? "en" : "ar";
  const status = body.status === "published" ? "published" : "draft";

  // slugify() has no Arabic transliteration (same documented limitation as
  // lib/handle.ts's deriveHandle) — a pure-Arabic title strips to nothing.
  // Same fix as deriveHandle's own fallback: never hard-fail, generate a
  // stable placeholder the admin can still rename before publishing rather
  // than rejecting the save outright.
  let slug = slugify(str(body.slug, 120) ?? title);
  if (!slug) slug = `post-${Date.now().toString(36)}`;

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim()).slice(0, 15)
    : [];

  return {
    input: {
      slug,
      lang,
      title,
      excerpt: str(body.excerpt, 400) ?? "",
      content: typeof body.content === "string" ? body.content.slice(0, 50_000) : "",
      category: category as BlogPostInput["category"],
      coverImageUrl: str(body.coverImageUrl, 500),
      tags,
      seoTitle: str(body.seoTitle, 70),
      seoDescription: str(body.seoDescription, 200),
      status,
    },
  };
}
