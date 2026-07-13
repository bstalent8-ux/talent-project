"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";
import BlogCard, { type BlogPost } from "@/components/blog/BlogCard";

const TX = {
  ar: {
    badge:  "المدونة",
    title:  "أفكار",
    titleGreen: "ونصائح للمبدعين",
    sub:    "مقالات، نصائح، وأخبار لكل براند وموهبة في العالم العربي.",
    search: "ابحث في المقالات...",
    all:    "الكل",
    empty:  "لا توجد مقالات بعد",
    emptyBody: "نعمل على نشر محتوى رائع قريباً. عد لاحقاً!",
    comingSoon: "قريباً",
  },
  en: {
    badge:  "Blog",
    title:  "Ideas &",
    titleGreen: "Insights for Creators",
    sub:    "Articles, tips, and news for every brand and talent in the Arab world.",
    search: "Search articles...",
    all:    "All",
    empty:  "No articles yet",
    emptyBody: "We're working on great content. Check back soon!",
    comingSoon: "Coming Soon",
  },
};

const SAMPLE_POSTS: BlogPost[] = [
  {
    slug:     "ugc-guide-arabic-brands",
    title:    "دليل شامل لـ UGC للبراندات العربية",
    excerpt:  "كيف تستفيد البراندات العربية من محتوى المستخدمين لزيادة المبيعات وبناء الثقة مع الجمهور؟",
    category: "UGC",
    date:     "2025-01-10",
    readTime: "5 دقائق",
  },
  {
    slug:     "how-to-become-ugc-creator",
    title:    "كيف تصبح UGC Creator ناجح في 2025",
    excerpt:  "خطوات عملية لبدء مسيرتك كمنشئ محتوى مع البراندات، من البداية حتى أول عقد.",
    category: "Talent",
    date:     "2025-01-05",
    readTime: "7 min",
  },
  {
    slug:     "brand-tips-influencer-marketing",
    title:    "5 نصائح لاختيار الموهبة المناسبة لبراندك",
    excerpt:  "اختيار الموهبة الخطأ يكلف وقتاً ومالاً. تعرف على كيفية اختيار المنشئ المناسب لحملتك.",
    category: "Branding",
    date:     "2024-12-28",
    readTime: "4 min",
  },
];

const CATEGORIES = ["All", "UGC", "Talent", "Branding", "Marketing", "Tips", "News"];

export default function BlogClient() {
  const { lang, dark } = useSite();
  const t  = TX[lang];
  const ar = lang === "ar";

  const [search, setSearch]     = useState("");
  const [activecat, setActivecat] = useState("All");

  const BG     = dark ? "#060d18" : "#f8fafc";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const INPUT  = dark ? "rgba(255,255,255,0.06)" : "#ffffff";
  const GREEN  = "#00D26A";

  const filtered = SAMPLE_POSTS.filter(p => {
    const matchesCat = activecat === "All" || p.category === activecat;
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ background: BG, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "90px 24px 60px", textAlign: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: dark
            ? `radial-gradient(ellipse 70% 55% at 50% 0%, rgba(139,47,201,0.1) 0%, transparent 70%), #060d18`
            : `radial-gradient(ellipse 70% 55% at 50% 0%, rgba(139,47,201,0.06) 0%, transparent 70%), #f8fafc`,
        }} />
        {/* Grid overlay */}
        <div style={{
          position: "absolute", inset: 0,
          opacity: dark ? 0.02 : 0.04,
          backgroundImage: `linear-gradient(rgba(139,47,201,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(139,47,201,0.8) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 620, margin: "0 auto" }}>
          <motion.span
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: "inline-block", marginBottom: 18,
              background: "rgba(139,47,201,0.1)", border: "1px solid rgba(139,47,201,0.25)",
              borderRadius: 100, padding: "4px 16px",
              color: "#8B2FC9", fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
            }}
          >{t.badge}</motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, color: TEXT, margin: "0 0 16px" }}
          >
            {t.title} <span style={{ color: "#8B2FC9" }}>{t.titleGreen}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ color: MUTED, fontSize: 16, lineHeight: 1.8, margin: "0 auto 32px", maxWidth: 480 }}
          >{t.sub}</motion.p>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            style={{ maxWidth: 400, margin: "0 auto", position: "relative" }}
          >
            <span style={{ position: "absolute", top: "50%", [ar ? "right" : "left"]: 14, transform: "translateY(-50%)", color: MUTED, fontSize: 16 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.search}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: `12px 44px`,
                background: INPUT, border: `1px solid ${BORDER}`,
                borderRadius: 12, color: TEXT, fontSize: 14,
                fontFamily: "'Cairo', sans-serif", outline: "none",
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 32px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          {CATEGORIES.map(cat => {
            const active = activecat === cat;
            return (
              <button key={cat} onClick={() => setActivecat(cat)} style={{
                padding: "7px 20px", borderRadius: 20,
                border: `1px solid ${active ? "#8B2FC9" : BORDER}`,
                background: active ? "rgba(139,47,201,0.12)" : "transparent",
                color: active ? "#8B2FC9" : MUTED,
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: "pointer", fontFamily: "'Cairo', sans-serif",
                transition: "all 0.15s",
              }}>
                {cat === "All" ? t.all : cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Posts Grid ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 40px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ color: TEXT, fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>{t.empty}</h3>
            <p style={{ color: MUTED, fontSize: 14 }}>{t.emptyBody}</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {filtered.map((post, i) => (
              <BlogCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Coming soon banner */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: dark
              ? "linear-gradient(135deg, rgba(139,47,201,0.08), rgba(21,101,192,0.06))"
              : "linear-gradient(135deg, rgba(139,47,201,0.05), rgba(21,101,192,0.04))",
            border: "1px solid rgba(139,47,201,0.2)",
            borderRadius: 20, padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
          <h3 style={{ color: TEXT, fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
            {t.comingSoon}
          </h3>
          <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.8, margin: 0, maxWidth: 400, marginInline: "auto" }}>
            {ar
              ? "نعمل على نشر مقالات قيّمة لمساعدة البراندات والمواهب على النجاح. ترقبوا!"
              : "We're crafting valuable content to help brands and talents succeed. Stay tuned!"}
          </p>
        </motion.div>
      </section>
    </div>
  );
}
