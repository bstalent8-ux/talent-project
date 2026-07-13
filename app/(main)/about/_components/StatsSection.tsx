"use client";
import { motion } from "framer-motion";
import { Users, Building2, BadgeCheck, Star } from "lucide-react";

interface Props { dark: boolean; lang: "ar" | "en" }

const TX = {
  ar: {
    tag: "أرقامنا",
    title: "ثقة تُقاس بالأعداد",
    sub: "منذ انطلاقنا ونحن نبني مجتمع المواهب العربية.",
    stats: [
      { icon: Users,       value: "247+",  label: "موهوب مسجّل",         color: "#00D26A" },
      { icon: Building2,   value: "83",    label: "براند نشط",            color: "#FFB800" },
      { icon: BadgeCheck,  value: "100%",  label: "مواهب موثّقة يدوياً", color: "#3B82F6" },
      { icon: Star,        value: "4.9★",  label: "متوسط التقييم",        color: "#EC4899" },
    ],
  },
  en: {
    tag: "Our Numbers",
    title: "Trust measured in numbers",
    sub: "Since launch, we've been building the Arab talent community.",
    stats: [
      { icon: Users,      value: "247+",  label: "Registered Talents",  color: "#00D26A" },
      { icon: Building2,  value: "83",    label: "Active Brands",        color: "#FFB800" },
      { icon: BadgeCheck, value: "100%",  label: "Manually Verified",    color: "#3B82F6" },
      { icon: Star,       value: "4.9★",  label: "Average Rating",       color: "#EC4899" },
    ],
  },
};

export default function StatsSection({ dark, lang }: Props) {
  const t      = TX[lang];
  const ar     = lang === "ar";
  const BG     = dark ? "#060d18" : "#ffffff";
  const CARD   = dark ? "#0D1623" : "#f8fafc";
  const BORDER = dark ? "rgba(0,255,163,0.08)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";

  return (
    <section style={{
      backgroundColor: BG,
      borderTop: `1px solid ${BORDER}`,
      padding: "80px 24px",
      direction: ar ? "rtl" : "ltr",
      fontFamily: "'Cairo', sans-serif",
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 52 }}
        >
          <span style={{
            display: "inline-block", marginBottom: 12,
            backgroundColor: dark ? "rgba(255,184,0,0.1)" : "rgba(255,184,0,0.07)",
            border: "1px solid rgba(255,184,0,0.2)",
            borderRadius: 100, padding: "4px 16px",
            color: "#FFB800", fontSize: 11, fontWeight: 700,
            letterSpacing: 1.2, textTransform: "uppercase",
          }}>
            {t.tag}
          </span>
          <h2 style={{ color: TEXT, fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, margin: "0 0 10px" }}>
            {t.title}
          </h2>
          <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>{t.sub}</p>
        </motion.div>

        {/* Stats grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 20,
        }}>
          {t.stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -3 }}
                style={{
                  backgroundColor: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 18, padding: "32px 24px",
                  textAlign: "center", display: "flex",
                  flexDirection: "column", alignItems: "center", gap: 12,
                  transition: "box-shadow 0.2s",
                  borderTop: `3px solid ${s.color}`,
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  backgroundColor: `${s.color}15`,
                  border: `1px solid ${s.color}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={24} color={s.color} />
                </div>
                <div style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>
                  {s.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
