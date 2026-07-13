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
  "UGC":        "#00C9B1",
  "Branding":   "#1565C0",
  "Talent":     "#8B2FC9",
  "Marketing":  "#FF6B2B",
  "Tips":       "#FFB800",
  "News":       "#00D26A",
};

export default function BlogCard({ post, index }: Props) {
  const { dark } = useSite();

  const CARD   = dark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const accent = CATEGORY_COLORS[post.category] ?? "#00D26A";

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
            el.style.borderColor = `${accent}50`;
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
              : `linear-gradient(135deg, ${accent}22 0%, ${accent}08 100%)`,
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
              background:   `${accent}22`,
              border:       `1px solid ${accent}44`,
              borderRadius: 20,
              padding:      "3px 10px",
              color:        accent,
              fontSize:     11,
              fontWeight:   700,
              fontFamily:   "'Cairo', sans-serif",
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
              fontFamily: "'Cairo', sans-serif",
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
              fontFamily: "'Cairo', sans-serif",
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
              <span style={{ color: MUTED, fontSize: 12, fontFamily: "'Cairo', sans-serif" }}>
                {post.date}
              </span>
              <span style={{
                color:      accent,
                fontSize:   11,
                fontWeight: 600,
                fontFamily: "'Cairo', sans-serif",
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
