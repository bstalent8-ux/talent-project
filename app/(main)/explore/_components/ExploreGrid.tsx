"use client";
import { motion } from "framer-motion";
import { Star, MapPin, BadgeCheck, Zap, Crown, Send } from "lucide-react";
import Link from "next/link";
import type { TalentCard } from "../page";

const GRAD_COLORS = [
  ["#1e3a5f", "#0d2137"],
  ["#2a1a3a", "#1a0d2a"],
  ["#1a2a1a", "#0d1a0d"],
  ["#3a1a1a", "#2a0d0d"],
  ["#1a1a3a", "#0d0d2a"],
  ["#2a2a1a", "#1a1a0d"],
];

interface Props {
  dark: boolean;
  lang: "ar" | "en";
  talents: TalentCard[];
  myRole?: string | null;
  myId?: string | null;
  onSendBrief?: (talent: TalentCard) => void;
}

function TalentCardItem({ talent, dark, lang, index, myRole, onSendBrief }: { talent: TalentCard; dark: boolean; lang: "ar" | "en"; index: number; myRole?: string | null; onSendBrief?: (t: TalentCard) => void }) {
  const CARD    = dark ? "#0D1623" : "#FFFFFF";
  const BORDER  = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT    = dark ? "#FFFFFF" : "#0F172A";
  const MUTED   = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const GREEN   = "#00D26A";
  const GOLD    = "#F4B740";

  const [g0, g1] = GRAD_COLORS[index % GRAD_COLORS.length];
  const initial  = talent.name.charAt(0).toUpperCase();

  return (
    <motion.div
      suppressHydrationWarning
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
      }}
    >
      <Link href={`/talent/${talent.handle}`} style={{ textDecoration: "none", display: "block" }}>

        {/* Square photo */}
        <div style={{
          width: "100%",
          paddingTop: "100%",
          position: "relative",
          background: talent.avatar_url
            ? `url(${talent.avatar_url}) center/cover no-repeat`
            : `linear-gradient(160deg, ${g0}, ${g1})`,
        }}>
          {!talent.avatar_url && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontSize: 52, fontWeight: 900, color: "rgba(255,255,255,0.15)",
                fontFamily: "'Cairo',sans-serif",
              }}>{initial}</span>
            </div>
          )}

          {/* Badges overlay */}
          <div style={{
            position: "absolute", top: 10,
            ...(lang === "ar" ? { right: 10 } : { left: 10 }),
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            {talent.premium && (
              <span style={{
                display: "flex", alignItems: "center", gap: 4,
                backgroundColor: "rgba(244,183,64,0.9)", color: "#000",
                fontSize: 10, fontWeight: 800, padding: "3px 8px",
                borderRadius: 6,
              }}>
                <Crown size={9} />بريميوم
              </span>
            )}
            {talent.fast_response && (
              <span style={{
                display: "flex", alignItems: "center", gap: 4,
                backgroundColor: "rgba(0,0,0,0.7)", color: GREEN,
                fontSize: 10, fontWeight: 700, padding: "3px 8px",
                borderRadius: 6, border: "1px solid rgba(0,210,106,0.3)",
              }}>
                <Zap size={9} />{lang === "ar" ? "رد سريع" : "Fast Reply"}
              </span>
            )}
          </div>

          {/* Rating chip bottom left */}
          {talent.rating > 0 && (
            <div style={{
              position: "absolute", bottom: 10,
              ...(lang === "ar" ? { left: 10 } : { right: 10 }),
              display: "flex", alignItems: "center", gap: 4,
              backgroundColor: "rgba(0,0,0,0.75)",
              borderRadius: 8, padding: "4px 8px",
            }}>
              <Star size={11} color={GOLD} fill={GOLD} />
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>
                {talent.rating.toFixed(1)}
              </span>
              <span style={{ color: MUTED, fontSize: 10 }}>({talent.review_count})</span>
            </div>
          )}
        </div>

        {/* Card body */}
        <div style={{ padding: "14px 14px 16px" }}>

          {/* Name + verified */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <h3 style={{
              color: TEXT, fontSize: 14, fontWeight: 800, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1,
            }}>{talent.name}</h3>
            {talent.verified && <BadgeCheck size={15} color={GREEN} />}
          </div>

          {/* Category */}
          {talent.category && (
            <span style={{
              display: "inline-block",
              backgroundColor: dark ? "rgba(0,210,106,0.08)" : "rgba(0,210,106,0.06)",
              color: GREEN, border: `1px solid rgba(0,210,106,0.2)`,
              borderRadius: 20, padding: "2px 10px", fontSize: 11,
              marginBottom: 8, fontWeight: 600,
            }}>{talent.category}</span>
          )}

          {/* Location */}
          {talent.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
              <MapPin size={11} color={MUTED} />
              <span style={{ color: MUTED, fontSize: 11 }}>{talent.location}</span>
            </div>
          )}

          {/* Specialties */}
          {talent.specialties.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {talent.specialties.slice(0, 2).map(s => (
                <span key={s} style={{
                  backgroundColor: dark ? "rgba(244,183,64,0.08)" : "rgba(244,183,64,0.06)",
                  color: GOLD, fontSize: 10, padding: "2px 8px",
                  borderRadius: 20, border: `1px solid rgba(244,183,64,0.2)`,
                }}>{s}</span>
              ))}
            </div>
          )}

          {/* Price + CTA */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: `1px solid ${BORDER}`,
          }}>
            <div>
              <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>
                {lang === "ar" ? "يبدأ من" : "Starting at"}
              </p>
              <p style={{ color: GREEN, fontSize: 16, fontWeight: 900, margin: 0 }}>
                {talent.starting_price
                  ? `${talent.starting_price.toLocaleString()} ${lang === "ar" ? "ج" : "EGP"}`
                  : lang === "ar" ? "تواصل معنا" : "Get Quote"
                }
              </p>
            </div>
            <div style={{ backgroundColor: GREEN, color: "#000", fontSize: 12, fontWeight: 800, padding: "8px 14px", borderRadius: 10 }}>
              {lang === "ar" ? "احجز" : "Book"}
            </div>
          </div>

          {/* Send Brief — brands only */}
          {myRole === "brand" && onSendBrief && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSendBrief(talent); }}
              style={{
                width: "100%", marginTop: 8,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                backgroundColor: "transparent",
                border: `1.5px solid ${GOLD}`,
                color: GOLD, borderRadius: 10,
                padding: "8px 0", fontSize: 12, fontWeight: 800,
                cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${GOLD}15`; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              <Send size={12} />
              {lang === "ar" ? "إرسال ملخص" : "Send Brief"}
            </button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default function ExploreGrid({ dark, lang, talents, myRole, myId, onSendBrief }: Props) {
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const GREEN = "#00D26A";

  if (talents.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center", gap: 12 }}>
        <span style={{ fontSize: 48 }}>🔍</span>
        <p style={{ color: MUTED, fontSize: 16, margin: 0 }}>
          {lang === "ar" ? "لا توجد نتائج مطابقة للفلاتر المختارة" : "No talents match your filters"}
        </p>
        <p style={{ color: GREEN, fontSize: 13, margin: 0 }}>
          {lang === "ar" ? "جرّب تغيير الفلاتر أو إعادة الضبط" : "Try adjusting your filters"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
      {talents.map((talent, i) => (
        <TalentCardItem
          key={talent.id}
          talent={talent}
          dark={dark}
          lang={lang}
          index={i}
          myRole={myRole}
          onSendBrief={onSendBrief}
        />
      ))}
    </div>
  );
}
