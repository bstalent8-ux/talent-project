"use client";
import { motion } from "framer-motion";
import Link from "next/link";

interface Props { dark: boolean; lang: "ar" | "en" }

const TX = {
  ar: {
    title: "جاهز تبدأ؟",
    sub:   "سواء كنت براند يبحث عن موهبة، أو موهبة تبحث عن فرصة — مكانك هنا.",
    cta1:  "استكشف المواهب",
    cta2:  "انضم كموهوب",
  },
  en: {
    title: "Ready to start?",
    sub:   "Whether you're a brand looking for talent, or a talent looking for opportunity — your place is here.",
    cta1:  "Explore Talents",
    cta2:  "Become a Talent",
  },
};

export default function AboutCTA({ dark, lang }: Props) {
  const t      = TX[lang];
  const ar     = lang === "ar";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";
  const BG     = dark ? "#050B12" : "#f1f5f9";
  const BORDER = dark ? "rgba(0,255,163,0.1)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#475569";

  return (
    <section style={{
      backgroundColor: BG,
      borderTop: `1px solid ${BORDER}`,
      padding: "90px 24px 100px",
      direction: ar ? "rtl" : "ltr",
      fontFamily: "'Cairo', sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        style={{
          maxWidth: 680, margin: "0 auto",
          textAlign: "center",
          padding: "60px 40px",
          backgroundColor: dark ? "#0D1623" : "#ffffff",
          border: `1px solid ${BORDER}`,
          borderRadius: 24,
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Glow */}
        <div style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "70%", height: 2,
          background: `linear-gradient(90deg, transparent, ${GREEN}, transparent)`,
        }} />

        <div style={{ fontSize: 40, marginBottom: 16 }}>🚀</div>

        <h2 style={{
          color: TEXT,
          fontSize: "clamp(22px, 4vw, 34px)",
          fontWeight: 900, margin: "0 0 14px",
          lineHeight: 1.3,
        }}>
          {t.title}
        </h2>

        <p style={{
          color: MUTED, fontSize: 15, lineHeight: 1.8,
          maxWidth: 440, margin: "0 auto 36px",
        }}>
          {t.sub}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/explore" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            backgroundColor: GREEN, color: "#000",
            padding: "13px 28px", borderRadius: 12,
            fontWeight: 800, fontSize: 14,
            textDecoration: "none", fontFamily: "'Cairo', sans-serif",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,210,106,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {t.cta1} {ar ? "←" : "→"}
          </Link>

          <Link href="/become-talent" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            backgroundColor: "transparent",
            border: `1.5px solid ${GOLD}`,
            color: GOLD, padding: "13px 28px", borderRadius: 12,
            fontWeight: 700, fontSize: 14,
            textDecoration: "none", fontFamily: "'Cairo', sans-serif",
            transition: "background-color 0.2s, color 0.2s, transform 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = GOLD; e.currentTarget.style.color = "#000"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = GOLD; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            {t.cta2}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
