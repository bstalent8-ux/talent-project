"use client";
import { motion } from "framer-motion";
import { MapPin, BadgeCheck, Users, MessageCircle } from "lucide-react";
import type { BrandCard } from "../page";

const GRAD_COLORS = [
  ["#1e3a5f", "#0d2137"],
  ["#2a1a3a", "#1a0d2a"],
  ["#3a2a1a", "#2a1a0d"],
  ["#1a3a2a", "#0d2a1a"],
  ["#2a1a3a", "#1a0d2a"],
  ["#1a2a3a", "#0d1a2a"],
];

const INDUSTRY_ICONS: Record<string, string> = {
  fashion: "👗",
  food:    "🍔",
  tech:    "💻",
  beauty:  "💄",
  retail:  "🛍️",
  media:   "📺",
};

interface Props {
  dark: boolean;
  lang: "ar" | "en";
  brands: BrandCard[];
}

function BrandCardItem({ brand, dark, lang, index }: { brand: BrandCard; dark: boolean; lang: "ar" | "en"; index: number }) {
  const ar     = lang === "ar";
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const GREEN  = "#00D26A";
  const GOLD   = "#F4B740";

  const [g0, g1] = GRAD_COLORS[index % GRAD_COLORS.length];
  const initial  = brand.name.charAt(0).toUpperCase();
  const industryIcon = brand.industry ? INDUSTRY_ICONS[brand.industry] : "🏢";

  const INDUSTRY_LABELS: Record<string, { ar: string; en: string }> = {
    fashion: { ar: "أزياء", en: "Fashion" },
    food:    { ar: "طعام", en: "Food" },
    tech:    { ar: "تكنولوجيا", en: "Tech" },
    beauty:  { ar: "جمال", en: "Beauty" },
    retail:  { ar: "تجزئة", en: "Retail" },
    media:   { ar: "إعلام", en: "Media" },
  };

  const industryLabel = brand.industry
    ? (ar ? INDUSTRY_LABELS[brand.industry]?.ar : INDUSTRY_LABELS[brand.industry]?.en) ?? brand.industry
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={{ y: -4, boxShadow: dark ? "0 8px 32px rgba(0,210,106,0.12)" : "0 8px 24px rgba(0,0,0,0.1)" }}
      style={{
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.2s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Square logo area */}
      <div style={{
        width: "100%",
        paddingTop: "75%",
        position: "relative",
        background: brand.avatar_url
          ? `url(${brand.avatar_url}) center/cover no-repeat`
          : `linear-gradient(160deg, ${g0}, ${g1})`,
      }}>
        {!brand.avatar_url && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 8,
          }}>
            <span style={{ fontSize: 40 }}>{industryIcon}</span>
            <span style={{
              fontSize: 36, fontWeight: 900, color: "rgba(255,255,255,0.15)",
              fontFamily: "'Cairo',sans-serif",
            }}>{initial}</span>
          </div>
        )}

        {/* Verified badge */}
        {brand.verified && (
          <div style={{
            position: "absolute", top: 10,
            ...(ar ? { right: 10 } : { left: 10 }),
            display: "flex", alignItems: "center", gap: 4,
            backgroundColor: "rgba(0,210,106,0.9)", color: "#000",
            fontSize: 10, fontWeight: 800, padding: "3px 8px",
            borderRadius: 6,
          }}>
            <BadgeCheck size={10} />{ar ? "موثّق" : "Verified"}
          </div>
        )}

        {/* Industry chip */}
        {industryLabel && (
          <div style={{
            position: "absolute", bottom: 10,
            ...(ar ? { left: 10 } : { right: 10 }),
            backgroundColor: "rgba(0,0,0,0.75)",
            borderRadius: 8, padding: "4px 8px",
            fontSize: 11, color: GOLD, fontWeight: 700,
          }}>
            {industryIcon} {industryLabel}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <h3 style={{
            color: TEXT, fontSize: 14, fontWeight: 800, margin: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
          }}>{brand.name}</h3>
          {brand.verified && <BadgeCheck size={14} color={GREEN} />}
        </div>

        {/* Location */}
        {brand.city && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <MapPin size={11} color={MUTED} />
            <span style={{ color: MUTED, fontSize: 11 }}>{brand.city}</span>
          </div>
        )}

        {/* Bio */}
        {brand.bio && (
          <p style={{
            color: MUTED, fontSize: 12, margin: "0 0 10px",
            lineHeight: 1.5, flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>{brand.bio}</p>
        )}

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          borderTop: `1px solid ${BORDER}`,
          marginTop: "auto",
        }}>
          {/* Collab count */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Users size={13} color={GREEN} />
            <span style={{ color: TEXT, fontSize: 12, fontWeight: 700 }}>
              {brand.collab_count}
            </span>
            <span style={{ color: MUTED, fontSize: 11 }}>
              {ar ? "تعاون" : "collabs"}
            </span>
          </div>

          {/* Message CTA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { otherUserId: brand.id } }));
            }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              backgroundColor: SURFACE,
              border: `1px solid ${BORDER}`,
              color: TEXT, borderRadius: 8,
              padding: "6px 12px", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "'Cairo',sans-serif",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT; }}
          >
            <MessageCircle size={12} color={GREEN} />
            {ar ? "تواصل" : "Message"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function BrandsGrid({ dark, lang, brands }: Props) {
  const ar    = lang === "ar";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const GREEN = "#00D26A";

  if (brands.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 24px", textAlign: "center", gap: 12,
      }}>
        <span style={{ fontSize: 48 }}>🏢</span>
        <p style={{ color: MUTED, fontSize: 16, margin: 0 }}>
          {ar ? "لا توجد براندات مطابقة" : "No brands match your filters"}
        </p>
        <p style={{ color: GREEN, fontSize: 13, margin: 0 }}>
          {ar ? "جرّب تغيير الفلاتر" : "Try adjusting your filters"}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 20,
    }}>
      {brands.map((brand, i) => (
        <BrandCardItem
          key={brand.id}
          brand={brand}
          dark={dark}
          lang={lang}
          index={i}
        />
      ))}
    </div>
  );
}
