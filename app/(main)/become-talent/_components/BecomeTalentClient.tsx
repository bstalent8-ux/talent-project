"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";

const TX = {
  ar: {
    badge:       "انضم كموهبة",
    title:       "حوّل إبداعك",
    titleAccent: "إلى مصدر دخل حقيقي",
    sub:         "انضم كموهبة UGC أو موديل، واعرض أعمالك، وتعاون مع براندات تبحث عن مواهب مثلك.",
    cta:         "ابدأ الآن مجاناً",
    ctaSub:      "لا حاجة لبطاقة ائتمانية",
    howTitle:    "كيف تبدأ؟",
    steps: [
      { icon: "📝", title: "سجّل حسابك", body: "أنشئ حسابك المجاني في أقل من دقيقتين." },
      { icon: "🎨", title: "أضف محفظتك", body: "اعرض أعمالك وخبراتك لجذب البراندات المناسبة." },
      { icon: "💼", title: "تواصل مع البراندات", body: "تلقَّ عروض العمل وابدأ التعاون مباشرة." },
      { icon: "💰", title: "احصل على مستحقاتك", body: "تُحفظ مدفوعات البراند لدى المنصة وتصلك بعد اعتماد الشغل المسلَّم." },
    ],
    benefitsTitle: "لماذا Talents؟",
    benefits: [
      { icon: "🌟", title: "براندات حقيقية", body: "تواصل مع شركات وعلامات تجارية موثوقة تبحث عن مواهب مثلك." },
      { icon: "💸", title: "أنت تحدد أسعارك", body: "أنشئ باقاتك بأسعارك الخاصة، والبراند يشوفها بوضوح قبل الحجز." },
      { icon: "🔒", title: "مدفوعات محمية", body: "المنصة تحتفظ بمبلغ المشروع لحد ما الشغل يتسلَّم ويتعتمد." },
      { icon: "📈", title: "نمو مستمر", body: "بناء سمعتك عبر التقييمات وتنمية قاعدة عملائك." },
      { icon: "🌍", title: "فرص أكتر", body: "اظهر لبراندات تبحث عن مواهب في السوق المصري والعربي." },
      { icon: "🤝", title: "مجتمع داعم", body: "انضم لمجتمع من المبدعين والمحترفين العرب." },
    ],
    typesTitle: "من يمكنه الانضمام؟",
    types: [
      { icon: "📱", label: "UGC Creator" },
      { icon: "📸", label: "Model" },
    ],
    finalCta:    "جاهز للانطلاق؟",
    finalCtaSub: "انضم مجاناً وابدأ رحلتك الإبداعية.",
    finalBtn:    "أنشئ حسابك الآن",
  },
  en: {
    badge:       "Join as a Talent",
    title:       "Turn Your Creativity",
    titleAccent: "into Real Income",
    sub:         "Join as a UGC creator or model, showcase your work, and collaborate with brands looking for talent like you.",
    cta:         "Get Started Free",
    ctaSub:      "No credit card required",
    howTitle:    "How It Works",
    steps: [
      { icon: "📝", title: "Create Your Account", body: "Sign up for free in less than 2 minutes." },
      { icon: "🎨", title: "Build Your Portfolio", body: "Showcase your work and skills to attract the right brands." },
      { icon: "💼", title: "Connect with Brands", body: "Receive job offers and start collaborating directly." },
      { icon: "💰", title: "Get Paid", body: "The brand's payment is held by the platform and released to you once the delivered work is approved." },
    ],
    benefitsTitle: "Why Talents?",
    benefits: [
      { icon: "🌟", title: "Real Brands", body: "Connect with trusted companies and brands actively looking for talents like you." },
      { icon: "💸", title: "You Set Your Rates", body: "Create your own packages and prices — brands see them clearly before booking." },
      { icon: "🔒", title: "Protected Payments", body: "The platform holds the project amount until the work is delivered and approved." },
      { icon: "📈", title: "Continuous Growth", body: "Build your reputation through reviews and grow your client base." },
      { icon: "🌍", title: "More Opportunities", body: "Get discovered by brands looking for talent in the Egyptian and Arab market." },
      { icon: "🤝", title: "Supportive Community", body: "Join a community of Arab creative professionals." },
    ],
    typesTitle: "Who Can Join?",
    types: [
      { icon: "📱", label: "UGC Creator" },
      { icon: "📸", label: "Model" },
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

  const BG     = dark ? "#1B1310" : "#F6F0DD";
  const CARD   = dark ? "rgba(255,255,255,0.04)" : "#FBF7EA";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#E6DCC3";
  const TEXT   = dark ? "#F5EEDB" : "#2B211D";
  const MUTED  = dark ? "#8F8175" : "#8C7D71";
  const TEAL   = "var(--color-primary-text)";
  const GREEN  = "var(--color-primary-text)";
  const GOLD   = "var(--color-accent-strong)";
  const PURPLE = "var(--color-primary-text)";

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ background: BG, minHeight: "100vh", fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "100px 24px 80px", textAlign: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: dark
            ? `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,167,163,0.12) 0%, transparent 65%),
               radial-gradient(ellipse 50% 40% at 80% 100%, rgba(231,165,138,0.08) 0%, transparent 55%),
               #1B1310`
            : `radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,167,163,0.08) 0%, transparent 65%),
               #F5EEDB`,
        }} />
        <div style={{
          position: "absolute", inset: 0, opacity: dark ? 0.025 : 0.04,
          backgroundImage: `linear-gradient(rgba(79,167,163,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(79,167,163,0.7) 1px, transparent 1px)`,
          backgroundSize: "56px 56px",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto" }}>
          <motion.span
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: "inline-block", marginBottom: 20,
              background: "rgba(79,167,163,0.1)", border: "1px solid rgba(79,167,163,0.25)",
              borderRadius: 100, padding: "5px 18px",
              color: TEAL, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
            }}
          >{t.badge}</motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(30px,6vw,60px)", fontWeight: 900, margin: "0 0 20px", lineHeight: 1.15, color: TEXT }}
          >
            {t.title}<br />
            <span style={{ color: TEAL }}>
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
              background: "var(--color-primary)",
              color: "#fff", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
              fontSize: 16, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 6px 24px rgba(79,167,163,0.35)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 32px rgba(79,167,163,0.45)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(79,167,163,0.35)";
            }}
            >
              ✨ {t.cta}
            </Link>
            <span style={{ color: MUTED, fontSize: 12 }}>{t.ctaSub}</span>
          </motion.div>
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
                background: `linear-gradient(135deg, rgba(79,167,163,0.15), rgba(8,127,131,0.1))`,
                border: "1px solid rgba(79,167,163,0.2)",
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
                background: dark ? "rgba(231,165,138,0.1)" : "rgba(231,165,138,0.08)",
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
              ? `linear-gradient(135deg, rgba(79,167,163,0.08), rgba(8,127,131,0.06))`
              : `linear-gradient(135deg, rgba(79,167,163,0.06), rgba(8,127,131,0.04))`,
            border: "1px solid rgba(79,167,163,0.25)",
            borderRadius: 24, padding: "52px 40px",
          }}
        >
          <div style={{ fontSize: 42, marginBottom: 16 }}>🚀</div>
          <h2 style={{ color: TEXT, fontSize: "clamp(22px,4vw,36px)", fontWeight: 900, margin: "0 0 12px" }}>{t.finalCta}</h2>
          <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.8, margin: "0 0 32px" }}>{t.finalCtaSub}</p>
          <Link href="/register" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "16px 40px", borderRadius: 14,
            background: "var(--color-primary)",
            color: "#fff", fontFamily: "'IBM Plex Sans Arabic', sans-serif",
            fontSize: 16, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 6px 24px rgba(79,167,163,0.35)",
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
