"use client";
import { motion } from "framer-motion";
import { MapPin, Star, Eye, Shield, Zap, Crown, Heart, Share2, MessageCircle, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { TalentData } from "@/features/talent-profile/types";

const btn: React.CSSProperties = {
  cursor: "pointer", fontFamily: "'Cairo',sans-serif",
  border: "none", outline: "none",
};

export default function ProfileHero({ talent }: { talent: TalentData }) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const t = {
    verified: ar ? "موثّق" : "Verified",
    fastResponse: ar ? "رد سريع" : "Fast Response",
    premium: ar ? "بريميوم" : "Premium",
    memberSince: ar ? "عضو منذ" : "Member since",
    reviews: ar ? "تقييم" : "reviews",
    views: ar ? "مشاهدة" : "views",
    message: ar ? "رسالة" : "Message",
    bookNow: ar ? "احجز الآن" : "Book Now",
    favorite: ar ? "المفضلة" : "Favorite",
    share: ar ? "مشاركة" : "Share",
    escrowTitle: ar ? "نظام الدفع الآمن (Escrow)" : "Secure Payment System (Escrow)",
    escrowSteps: ar
      ? ["الدفع محجوز", "تسليم العمل", "الموافقة", "الإفراج عن الأموال"]
      : ["Payment Held", "Work Delivery", "Approval", "Fund Release"],
  };
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const GOLD = "#F4B740";
  const TEXT = dark ? "#FFFFFF" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";

  const displayName = talent.name.includes("@")
    ? talent.handle || talent.name.split("@")[0]
    : talent.name;

  const tags = talent.specialties?.length
    ? talent.specialties.slice(0, 3)
    : talent.category
      ? [talent.category]
      : [];

  const badges = [
    talent.verified    && { icon: <Shield size={11} />, label: t.verified },
    talent.fastResponse && { icon: <Zap size={11} />,    label: t.fastResponse },
    talent.premium      && { icon: <Crown size={11} />,  label: t.premium },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  return (
    <div style={{
      backgroundColor: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: isMobile ? 16 : 24,
      marginBottom: 24, overflow: "hidden",
    }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "200px 1fr 320px",
        gap: isMobile ? 20 : 24,
        alignItems: "start",
      }}>

        {/* ─── Col 1: Avatar / Image ─── */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: "100%",
            maxWidth: isMobile ? "100%" : 200,
            height: isMobile ? 220 : 260,
            borderRadius: 14,
            overflow: "hidden",
            background: dark
              ? "linear-gradient(160deg,#1e3a5f,#0d2137,#050B12)"
              : "linear-gradient(160deg,#dbeafe,#bfdbfe,#93c5fd)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            border: `1px solid ${BORDER}`,
          }}>
            {talent.avatarUrl ? (
              <img
                src={talent.avatarUrl}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                backgroundColor: "rgba(0,210,106,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, fontWeight: 900, color: GREEN,
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* ─── Col 2: Info ─── */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 10,
          minWidth: 0, /* critical — allows text to truncate in grid */
          overflow: "hidden",
        }}>
          {/* Name + badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
            <h1 style={{
              color: TEXT, fontSize: isMobile ? 20 : 24, fontWeight: 900, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: "100%", flex: "1 1 0", minWidth: 0,
            }}>
              {displayName}
            </h1>
            <span style={{
              backgroundColor: "rgba(244,183,64,0.15)", color: GOLD,
              border: "1px solid rgba(244,183,64,0.3)",
              borderRadius: 20, padding: "3px 12px",
              fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", gap: 4,
              flexShrink: 0,
            }}>
              <Crown size={11} />Gold Model
            </span>
          </div>

          {/* Specialties tags */}
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tags.map(tag => (
                <span key={tag} style={{
                  backgroundColor: "rgba(0,210,106,0.08)", color: GREEN,
                  border: "1px solid rgba(0,210,106,0.2)",
                  borderRadius: 20, padding: "3px 12px", fontSize: 12,
                  whiteSpace: "nowrap",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Location + since */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, fontSize: 13, flexWrap: "wrap" }}>
            <MapPin size={13} color={GREEN} />
            <span>{talent.location}</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>{t.memberSince} {talent.memberSince}</span>
          </div>

          {/* Rating + views */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Star size={14} color={GOLD} fill={GOLD} />
              <span style={{ color: TEXT, fontWeight: 800, fontSize: 14 }}>{talent.rating}</span>
              <span style={{ color: MUTED, fontSize: 12 }}>({talent.reviewCount} {t.reviews})</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: MUTED, fontSize: 12 }}>
              <Eye size={13} />
              <span>{talent.views} {t.views}</span>
            </div>
          </div>

          {/* Verified badges — only if applicable */}
          {badges.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {badges.map(b => (
                <span key={b.label} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  backgroundColor: "rgba(0,210,106,0.08)", color: GREEN,
                  border: "1px solid rgba(0,210,106,0.2)",
                  borderRadius: 20, padding: "3px 12px", fontSize: 12,
                }}>
                  {b.icon}{b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── Col 3: Actions + Escrow ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* CTA buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => window.dispatchEvent(new CustomEvent("open-chat-widget", { detail: { otherUserId: talent.id } }))}
              style={{
                ...btn, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                backgroundColor: SURFACE, border: `1px solid ${BORDER}`,
                color: TEXT, borderRadius: 12, padding: "11px 0",
                fontSize: 13, fontWeight: 600,
              }}>
              <MessageCircle size={14} color={GREEN} />{t.message}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{
              ...btn, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              backgroundColor: GREEN, color: "#000",
              borderRadius: 12, padding: "11px 0",
              fontSize: 13, fontWeight: 900,
            }}>
              <Calendar size={14} />{t.bookNow}
            </motion.button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <motion.button whileHover={{ scale: 1.02 }} style={{
              ...btn, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              backgroundColor: SURFACE, border: `1px solid ${BORDER}`,
              color: MUTED, borderRadius: 12, padding: "9px 0", fontSize: 13,
            }}>
              <Heart size={13} />{t.favorite}
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} style={{
              ...btn, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              backgroundColor: SURFACE, border: `1px solid ${BORDER}`,
              color: MUTED, borderRadius: 12, padding: "9px 0", fontSize: 13,
            }}>
              <Share2 size={13} />{t.share}
            </motion.button>
          </div>

          {/* Escrow flow */}
          <div style={{
            backgroundColor: SURFACE, border: `1px solid ${BORDER}`,
            borderRadius: 14, padding: 16, flex: 1,
          }}>
            <p style={{
              color: MUTED, fontSize: 10, fontWeight: 700,
              marginBottom: 12, letterSpacing: 0.8, margin: "0 0 12px",
            }}>
              {t.escrowTitle}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {t.escrowSteps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: i === 0 ? GREEN : "rgba(0,210,106,0.1)",
                    border: i === 0 ? "none" : "1px solid rgba(0,210,106,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    color: i === 0 ? "#000" : GREEN,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{
                    fontSize: 12, color: i === 0 ? TEXT : MUTED,
                    fontWeight: i === 0 ? 700 : 400,
                  }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
