"use client";
import { motion } from "framer-motion";
import { PenLine, UserCheck, MessageSquare, Handshake, Star } from "lucide-react";

interface Props { dark: boolean; lang: "ar" | "en" }

const TX = {
  ar: {
    tag: "كيف يعمل",
    title: "من الفكرة إلى التعاون في خطوات بسيطة",
    steps: [
      { icon: PenLine,      label: "البراند ينشر",    body: "يكتب البراند تفاصيل المشروع والميزانية والنوع المطلوب." },
      { icon: UserCheck,    label: "الموهبة تتقدم",   body: "تجد المواهب المناسبة الفرصة وتتقدم أو يتواصل معها البراند مباشرة." },
      { icon: MessageSquare,label: "تواصل مباشر",     body: "الطرفان يتحدثان عبر المنصة لمناقشة التفاصيل والاتفاق." },
      { icon: Handshake,    label: "التنفيذ",          body: "تبدأ الموهبة العمل وتسلّم الناتج في الوقت المحدد." },
      { icon: Star,         label: "التقييم",          body: "كلا الطرفين يقيّم التجربة لبناء ثقة المجتمع." },
    ],
  },
  en: {
    tag: "How It Works",
    title: "From idea to collaboration in simple steps",
    steps: [
      { icon: PenLine,       label: "Brand Posts",      body: "The brand publishes project details, budget, and the type of talent needed." },
      { icon: UserCheck,     label: "Talent Applies",   body: "Matching talents find the opportunity and apply, or the brand reaches out directly." },
      { icon: MessageSquare, label: "Direct Chat",      body: "Both parties discuss details and agree on terms through the platform." },
      { icon: Handshake,     label: "Execution",        body: "The talent delivers the work on time as agreed." },
      { icon: Star,          label: "Review",           body: "Both sides leave a review to build community trust." },
    ],
  },
};

export default function HowItWorks({ dark, lang }: Props) {
  const t      = TX[lang];
  const ar     = lang === "ar";
  const GREEN  = "#00D26A";
  const BG     = dark ? "#050B12" : "#f1f5f9";
  const CARD   = dark ? "#0D1623" : "#ffffff";
  const BORDER = dark ? "rgba(0,255,163,0.1)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const LINE   = dark ? "rgba(0,210,106,0.15)" : "#d1fae5";

  return (
    <section style={{
      backgroundColor: BG,
      borderTop: `1px solid ${BORDER}`,
      padding: "80px 24px 90px",
      direction: ar ? "rtl" : "ltr",
      fontFamily: "'Cairo', sans-serif",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <span style={{
            display: "inline-block", marginBottom: 12,
            backgroundColor: dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.07)",
            border: "1px solid rgba(0,210,106,0.2)",
            borderRadius: 100, padding: "4px 16px",
            color: GREEN, fontSize: 11, fontWeight: 700,
            letterSpacing: 1.2, textTransform: "uppercase",
          }}>
            {t.tag}
          </span>
          <h2 style={{
            color: TEXT, fontSize: "clamp(22px, 4vw, 34px)",
            fontWeight: 900, margin: 0,
          }}>
            {t.title}
          </h2>
        </motion.div>

        {/* Steps */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16, position: "relative",
        }}>
          {t.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -4, boxShadow: dark ? "0 10px 32px rgba(0,210,106,0.1)" : "0 10px 28px rgba(0,0,0,0.08)" }}
                style={{
                  backgroundColor: CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 16, padding: "28px 20px 24px",
                  display: "flex", flexDirection: "column", gap: 14,
                  position: "relative", transition: "box-shadow 0.25s",
                }}
              >
                {/* Step number */}
                <div style={{
                  position: "absolute", top: 14, right: ar ? "auto" : 14, left: ar ? 14 : "auto",
                  width: 22, height: 22, borderRadius: "50%",
                  backgroundColor: `${GREEN}20`,
                  border: `1px solid ${GREEN}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 900, color: GREEN,
                }}>
                  {i + 1}
                </div>

                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  backgroundColor: dark ? "rgba(0,210,106,0.08)" : "rgba(0,210,106,0.06)",
                  border: "1px solid rgba(0,210,106,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={GREEN} />
                </div>

                <div>
                  <h4 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 6px" }}>{step.label}</h4>
                  <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.75, margin: 0 }}>{step.body}</p>
                </div>

                {/* Connector arrow — not on last */}
                {i < t.steps.length - 1 && (
                  <div style={{
                    display: "none", // shown via CSS below
                    position: "absolute",
                    top: "50%", [ar ? "left" : "right"]: -12,
                    transform: "translateY(-50%)",
                    color: LINE, fontSize: 18, fontWeight: 900,
                    pointerEvents: "none",
                  }}>
                    {ar ? "←" : "→"}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
