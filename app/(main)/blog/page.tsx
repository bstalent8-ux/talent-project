export const runtime = 'edge';

import type { Metadata } from "next";
import BlogClient from "./_components/BlogClient";
import { fetchPublishedBlogPosts } from "@/features/blog/services/public-blog.service";
import type { BlogPost } from "@/components/blog/BlogCard";

export const metadata: Metadata = {
  title: "المدونة — Talents | Blog",
  description: "Tips, insights, and news for brands and Arabic content creators.",
};

// Guests read this per CLAUDE.md §8's public-page rule: fetch through
// adminClient (features/blog/services/public-blog.service.ts), the service
// reapplies status === "published" in code, RLS's own published-only policy
// is the defence-in-depth backstop underneath that.
export default async function BlogPage() {
  const rows = await fetchPublishedBlogPosts();

  const posts: BlogPost[] = rows.map((r) => ({
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category,
    date: r.publishedAt ?? r.createdAt,
    readTime: `${Math.max(1, Math.round(r.content.split(/\s+/).length / 200))} min`,
    cover: r.coverImageUrl ?? undefined,
  }));

  return <BlogClient posts={posts} />;
}
