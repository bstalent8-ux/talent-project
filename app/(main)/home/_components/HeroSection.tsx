"use client";
import { motion } from "framer-motion";
import Link from "next/link";

interface Props { dark: boolean; lang: "ar" | "en" }

const TX = {
  ar: {
    headline1: "ربط البراندات",
    headline2: "بأفضل المواهب",
    headline3: "في العالم العربي",
    sub: "منصة واحدة تجمع المؤثرين، الموديلز، صنّاع المحتوى والبراندات — تعاون حقيقي، نتائج قابلة للقياس.",
    cta1: "استكشف المواهب",
    cta2: "انضم كموهوب",
    badge: "🚀 منصة المواهب #1 في الشرق الأوسط",
  },
  en: {
    headline1: "Connect Brands",
    headline2: "with Top Talents",
    headline3: "in the Arab World",
    sub: "One platform uniting influencers, models, content creators and brands — real collaboration, measurable results.",
    cta1: "Explore Talents",
    cta2: "Become a Talent",
    badge: "🚀 The #1 Talent Platform in the Middle East",
  },
};

export default function HeroSection({ dark, lang }: Props) {
  const t   = TX[lang];
  const ar  = lang === "ar";
  const GREEN = "#00D26A";
  const GOLD  = "#FFB800";

  return (
    <section style={{
      position: "relative",
      overflow: "hidden",
      minHeight: "88vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 24px 80px",
      direction: ar ? "rtl" : "ltr",
    }}>

      {/* Background */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: dark
          ? "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,210,106,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(255,184,0,0.07) 0%, transparent 60%), #050B12"
          : "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,210,106,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(255,184,0,0.05) 0%, transparent 60%), #f1f5f9",
      }} />

      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0, opacity: dark ? 0.03 : 0.05,
        backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)"} 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      {/* Glow orbs */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: ar ? "auto" : "8%", right: ar ? "8%" : "auto", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${GREEN}18 0%, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "15%", right: ar ? "auto" : "10%", left: ar ? "10%" : "auto", width: 250, height: 250, borderRadius: "50%", background: `radial-gradient(circle, ${GOLD}14 0%, transparent 70%)`, filter: "blur(40px)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, textAlign: "center", margin: "0 auto" }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 28 }}
        >
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            backgroundColor: dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.08)",
            border: `1px solid rgba(0,210,106,0.25)`,
            borderRadius: 100, padding: "6px 18px",
            color: GREEN, fontSize: 12, fontWeight: 700,
            letterSpacing: 0.3,
          }}>
            {t.badge}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.15,
            margin: "0 0 24px",
            fontFamily: "'Cairo', sans-serif",
            color: dark ? "#ffffff" : "#0f172a",
          }}
        >
          <span>{t.headline1} </span>
          <span style={{ color: GREEN }}>{t.headline2}</span>
          <br />
          <span>{t.headline3}</span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: "clamp(14px, 2vw, 18px)",
            color: dark ? "#94a3b8" : "#475569",
            lineHeight: 1.75,
            maxWidth: 580,
            margin: "0 auto 40px",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {t.sub}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link href="/explore" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            backgroundColor: GREEN, color: "#000",
            padding: "14px 32px", borderRadius: 12,
            fontWeight: 800, fontSize: 15,
            textDecoration: "none", fontFamily: "'Cairo', sans-serif",
            boxShadow: "0 0 0 0 rgba(0,210,106,0.4)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,210,106,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 0 0 rgba(0,210,106,0.4)"; }}
          >
            {t.cta1} {ar ? "←" : "→"}
          </Link>

          <Link href="/become-talent" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            backgroundColor: "transparent",
            border: `1.5px solid ${dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}`,
            color: dark ? "#f1f5f9" : "#0f172a",
            padding: "14px 32px", borderRadius: 12,
            fontWeight: 700, fontSize: 15,
            textDecoration: "none", fontFamily: "'Cairo', sans-serif",
            transition: "border-color 0.2s, transform 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {t.cta2}
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{
            display: "flex", justifyContent: "center", gap: 40,
            marginTop: 64, flexWrap: "wrap",
          }}
        >
          {[
            { num: "247+", label: ar ? "موهوب" : "Talents" },
            { num: "83",   label: ar ? "براند" : "Brands" },
            { num: "4.9★", label: ar ? "متوسط التقييم" : "Avg Rating" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: GOLD, fontFamily: "'Cairo', sans-serif" }}>{s.num}</div>
              <div style={{ fontSize: 12, color: dark ? "#64748b" : "#94a3b8", marginTop: 2, fontFamily: "'Cairo', sans-serif" }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
