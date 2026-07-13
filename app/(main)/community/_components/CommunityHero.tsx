"use client";

interface Props {
  dark: boolean;
  lang: "ar" | "en";
}

const TX = {
  ar: {
    title: "مجتمع",
    brand: "المنصة",
    title2: "Q&A",
    sub: "المساحة الحرة لتبادل الخبرات، طرح الأسئلة، وتواصل المواهب والبراندات لبناء شراكات أقوى.",
    stats1: "+1,200 سؤال",
    stats2: "نصائح حصرية",
    cta: "اطرح سؤالاً الآن",
  },
  en: {
    title: "Platform",
    brand: "Community",
    title2: "Q&A",
    sub: "The free space to share experiences, ask questions, and connect talents and brands to build stronger partnerships.",
    stats1: "+1,200 Questions",
    stats2: "Exclusive Tips",
    cta: "Ask a Question Now",
  }
};

export default function CommunityHero({ dark, lang }: Props) {
  const t = TX[lang];
  const ar = lang === "ar";
  const TEAL = "#00D26A";
  const GOLD = "#FFB800";
  const ORANGE = "#FF6B2B";

  const CARD = dark ? "#090e1a" : "#ffffff";

  return (
    <section style={{
      position: "relative",
      padding: "64px 24px",
      borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
      backgroundColor: CARD,
      overflow: "hidden",
      direction: ar ? "rtl" : "ltr",
    }}>
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none pulse-glow" style={{ background: "rgba(0, 201, 177, 0.12)", filter: "blur(120px)", transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full pointer-events-none" style={{ background: "rgba(139, 47, 201, 0.1)", filter: "blur(100px)", transform: "translate(-20%, 20%)" }} />

      <div style={{
        maxWidth: "1152px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
        position: "relative",
        zIndex: 10,
        alignItems: "flex-start",
      }} className="md:flex-row md:items-center md:justify-between">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1 style={{
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 900,
            margin: 0,
            fontFamily: "'Cairo', sans-serif",
            color: dark ? "#ffffff" : "#0f172a",
          }}>
            {t.title} <span style={{
              background: "linear-gradient(135deg, #00D26A 0%, #FF6B2B 50%, #8B2FC9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 900,
            }}>{t.brand}</span> {t.title2}
          </h1>
          <p style={{
            color: dark ? "#94a3b8" : "#475569",
            fontSize: "clamp(14px, 2vw, 17px)",
            maxWidth: "580px",
            lineHeight: 1.7,
            margin: 0,
            fontFamily: "'Cairo', sans-serif",
          }}>
            {t.sub}
          </p>

          <div style={{
            display: "flex",
            gap: "24px",
            paddingTop: "8px",
            fontSize: "14px",
            color: dark ? "#94a3b8" : "#64748b",
            fontFamily: "'Cairo', sans-serif",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: TEAL }}></span>
              {t.stats1}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: GOLD }}></span>
              {t.stats2}
            </span>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <button style={{
            backgroundColor: ORANGE,
            color: "#ffffff",
            fontWeight: 700,
            padding: "14px 32px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "15px",
            fontFamily: "'Cairo', sans-serif",
            boxShadow: `0 4px 16px ${dark ? "rgba(255, 107, 43, 0.25)" : "rgba(255, 107, 43, 0.15)"}`,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(255, 107, 43, 0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 16px ${dark ? "rgba(255, 107, 43, 0.25)" : "rgba(255, 107, 43, 0.15)"}`; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: "20px", height: "20px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t.cta}
          </button>
        </div>
      </div>
    </section>
  );
}