import type { MetadataRoute } from "next";
import { fetchPublishedBlogSlugs } from "@/features/blog/services/public-blog.service";

export const runtime = 'edge';

// No NEXT_PUBLIC_SITE_URL exists in this project — talent-s.com is the one
// production domain referenced elsewhere (app/layout.tsx's own comment,
// app/(main)/blog/[slug]/page.tsx's canonical URL).
const SITE_URL = "https://talent-s.com";

const STATIC_ROUTES = [
  "", "/explore", "/jobs", "/community", "/brands", "/about", "/contact",
  "/blog", "/packages",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const posts = await fetchPublishedBlogSlugs();
  const blogEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
