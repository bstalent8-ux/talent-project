"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, Star, BadgeCheck } from "lucide-react";
import type { TalentCard } from "../../explore/page";

interface Props { dark: boolean; lang: "ar" | "en"; talents: TalentCard[] }

const TX = {
  ar: { tag: "مواهب مميزة", heading: "أفضل المواهب على المنصة", sub: "اكتشف أعلى المواهب تقييماً وابدأ التعاون اليوم.", viewAll: "عرض كل المواهب", book: "احجز الآن", from: "يبدأ من", negotiable: "يُتفق عليه" },
  en: { tag: "Featured", heading: "Top Talents on the Platform", sub: "Discover our highest-rated talents and start collaborating today.", viewAll: "View All Talents", book: "Book Now", from: "From", negotiable: "Negotiable" },
};

function TalentCard({ talent, dark, lang, index }: { talent: TalentCard; dark: boolean; lang: "ar" | "en"; index: number }) {
  const ar    = lang === "ar";
  const GREEN = "#00D26A";
  const GOLD  = "#FFB800";
  const CARD  = dark ? "#0D1623" : "#ffffff";
  const BORDER = dark ? "rgba(0,255,163,0.12)" : "#e2e8f0";
  const TEXT  = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#64748b" : "#94a3b8";
  const t     = TX[lang];

  const initials = talent.name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <motion.div
      suppressHydrationWarning
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.07 }}
      whileHover={{ y: -4, boxShadow: dark ? "0 12px 40px rgba(0,210,106,0.12)" : "0 12px 32px rgba(0,0,0,0.1)" }}
      style={{
        backgroundColor: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 18, overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "box-shadow 0.25s",
        direction: ar ? "rtl" : "ltr",
      }}
    >
      {/* Avatar banner */}
      <div style={{
        height: 120, position: "relative",
        background: dark
          ? `linear-gradient(135deg, #0a1628 0%, #111c35 100%)`
          : `linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {talent.premium && (
          <span style={{
            position: "absolute", top: 10, left: ar ? "auto" : 10, right: ar ? 10 : "auto",
            backgroundColor: GOLD, color: "#000",
            fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 6,
            fontFamily: "'Cairo', sans-serif",
          }}>
            ⭐ {ar ? "مميز" : "Premium"}
          </span>
        )}
        <div style={{
          width: 70, height: 70, borderRadius: "50%",
          border: `3px solid ${GREEN}`,
          overflow: "hidden", backgroundColor: dark ? "#1e293b" : "#e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 900, color: MUTED,
        }}>
          {talent.avatar_url
            ? <img src={talent.avatar_url} alt={talent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ color: TEXT, fontSize: 15, fontWeight: 800, fontFamily: "'Cairo', sans-serif" }}>{talent.name}</span>
            {talent.verified && <BadgeCheck size={14} color={GREEN} />}
          </div>
          {talent.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={11} color={MUTED} />
              <span style={{ color: MUTED, fontSize: 11, fontFamily: "'Cairo', sans-serif" }}>{talent.location}</span>
            </div>
          )}
        </div>

        {talent.category && (
          <span style={{
            display: "inline-block", alignSelf: "flex-start",
            backgroundColor: dark ? "rgba(0,210,106,0.08)" : "rgba(0,210,106,0.06)",
            border: `1px solid rgba(0,210,106,0.2)`,
            color: GREEN, borderRadius: 20, padding: "3px 10px",
            fontSize: 11, fontWeight: 600, fontFamily: "'Cairo', sans-serif",
          }}>
            {talent.category}
          </span>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Star size={13} color={GOLD} fill={GOLD} />
            <span style={{ color: TEXT, fontSize: 13, fontWeight: 700, fontFamily: "'Cairo', sans-serif" }}>
              {talent.rating.toFixed(1)}
            </span>
            <span style={{ color: MUTED, fontSize: 11, fontFamily: "'Cairo', sans-serif" }}>
              ({talent.review_count})
            </span>
          </div>
          <span style={{ color: MUTED, fontSize: 11, fontFamily: "'Cairo', sans-serif" }}>
            {talent.starting_price
              ? `${t.from} ${talent.starting_price.toLocaleString()} EGP`
              : t.negotiable}
          </span>
        </div>

        <Link href={`/talent/${talent.handle}`} style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          marginTop: 4,
          backgroundColor: GREEN, color: "#000",
          border: "none", borderRadius: 10, padding: "10px 0",
          fontSize: 13, fontWeight: 900, cursor: "pointer",
          fontFamily: "'Cairo', sans-serif", textDecoration: "none",
          transition: "opacity 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          {t.book}
        </Link>
      </div>
    </motion.div>
  );
}

export default function FeaturedTalents({ dark, lang, talents }: Props) {
  const t     = TX[lang];
  const ar    = lang === "ar";
  const GREEN = "#00D26A";
  const BG    = dark ? "#050B12" : "#f1f5f9";
  const TEXT  = dark ? "#f1f5f9" : "#0f172a";
  const MUTED = dark ? "#64748b" : "#94a3b8";

  if (!talents.length) return null;

  return (
    <section style={{
      backgroundColor: BG, padding: "80px 24px 90px",
      direction: ar ? "rtl" : "ltr", fontFamily: "'Cairo', sans-serif",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <span style={{
            display: "inline-block", marginBottom: 12,
            backgroundColor: dark ? "rgba(255,184,0,0.1)" : "rgba(255,184,0,0.08)",
            border: `1px solid rgba(255,184,0,0.2)`,
            borderRadius: 100, padding: "4px 16px",
            color: "#FFB800", fontSize: 11, fontWeight: 700, letterSpacing: 1,
            textTransform: "uppercase",
          }}>
            {t.tag}
          </span>
          <h2 style={{ color: TEXT, fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 900, margin: "0 0 12px" }}>
            {t.heading}
          </h2>
          <p style={{ color: MUTED, fontSize: 14, maxWidth: 480, margin: "0 auto" }}>{t.sub}</p>
        </motion.div>

        {/* Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 44 }}>
          {talents.map((talent, i) => (
            <TalentCard key={talent.id} talent={talent} dark={dark} lang={lang} index={i} />
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Link href="/explore" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            backgroundColor: "transparent",
            border: `1.5px solid ${GREEN}`,
            color: GREEN, padding: "12px 32px", borderRadius: 12,
            fontWeight: 700, fontSize: 14,
            textDecoration: "none", fontFamily: "'Cairo', sans-serif",
            transition: "background-color 0.2s, color 0.2s",
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = GREEN; e.currentTarget.style.color = "#000"; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = GREEN; }}
          >
            {t.viewAll} {ar ? "←" : "→"}
          </Link>
        </div>
      </div>
    </section>
  );
}
