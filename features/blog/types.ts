// ─── Blog CMS — types ────────────────────────────────────────────────────
export const BLOG_CATEGORIES = ["UGC", "Talent", "Branding", "Marketing", "Tips", "News"] as const;
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type BlogLang = "ar" | "en";
export type BlogStatus = "draft" | "published";

export interface BlogPostRow {
  id:              string;
  slug:            string;
  lang:            BlogLang;
  title:           string;
  excerpt:         string;
  content:         string;
  category:        BlogCategory;
  coverImageUrl:   string | null;
  tags:            string[];
  seoTitle:        string | null;
  seoDescription:  string | null;
  status:          BlogStatus;
  publishedAt:     string | null;
  authorId:        string | null;
  authorName:      string | null;
  viewCount:       number;
  createdAt:       string;
  updatedAt:       string;
}

export interface BlogPostInput {
  slug:            string;
  lang:            BlogLang;
  title:           string;
  excerpt:         string;
  content:         string;
  category:        BlogCategory;
  coverImageUrl:   string | null;
  tags:            string[];
  seoTitle:        string | null;
  seoDescription:  string | null;
  status:          BlogStatus;
}
