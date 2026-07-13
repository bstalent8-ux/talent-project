"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Zap, Globe } from "lucide-react";

interface Props { dark: boolean; lang: "ar" | "en" }

const TX = {
  ar: {
    tag: "من نحن",
    heading: "منصة واحدة. لا حدود للتعاون.",
    body: "نربط البراندات العربية والعالمية بأفضل المواهب المحلية — مؤثرون، موديلز، ممثلون، صنّاع محتوى. كل شيء في مكان واحد، بثقة وشفافية تامة.",
    more: "تعرّف علينا أكثر",
    pillars: [
      { icon: ShieldCheck, title: "موثوقية 100%",   body: "كل موهوب موثّق ومراجَع يدوياً قبل النشر." },
      { icon: Zap,         title: "تعاون سريع",     body: "من الطلب للتسليم في أقل وقت ممكن." },
      { icon: Globe,       title: "شبكة عربية",     body: "مواهب من مصر، الخليج، المغرب العربي وأكثر." },
    ],
  },
  en: {
    tag: "About Us",
    heading: "One platform. Limitless collaboration.",
    body: "We connect Arab and global brands with the best local talent — influencers, models, actors, content creators. Everything in one place, with full trust and transparency.",
    more: "Learn more about us",
    pillars: [
      { icon: ShieldCheck, title: "100% Verified",     body: "Every talent is manually reviewed before going live." },
      { icon: Zap,         title: "Fast Collaboration", body: "From request to delivery in the shortest time." },
      { icon: Globe,       title: "Arab Network",      body: "Talents from Egypt, Gulf, North Africa and beyond." },
    ],
  },
};

export default function AboutSection({ dark, lang }: Props) {
  const t     = TX[lang];
  const ar    = lang === "ar";
  const GREEN = "#00D26A";
  const BG    = dark ? "#060d18" : "#ffffff";
  const CARD  = dark ? "#0D1623" : "#f8fafc";
  const BORDER = dark ? "rgba(0,255,163,0.1)" : "#e2e8f0";
  const TEXT  = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#64748b" : "#94a3b8";

  return (
    <section style={{
      backgroundColor: BG,
      borderTop: `1px solid ${BORDER}`,
      borderBottom: `1px solid ${BORDER}`,
      padding: "80px 24px",
      direction: ar ? "rtl" : "ltr",
      fontFamily: "'Cairo', sans-serif",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: 56 }}
        >
          <span style={{
            display: "inline-block", marginBottom: 14,
            backgroundColor: dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.07)",
            border: `1px solid rgba(0,210,106,0.2)`,
            borderRadius: 100, padding: "4px 16px",
            color: GREEN, fontSize: 11, fontWeight: 700, letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            {t.tag}
          </span>

          <h2 style={{ color: TEXT, fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.3 }}>
            {t.heading}
          </h2>

          <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.8, maxWidth: 560, margin: "0 auto 24px" }}>
            {t.body}
          </p>

          <Link href="/about" style={{
            color: GREEN, fontSize: 13, fontWeight: 700,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
          >
            {t.more} {ar ? "←" : "→"}
          </Link>
        </motion.div>

        {/* Pillars */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {t.pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  backgroundColor: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 16, padding: "28px 24px",
                  display: "flex", flexDirection: "column", gap: 14,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.07)",
                  border: `1px solid rgba(0,210,106,0.2)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={GREEN} />
                </div>
                <div>
                  <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>{p.title}</h3>
                  <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{p.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
