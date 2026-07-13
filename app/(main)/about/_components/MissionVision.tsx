"use client";
import { motion } from "framer-motion";
import { Target, Telescope } from "lucide-react";

interface Props { dark: boolean; lang: "ar" | "en" }

const TX = {
  ar: {
    mission: {
      tag: "رسالتنا",
      title: "نُمكّن المبدعين. نربط البراندات.",
      body: "نحن هنا لنحوّل طريقة تعاون البراندات مع المواهب في العالم العربي. نؤمن أن كل موهبة — مؤثر، موديل، ممثل، أو صانع محتوى — تستحق أن تُوجَد في المكان المناسب أمام البراند المناسب. نبني جسراً حقيقياً بين الإبداع والتجارة، بشفافية واحترافية تامة.",
    },
    vision: {
      tag: "رؤيتنا",
      title: "المنصة الأولى للتعاون الإبداعي في المنطقة.",
      body: "نسعى لأن نكون البنية التحتية الإبداعية للعالم العربي — المكان الذي يلجأ إليه كل براند يريد أثراً حقيقياً، وكل موهبة تريد فرصة مستحقة.",
    },
  },
  en: {
    mission: {
      tag: "Our Mission",
      title: "Empowering creators. Connecting brands.",
      body: "We're here to transform how brands collaborate with talent across the Arab world. We believe every creative — influencer, model, actor, or content creator — deserves to be in front of the right brand at the right time. We build a real bridge between creativity and commerce, with full transparency and professionalism.",
    },
    vision: {
      tag: "Our Vision",
      title: "The #1 creative collaboration platform in the region.",
      body: "We aspire to be the creative infrastructure of the Arab world — the place every brand turns to for real impact, and every talent turns to for deserved opportunity.",
    },
  },
};

export default function MissionVision({ dark, lang }: Props) {
  const t      = TX[lang];
  const ar     = lang === "ar";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";
  const BG     = dark ? "#060d18" : "#ffffff";
  const CARD   = dark ? "#0D1623" : "#f8fafc";
  const BORDER = dark ? "rgba(0,255,163,0.1)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";

  const cards = [
    { data: t.mission, icon: Target,    accent: GREEN, delay: 0   },
    { data: t.vision,  icon: Telescope, accent: GOLD,  delay: 0.1 },
  ];

  return (
    <section style={{
      backgroundColor: BG,
      borderTop: `1px solid ${BORDER}`,
      padding: "80px 24px",
      direction: ar ? "rtl" : "ltr",
      fontFamily: "'Cairo', sans-serif",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 24,
      }}>
        {cards.map(({ data, icon: Icon, accent, delay }) => (
          <motion.div
            key={data.tag}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay }}
            style={{
              backgroundColor: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: 20, padding: "36px 32px",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Accent top bar */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "20px 20px 0 0" }} />

            <div style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: `${accent}18`,
              border: `1px solid ${accent}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}>
              <Icon size={22} color={accent} />
            </div>

            <span style={{
              display: "inline-block", marginBottom: 10,
              color: accent, fontSize: 10, fontWeight: 800,
              letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              {data.tag}
            </span>

            <h3 style={{
              color: TEXT, fontSize: "clamp(16px, 2.5vw, 22px)",
              fontWeight: 900, margin: "0 0 14px", lineHeight: 1.35,
            }}>
              {data.title}
            </h3>

            <p style={{
              color: MUTED, fontSize: 14, lineHeight: 1.85,
              margin: 0,
            }}>
              {data.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
