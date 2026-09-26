"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";

export interface BlogPost {
  slug:        string;
  title:       string;
  excerpt:     string;
  category:    string;
  date:        string;
  readTime:    string;
  cover?:      string;
  author?:     string;
}

interface Props {
  post:  BlogPost;
  index: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "UGC":        "var(--color-primary-text)",
  "Branding":   "#3E9A98",
  "Talent":     "#B9694C",
  "Marketing":  "var(--color-accent-strong)",
  "Tips":       "var(--color-accent-strong)",
  "News":       "var(--color-primary-text)",
};

export default function BlogCard({ post, index }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  // `post.date` comes through as a raw ISO timestamp from the DB (published_
  // at/created_at) — format it here rather than asking every caller to.
  const formattedDate = (() => {
    const d = new Date(post.date);
    return Number.isNaN(d.getTime()) ? post.date : d.toLocaleDateString(ar ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" });
  })();

  const CARD   = dark ? "rgba(255,255,255,0.04)" : "#FBF7EA";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#E6DCC3";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#8F8175" : "#8C7D71";
  const accent = CATEGORY_COLORS[post.category] ?? "var(--color-primary-text)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06 * index }}
    >
      <Link
        href={`/blog/${post.slug}`}
        style={{ textDecoration: "none", display: "block" }}
      >
        <div
          style={{
            background:   CARD,
            border:       `1px solid ${BORDER}`,
            borderRadius: 16,
            overflow:     "hidden",
            transition:   "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
            cursor:       "pointer",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.transform   = "translateY(-4px)";
            el.style.boxShadow   = dark ? "0 20px 40px rgba(0,0,0,0.4)" : "0 20px 40px rgba(0,0,0,0.1)";
            el.style.borderColor = `color-mix(in srgb, ${accent} 31%, transparent)`;
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.transform   = "translateY(0)";
            el.style.boxShadow   = "none";
            el.style.borderColor = BORDER;
          }}
        >
          {/* Cover image / placeholder */}
          <div style={{
            height:     180,
            background: post.cover
              ? `url(${post.cover}) center/cover`
              : `linear-gradient(135deg, color-mix(in srgb, ${accent} 13%, transparent) 0%, color-mix(in srgb, ${accent} 3%, transparent) 100%)`,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            position:   "relative",
          }}>
            {!post.cover && (
              <span style={{ fontSize: 40, opacity: 0.3 }}>📝</span>
            )}
            <span style={{
              position:     "absolute",
              top:          12,
              left:         12,
              background:   `color-mix(in srgb, ${accent} 13%, transparent)`,
              border:       `1px solid color-mix(in srgb, ${accent} 27%, transparent)`,
              borderRadius: 20,
              padding:      "3px 10px",
              color:        accent,
              fontSize:     11,
              fontWeight:   700,
              fontFamily:   "'IBM Plex Sans Arabic', sans-serif",
            }}>
              {post.category}
            </span>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 22px 22px" }}>
            <h3 style={{
              fontSize:   16,
              fontWeight: 700,
              color:      TEXT,
              margin:     "0 0 10px",
              fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              lineHeight: 1.5,
              display:    "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow:   "hidden",
            }}>
              {post.title}
            </h3>

            <p style={{
              fontSize:   13,
              color:      MUTED,
              lineHeight: 1.7,
              margin:     "0 0 16px",
              fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              display:    "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow:   "hidden",
            }}>
              {post.excerpt}
            </p>

            <div style={{
              display:    "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap:        8,
            }}>
              <span style={{ color: MUTED, fontSize: 12, fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
                {formattedDate}
              </span>
              <span style={{
                color:      accent,
                fontSize:   11,
                fontWeight: 600,
                fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              }}>
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
