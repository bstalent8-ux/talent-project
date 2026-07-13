"use client";

import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";
import ContactForm from "@/components/contact/ContactForm";
import WhatsAppButton from "@/components/contact/WhatsAppButton";

const TX = {
  ar: {
    badge:    "تواصل معنا",
    title:    "نحن هنا",
    titleGreen: "لمساعدتك",
    sub:      "سواء كنت براند أو موهبة أو مجرد مهتم، نحب أن نسمع منك.",
    formTitle: "أرسل لنا رسالة",
    orTitle:   "أو تواصل معنا مباشرة",
    email:     "📧 hello@talents.com",
    waTitle:   "واتساب",
    waSub:     "رد سريع خلال ساعات العمل",
    infoCards: [
      { icon: "⚡", title: "رد سريع", body: "نرد على رسائلكم خلال 24 ساعة في أيام العمل." },
      { icon: "🌍", title: "دعم ثنائي اللغة", body: "فريق دعمنا يتحدث العربية والإنجليزية بطلاقة." },
      { icon: "🔒", title: "معلومات آمنة", body: "بياناتك محمية ولن تُشارك مع أي طرف خارجي." },
    ],
  },
  en: {
    badge:    "Contact Us",
    title:    "We're Here",
    titleGreen: "to Help You",
    sub:      "Whether you're a brand, a talent, or simply curious — we'd love to hear from you.",
    formTitle: "Send Us a Message",
    orTitle:   "Or Reach Us Directly",
    email:     "📧 hello@talents.com",
    waTitle:   "WhatsApp",
    waSub:     "Quick response during business hours",
    infoCards: [
      { icon: "⚡", title: "Fast Response", body: "We reply to all messages within 24 hours on business days." },
      { icon: "🌍", title: "Bilingual Support", body: "Our support team speaks both Arabic and English fluently." },
      { icon: "🔒", title: "Private & Secure", body: "Your data is protected and never shared with third parties." },
    ],
  },
};

export default function ContactClient() {
  const { lang, dark } = useSite();
  const t  = TX[lang];
  const ar = lang === "ar";

  const BG     = dark ? "#060d18" : "#f8fafc";
  const CARD   = dark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const BORDER = dark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const TEXT   = dark ? "#f1f5f9" : "#0f172a";
  const MUTED  = dark ? "#64748b" : "#94a3b8";
  const GREEN  = "#00D26A";

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ background: BG, minHeight: "100vh", fontFamily: "'Cairo', sans-serif" }}>

      {/* ── Hero ── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "90px 24px 60px", textAlign: "center" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: dark
            ? `radial-gradient(ellipse 70% 55% at 50% 0%, rgba(0,210,106,0.09) 0%, transparent 70%), #060d18`
            : `radial-gradient(ellipse 70% 55% at 50% 0%, rgba(0,210,106,0.06) 0%, transparent 70%), #f8fafc`,
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto" }}>
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "inline-block", marginBottom: 18,
              background: dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.08)",
              border: "1px solid rgba(0,210,106,0.25)",
              borderRadius: 100, padding: "4px 16px",
              color: GREEN, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
            }}
          >
            {t.badge}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 900, color: TEXT, margin: "0 0 16px" }}
          >
            {t.title}{" "}
            <span style={{ color: GREEN }}>{t.titleGreen}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ color: MUTED, fontSize: 16, lineHeight: 1.8, margin: 0 }}
          >
            {t.sub}
          </motion.p>
        </div>
      </section>

      {/* ── Info cards ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {t.infoCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              style={{
                background: CARD, border: `1px solid ${BORDER}`,
                borderRadius: 16, padding: "24px",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(0,210,106,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                {card.icon}
              </div>
              <div>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{card.title}</p>
                <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{card.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Main content ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>

          {/* Form */}
          <div>
            <h2 style={{ color: TEXT, fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>{t.formTitle}</h2>
            <ContactForm />
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ color: TEXT, fontSize: 20, fontWeight: 700, margin: 0 }}>{t.orTitle}</h2>

            {/* Email */}
            <div style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 16, padding: "22px 24px",
            }}>
              <p style={{ color: TEXT, fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>📧 Email</p>
              <a
                href="mailto:hello@talents.com"
                style={{ color: GREEN, fontSize: 14, textDecoration: "none", fontWeight: 600 }}
              >
                hello@talents.com
              </a>
            </div>

            {/* WhatsApp */}
            <div style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 16, padding: "22px 24px",
            }}>
              <p style={{ color: TEXT, fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>💬 {t.waTitle}</p>
              <p style={{ color: MUTED, fontSize: 13, margin: "0 0 16px" }}>{t.waSub}</p>
              <WhatsAppButton />
            </div>

            {/* Decoration */}
            <div style={{
              background: dark
                ? "linear-gradient(135deg, rgba(0,210,106,0.08), rgba(0,201,177,0.06))"
                : "linear-gradient(135deg, rgba(0,210,106,0.06), rgba(0,201,177,0.04))",
              border: "1px solid rgba(0,210,106,0.2)",
              borderRadius: 16, padding: "24px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🌟</div>
              <p style={{ color: GREEN, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>
                {ar ? "منصة موثوقة" : "Trusted Platform"}
              </p>
              <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.7, margin: 0 }}>
                {ar
                  ? "أكثر من 1000 موهبة وبراند يثقون بنا"
                  : "Over 1,000 talents & brands trust us"}
              </p>
            </div>
          </div>
        </div>

        {/* Mobile responsive */}
        <style>{`
          @media (max-width: 768px) {
            section > div[style*="grid-template-columns: 1fr 380px"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>
    </div>
  );
}
