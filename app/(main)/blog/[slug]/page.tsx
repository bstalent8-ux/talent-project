export const runtime = 'edge';

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublishedBlogPostBySlug, incrementBlogPostViewCount } from "@/features/blog/services/public-blog.service";

// No NEXT_PUBLIC_SITE_URL env var exists in this project (see .env.example)
// — talent-s.com is the one production domain referenced elsewhere in the
// codebase (app/layout.tsx's own comment). Used for the canonical URL and
// OpenGraph tags only; every on-page link stays relative.
const SITE_URL = "https://talent-s.com";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublishedBlogPostBySlug(slug);
  if (!post) return {};

  // This is the actual SEO lever — a real title/description per article,
  // OpenGraph tags, and a canonical URL. Not keyword repetition in the
  // visible text (see BlogForm.tsx's SEO note to the admin writing this).
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: `${title} | Talents Blog`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: "article",
      publishedTime: post.publishedAt ?? undefined,
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image", title, description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

// content is admin-authored plain text (BlogForm's textarea, never raw
// HTML from a browser) — paragraphs separated by a blank line. Escaped
// per-paragraph before being placed in the DOM in case a future edit path
// ever accepts less-trusted input; today's only writer is an authenticated
// admin, but escaping costs nothing and removes the question entirely.
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderParagraphs(content: string): string {
  return content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

const CATEGORY_COLORS: Record<string, string> = {
  UGC: "#00C9B1", Branding: "#1565C0", Talent: "#8B2FC9", Marketing: "#FF6B2B", Tips: "#FFB800", News: "#00D26A",
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  incrementBlogPostViewCount(post.id); // fire-and-forget, never blocks render

  const ar = post.lang === "ar";
  const accent = CATEGORY_COLORS[post.category] ?? "#00D26A";
  const dateLabel = new Date(post.publishedAt ?? post.createdAt).toLocaleDateString(ar ? "ar-EG" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    datePublished: post.publishedAt ?? post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: "Talents" },
    publisher: { "@type": "Organization", name: "Talents" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ background: "var(--bg-base)", minHeight: "100vh" }}>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        <Link href="/blog" style={{ color: "var(--text-muted)", fontSize: 13.5, textDecoration: "none" }}>
          {ar ? "← رجوع للمدونة" : "← Back to blog"}
        </Link>

        <div style={{ marginTop: 20, marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{
            background: `${accent}22`, border: `1px solid ${accent}44`, borderRadius: 20,
            padding: "4px 12px", color: accent, fontSize: 12, fontWeight: 700,
          }}>
            {post.category}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{dateLabel}</span>
        </div>

        <h1 style={{ fontSize: "clamp(26px,4vw,40px)", fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.3, margin: "0 0 16px" }}>
          {post.title}
        </h1>

        <p style={{ fontSize: 17, color: "var(--text-muted)", lineHeight: 1.8, margin: "0 0 28px" }}>
          {post.excerpt}
        </p>

        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt={post.title}
            style={{ width: "100%", borderRadius: 16, marginBottom: 32, display: "block" }}
          />
        )}

        <div
          style={{ fontSize: 16.5, lineHeight: 2, color: "var(--text-primary)" }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: renderParagraphs(post.content) }}
        />

        {post.tags.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border-subtle)" }}>
            {post.tags.map((tag) => (
              <span key={tag} style={{
                background: "var(--bg-card-muted)", borderRadius: 20, padding: "5px 14px",
                color: "var(--text-muted)", fontSize: 12.5,
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
