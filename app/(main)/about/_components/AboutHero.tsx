"use client";
import { motion } from "framer-motion";

interface Props { dark: boolean; lang: "ar" | "en" }

const TX = {
  ar: {
    tag:      "من نحن",
    title:    "منصة تربط البراندات",
    titleGreen: "بأفضل المواهب العربية",
    sub:      "نؤمن أن كل إبداع يستحق منصة، وكل براند يستحق المواهب الحقيقية. هنا نلتقي.",
  },
  en: {
    tag:      "About Us",
    title:    "A Platform That Connects Brands",
    titleGreen: "with the Arab World's Best Talents",
    sub:      "We believe every creative deserves a stage, and every brand deserves real talent. This is where they meet.",
  },
};

export default function AboutHero({ dark, lang }: Props) {
  const t     = TX[lang];
  const ar    = lang === "ar";
  const GREEN = "#00D26A";
  const GOLD  = "#FFB800";

  return (
    <section style={{
      position: "relative", overflow: "hidden",
      padding: "100px 24px 90px",
      direction: ar ? "rtl" : "ltr",
      textAlign: "center",
    }}>

      {/* BG gradient */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: dark
          ? `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,210,106,0.1) 0%, transparent 65%),
             radial-gradient(ellipse 50% 40% at 80% 90%, rgba(255,184,0,0.06) 0%, transparent 60%),
             #050B12`
          : `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,210,106,0.07) 0%, transparent 65%),
             radial-gradient(ellipse 50% 40% at 80% 90%, rgba(255,184,0,0.04) 0%, transparent 60%),
             #f1f5f9`,
      }} />

      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        opacity: dark ? 0.025 : 0.04,
        backgroundImage: `linear-gradient(${dark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.5)"} 1px, transparent 1px),
                          linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.5)"} 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>

        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            display: "inline-block", marginBottom: 20,
            backgroundColor: dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.08)",
            border: "1px solid rgba(0,210,106,0.25)",
            borderRadius: 100, padding: "5px 18px",
            color: GREEN, fontSize: 11, fontWeight: 700,
            letterSpacing: 1.2, textTransform: "uppercase",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {t.tag}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          style={{
            fontSize: "clamp(30px, 5vw, 56px)",
            fontWeight: 900, lineHeight: 1.2,
            margin: "0 0 20px",
            fontFamily: "'Cairo', sans-serif",
            color: dark ? "#ffffff" : "#0f172a",
          }}
        >
          {t.title}<br />
          <span style={{ color: GREEN }}>{t.titleGreen}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          style={{
            fontSize: "clamp(14px, 2vw, 17px)",
            color: dark ? "#94a3b8" : "#475569",
            lineHeight: 1.8, maxWidth: 520, margin: "0 auto",
            fontFamily: "'Cairo', sans-serif",
          }}
        >
          {t.sub}
        </motion.p>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            width: 60, height: 3, borderRadius: 2,
            background: `linear-gradient(90deg, ${GREEN}, ${GOLD})`,
            margin: "32px auto 0",
          }}
        />
      </div>
    </section>
  );
}
