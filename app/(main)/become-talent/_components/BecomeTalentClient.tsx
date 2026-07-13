"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";

const TX = {
  ar: {
    badge:       "انضم كموهبة",
    title:       "حوّل إبداعك",
    titleAccent: "إلى مصدر دخل حقيقي",
    sub:         "انضم لآلاف المواهب العربية الذين يعملون مع أفضل البراندات ويبنون مستقبلهم المهني معنا.",
    cta:         "ابدأ الآن مجاناً",
    ctaSub:      "لا حاجة لبطاقة ائتمانية",
    howTitle:    "كيف تبدأ؟",
    steps: [
      { icon: "📝", title: "سجّل حسابك", body: "أنشئ حسابك المجاني في أقل من دقيقتين." },
      { icon: "🎨", title: "أضف محفظتك", body: "اعرض أعمالك وخبراتك لجذب البراندات المناسبة." },
      { icon: "💼", title: "تواصل مع البراندات", body: "تلقَّ عروض العمل وابدأ التعاون مباشرة." },
      { icon: "💰", title: "احصل على مدفوعاتك", body: "ادفعات آمنة ومباشرة بعد إتمام كل مشروع." },
    ],
    benefitsTitle: "لماذا Talents؟",
    benefits: [
      { icon: "🌟", title: "براندات حقيقية", body: "تواصل مع شركات وعلامات تجارية موثوقة تبحث عن مواهب مثلك." },
      { icon: "💸", title: "أسعار عادلة", body: "أنت تحدد أسعارك. لا وسطاء، لا خصومات مخفية." },
      { icon: "🔒", title: "مدفوعات آمنة", body: "نظام إيداع يضمن حصولك على مستحقاتك في كل مشروع." },
      { icon: "📈", title: "نمو مستمر", body: "بناء سمعتك عبر التقييمات وتنمية قاعدة عملائك." },
      { icon: "🌍", title: "فرص لا حدود لها", body: "وصول لبراندات من السعودية والإمارات ومصر والعالم العربي." },
      { icon: "🤝", title: "مجتمع داعم", body: "انضم لمجتمع من المبدعين والمحترفين العرب." },
    ],
    typesTitle: "من يمكنه الانضمام؟",
    types: [
      { icon: "📱", label: "UGC Creator" },
      { icon: "🎬", label: "Video Creator" },
      { icon: "📸", label: "Photographer" },
      { icon: "✍️", label: "Copywriter" },
      { icon: "🎵", label: "Voice Over" },
      { icon: "🎨", label: "Graphic Designer" },
      { icon: "📊", label: "Social Media Manager" },
      { icon: "💡", label: "Influencer" },
    ],
    statsTitle: "بالأرقام",
    stats: [
      { value: "1,000+", label: "موهبة نشطة" },
      { value: "500+",   label: "براند موثوق" },
      { value: "5,000+", label: "مشروع مكتمل" },
      { value: "98%",    label: "رضا العملاء" },
    ],
    finalCta:    "جاهز للانطلاق؟",
    finalCtaSub: "انضم مجاناً وابدأ رحلتك الإبداعية.",
    finalBtn:    "أنشئ حسابك الآن",
  },
  en: {
    badge:       "Join as a Talent",
    title:       "Turn Your Creativity",
    titleAccent: "into Real Income",
    sub:         "Join thousands of Arab talents working with top brands and building their careers on Talents.",
    cta:         "Get Started Free",
    ctaSub:      "No credit card required",
    howTitle:    "How It Works",
    steps: [
      { icon: "📝", title: "Create Your Account", body: "Sign up for free in less than 2 minutes." },
      { icon: "🎨", title: "Build Your Portfolio", body: "Showcase your work and skills to attract the right brands." },
      { icon: "💼", title: "Connect with Brands", body: "Receive job offers and start collaborating directly." },
      { icon: "💰", title: "Get Paid", body: "Safe, direct payments after every completed project." },
    ],
    benefitsTitle: "Why Talents?",
    benefits: [
      { icon: "🌟", title: "Real Brands", body: "Connect with trusted companies and brands actively looking for talents like you." },
      { icon: "💸", title: "Fair Pricing", body: "You set your rates. No middlemen, no hidden fees." },
      { icon: "🔒", title: "Secure Payments", body: "Escrow system guarantees you get paid for every project." },
      { icon: "📈", title: "Continuous Growth", body: "Build your reputation through reviews and grow your client base." },
      { icon: "🌍", title: "Unlimited Opportunities", body: "Access brands from Saudi Arabia, UAE, Egypt, and the Arab world." },
      { icon: "🤝", title: "Supportive Community", body: "Join a community of Arab creative professionals." },
    ],
    typesTitle: "Who Can Join?",
    types: [
      { icon: "📱", label: "UGC Creator" },
      { icon: "🎬", label: "Video Creator" },
      { icon: "📸", label: "Photographer" },
      { icon: "✍️", label: "Copywriter" },
      { icon: "🎵", label: "Voice Over" },
      { icon: "🎨", label: "Graphic Designer" },
      { icon: "📊", label: "Social Media Manager" },
      { icon: "💡", label: "Influencer" },
    ],
    statsTitle: "By the Numbers",
    stats: [
      { value: "1,000+", label: "Active Talents" },
      { value: "500+",   label: "Trusted Brands" },
      { value: "5,000+", label: "Projects Completed" },
      { value: "98%",    label: "Client Satisfaction" },
    ],
    finalCta:    "Ready to Launch?",
    finalCtaSub: "Join for free and start your creative journey.",
    finalBtn:    "Create Your Account",
  },
};

export default function BecomeTalentClient() {
  const { lang, dark } = useSite();
  const t  = TX[lang];
  const ar = lang === "ar";

  const BG     = dark ? "#060d18" : "#f8fafc";
  const CARD   = dark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const TEAL   = "#00C9B1";
  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";
  const PURPLE = "#8B2FC9";

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ background: BG, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: dark
            ? `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,201,177,0.12) 0%, transparent 65%),
               radial-gradient(ellipse 50% 40% at 80% 100%, rgba(255,184,0,0.08) 0%, transparent 55%),
               #060d18`
            : `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,201,177,0.08) 0%, transparent 65%),
               #f8fafc`,
        }} />
        <div style={{
          position: "absolute", inset: 0, opacity: dark ? 0.025 : 0.04,
          backgroundImage: `linear-gradient(rgba(0,201,177,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(0,201,177,0.7) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto" }}>
          <motion.span
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: "inline-block", marginBottom: 20,
              background: "rgba(0,201,177,0.1)", border: "1px solid rgba(0,201,177,0.25)",
              borderRadius: 100, padding: "5px 18px",
              color: TEAL, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
            }}
          >{t.badge}</motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(30px,6vw,60px)", fontWeight: 900, margin: "0 0 20px", lineHeight: 1.15, color: TEXT }}
          >
            {t.title}<br />
            <span style={{ backgroundImage: `linear-gradient(135deg, ${TEAL}, ${GREEN})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t.titleAccent}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ color: MUTED, fontSize: "clamp(14px,2vw,18px)", lineHeight: 1.8, maxWidth: 520, margin: "0 auto 36px" }}
          >{t.sub}</motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
          >
            <Link href="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              padding: "16px 36px", borderRadius: 14,
              background: `linear-gradient(135deg, ${TEAL}, ${GREEN})`,
              color: "#fff", fontFamily: "'Cairo', sans-serif",
              fontSize: 16, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 6px 24px rgba(0,201,177,0.35)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 32px rgba(0,201,177,0.45)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(0,201,177,0.35)";
            }}
            >
              ✨ {t.cta}
            </Link>
            <span style={{ color: MUTED, fontSize: 12 }}>{t.ctaSub}</span>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {t.stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: "24px 16px", textAlign: "center",
              }}
            >
              <div style={{
                fontSize: "clamp(22px,3vw,32px)", fontWeight: 900, margin: "0 0 6px",
                backgroundImage: `linear-gradient(135deg, ${TEAL}, ${GREEN})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>{s.value}</div>
              <div style={{ color: MUTED, fontSize: 12, fontWeight: 600 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 70px" }}>
        <motion.h2
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ color: TEXT, fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, textAlign: "center", margin: "0 0 40px" }}
        >
          {t.howTitle}
        </motion.h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {t.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 18, padding: "28px 24px",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 12, [ar ? "left" : "right"]: 16,
                fontSize: 40, fontWeight: 900, color: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
              }}>
                {i + 1}
              </div>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: `linear-gradient(135deg, rgba(0,201,177,0.15), rgba(0,210,106,0.1))`,
                border: "1px solid rgba(0,201,177,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, marginBottom: 16,
              }}>
                {step.icon}
              </div>
              <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>{step.title}</h3>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Who can join ── */}
      <section style={{
        maxWidth: 1100, margin: "0 auto", padding: "0 24px 70px",
      }}>
        <motion.h2
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: TEXT, fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, textAlign: "center", margin: "0 0 32px" }}
        >
          {t.typesTitle}
        </motion.h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
          {t.types.map((type, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * i }}
              style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 14, padding: "14px 22px",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 14, color: TEXT, fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 20 }}>{type.icon}</span>
              {type.label}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 70px" }}>
        <motion.h2
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ color: TEXT, fontSize: "clamp(22px,3vw,34px)", fontWeight: 800, textAlign: "center", margin: "0 0 40px" }}
        >
          {t.benefitsTitle}
        </motion.h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {t.benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * i }}
              style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: "24px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: dark ? "rgba(255,184,0,0.1)" : "rgba(255,184,0,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>{b.icon}</div>
              <div>
                <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 6px" }}>{b.title}</h3>
                <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{b.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ maxWidth: 700, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: dark
              ? `linear-gradient(135deg, rgba(0,201,177,0.08), rgba(0,210,106,0.06))`
              : `linear-gradient(135deg, rgba(0,201,177,0.06), rgba(0,210,106,0.04))`,
            border: "1px solid rgba(0,201,177,0.25)",
            borderRadius: 24, padding: "52px 40px",
          }}
        >
          <div style={{ fontSize: 42, marginBottom: 16 }}>🚀</div>
          <h2 style={{ color: TEXT, fontSize: "clamp(22px,4vw,36px)", fontWeight: 900, margin: "0 0 12px" }}>{t.finalCta}</h2>
          <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.8, margin: "0 0 32px" }}>{t.finalCtaSub}</p>
          <Link href="/register" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "16px 40px", borderRadius: 14,
            background: `linear-gradient(135deg, ${TEAL}, ${GREEN})`,
            color: "#fff", fontFamily: "'Cairo', sans-serif",
            fontSize: 16, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 6px 24px rgba(0,201,177,0.35)",
          }}>
            ✨ {t.finalBtn}
          </Link>
        </motion.div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          section > div[style*="grid-template-columns: repeat(4, 1fr)"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
