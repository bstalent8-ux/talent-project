"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Eye, Shield, Zap, Crown, Heart, Share2, MessageCircle, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { TalentData } from "@/features/talent-profile/types";
import { formatAvailabilitySummary } from "@/lib/availability-schedule";
import { cdnImage } from "@/lib/images";
import DirectBriefModal from "@/components/DirectBriefModal";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { FIELD_LABELS as MODEL_FIELD_LABELS, FIELD_ORDER as MODEL_FIELD_ORDER } from "./MeasurementsSection";

const btn: React.CSSProperties = {
  cursor: "pointer", fontFamily: "'Cairo',sans-serif",
  border: "none", outline: "none",
};

export default function ProfileHero({ talent }: { talent: TalentData }) {
  const [showBooking, setShowBooking] = useState(false);
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

  const [shareCopied, setShareCopied] = useState(false);

  const availabilitySummary = formatAvailabilitySummary(talent.availability, talent.availabilitySchedule, lang);

  const displayName = talent.name.includes("@")
    ? talent.handle || talent.name.split("@")[0]
    : talent.name;

  // No share endpoint needed — the profile URL itself is the shareable link.
  // Falls back to clipboard copy wherever the Web Share API isn't available
  // (most desktop browsers).
  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: displayName, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // Share sheet dismissed or clipboard denied — nothing to surface.
    }
  }

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

  const isModel = talent.category === "model";

  // ─── Model hero — large 3:4 portrait + identity, current design-system
  // tokens (var(--color-primary) teal / var(--color-secondary) gold), not
  // this file's legacy hardcoded GREEN/GOLD which the UGC branch below keeps
  // using untouched. Reuses every value computed above; renders none of its
  // own new data. Booking modal is shared with the UGC branch (same
  // `showBooking` state, same DirectBriefModal render below).
  if (isModel) {
    const TEAL   = "var(--color-primary)";
    const MGOLD  = "var(--color-secondary)";
    const MCARD  = "var(--bg-card)";
    const MBORDER= "var(--border-subtle)";
    const MTEXT  = "var(--text-primary)";
    const MMUTED = "var(--text-muted)";

    return (
      <>
        <div style={{
          backgroundColor: MCARD, border: `1px solid ${MBORDER}`,
          borderRadius: 16, padding: isMobile ? 16 : 24,
          marginBottom: 24, overflow: "hidden",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "360px 1fr",
            gap: isMobile ? 20 : 32,
            alignItems: "start",
          }}>
            {/* Portrait */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: "100%", aspectRatio: "3 / 4", borderRadius: 14, overflow: "hidden",
                background: dark
                  ? "linear-gradient(160deg,#111C35,#0D1623,#050B12)"
                  : "linear-gradient(160deg,#FFFFFF,#E2E8F0,#CBD5E1)",
                border: `1px solid ${MBORDER}`, position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {talent.avatarUrl ? (
                  <img
                    src={cdnImage(talent.avatarUrl, 480)}
                    alt={displayName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{
                    width: 84, height: 84, borderRadius: "50%",
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 40, fontWeight: 900, color: TEAL,
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                {talent.verified && (
                  <span style={{
                    position: "absolute", top: 12, insetInlineStart: 12,
                    display: "flex", alignItems: "center", gap: 4,
                    backgroundColor: "rgba(5,11,18,0.72)", color: "#fff",
                    border: `1px solid ${TEAL}`, borderRadius: 20,
                    padding: "4px 10px", fontSize: 11, fontWeight: 700,
                  }}>
                    <Shield size={11} color={TEAL} />{t.verified}
                  </span>
                )}
              </div>
            </div>

            {/* Identity */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
              <span style={{
                alignSelf: "flex-start",
                backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                color: TEAL, border: `1px solid ${TEAL}`, borderRadius: 20,
                padding: "3px 12px", fontSize: 12, fontWeight: 800,
              }}>
                {ar ? "موديل" : "Model"}
              </span>

              <h1 style={{
                color: MTEXT, fontSize: isMobile ? 22 : 28, fontWeight: 900, margin: 0,
                overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {displayName}
              </h1>

              <div style={{ display: "flex", alignItems: "center", gap: 6, color: MMUTED, fontSize: 13, flexWrap: "wrap" }}>
                <MapPin size={13} color={TEAL} />
                <span>{talent.location}</span>
              </div>

              {talent.bio && (
                <p style={{ color: MMUTED, fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>
                  {talent.bio}
                </p>
              )}

              {availabilitySummary && (
                <span style={{
                  alignSelf: "flex-start",
                  display: "flex", alignItems: "center", gap: 5,
                  backgroundColor: talent.availability === "available"
                    ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                    : "rgba(148,163,184,0.12)",
                  color: talent.availability === "available" ? TEAL : MMUTED,
                  border: `1px solid ${talent.availability === "available" ? TEAL : MBORDER}`,
                  borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600,
                }}>
                  {availabilitySummary}
                </span>
              )}

              {(() => {
                const entries = MODEL_FIELD_ORDER.filter((key) => talent.measurements?.[key]);
                if (!entries.length) return null;
                return (
                  <div style={{
                    display: "grid",
                    // Each row is itself the "2-column" layout (label | value,
                    // per the spec's example). On mobile, if the viewport is
                    // wide enough for two ~150px columns the 5 rows wrap into
                    // two columns; otherwise they fall back to one.
                    gridTemplateColumns: isMobile ? "repeat(auto-fit, minmax(150px, 1fr))" : "1fr",
                    columnGap: 20,
                    padding: "10px 14px",
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 6%, transparent)",
                    border: `1px solid ${MBORDER}`, borderRadius: 12,
                  }}>
                    {entries.map((key, i) => {
                      const meta = MODEL_FIELD_LABELS[key];
                      return (
                        <div
                          key={key}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "6px 0",
                            borderTop: !isMobile && i > 0 ? `1px solid ${MBORDER}` : undefined,
                          }}
                        >
                          <span style={{ color: MMUTED, fontSize: 12 }}>{ar ? meta.ar : meta.en}</span>
                          <span style={{ color: "var(--color-secondary)", fontSize: 13, fontWeight: 800 }} dir="ltr">
                            {talent.measurements![key]}{meta.unit ? ` ${meta.unit}` : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <ProtectedAction action="create_booking">
                <motion.button
                  onClick={() => setShowBooking(true)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    ...btn, marginTop: 4,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    backgroundColor: TEAL, color: "#fff",
                    borderRadius: 12, padding: "13px 24px",
                    fontSize: 14, fontWeight: 800, width: isMobile ? "100%" : "fit-content",
                  }}>
                  <Calendar size={15} />
                  {ar ? "احجز / ادعُ لمشروع" : "Book / Invite to Project"}
                </motion.button>
              </ProtectedAction>
            </div>
          </div>
        </div>
        {showBooking && (
          <DirectBriefModal
            talentUserId={talent.id}
            talentName={talent.name ?? ""}
            talentAvatar={talent.avatarUrl ?? null}
            talentCategory={talent.category ?? null}
            dark={dark}
            lang={lang}
            onClose={() => setShowBooking(false)}
            onSuccess={() => setShowBooking(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
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
              ? "linear-gradient(160deg,#111C35,#0D1623,#050B12)"
              : "linear-gradient(160deg,#FFFFFF,#E2E8F0,#CBD5E1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
            border: `1px solid ${BORDER}`,
          }}>
            {talent.avatarUrl ? (
              <img
                src={cdnImage(talent.avatarUrl, 320)}
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

          {/* Availability + languages — hero-adjacent identity line, hidden when both are empty */}
          {(talent.availability || talent.languages) && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {availabilitySummary && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 5,
                  backgroundColor: talent.availability === "available" ? "rgba(0,210,106,0.08)" : "rgba(148,163,184,0.12)",
                  color: talent.availability === "available" ? GREEN : MUTED,
                  border: `1px solid ${talent.availability === "available" ? "rgba(0,210,106,0.2)" : BORDER}`,
                  borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600,
                }}>
                  {availabilitySummary}
                </span>
              )}
              {talent.languages && (
                <span style={{ color: MUTED, fontSize: 12 }}>{talent.languages}</span>
              )}
            </div>
          )}

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
            <ProtectedAction action="start_conversation">
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
            </ProtectedAction>
            <ProtectedAction action="create_booking">
              <motion.button onClick={() => setShowBooking(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} style={{
                ...btn, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                backgroundColor: GREEN, color: "#050B12",
                borderRadius: 12, padding: "11px 0",
                fontSize: 13, fontWeight: 900,
              }}>
                <Calendar size={14} />{t.bookNow}
              </motion.button>
            </ProtectedAction>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {/* Favoriting isn't implemented yet (no saved-talents table/API) —
                disabled rather than a silent dead click. */}
            <button
              type="button"
              disabled
              title={ar ? "قريبًا" : "Coming soon"}
              style={{
                ...btn, cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                backgroundColor: SURFACE, border: `1px solid ${BORDER}`,
                color: MUTED, borderRadius: 12, padding: "9px 0", fontSize: 13, opacity: 0.5,
              }}>
              <Heart size={13} />{t.favorite}
            </button>
            <motion.button
              type="button"
              onClick={handleShare}
              whileHover={{ scale: 1.02 }}
              style={{
                ...btn, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                backgroundColor: SURFACE, border: `1px solid ${BORDER}`,
                color: MUTED, borderRadius: 12, padding: "9px 0", fontSize: 13,
              }}>
              <Share2 size={13} />{shareCopied ? (ar ? "تم النسخ" : "Copied") : t.share}
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
                    color: i === 0 ? "#050B12" : GREEN,
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
    {showBooking && (
      <DirectBriefModal
        talentUserId={talent.id}
        talentName={talent.name ?? ""}
        talentAvatar={talent.avatarUrl ?? null}
        talentCategory={talent.category ?? null}
        dark={dark}
        lang={lang}
        onClose={() => setShowBooking(false)}
        onSuccess={() => setShowBooking(false)}
      />
    )}
    </>
  );
}
