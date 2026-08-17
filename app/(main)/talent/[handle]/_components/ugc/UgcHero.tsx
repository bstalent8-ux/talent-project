"use client";

// ─── UGC Hero ──────────────────────────────────────────────────────────────
// Direct port of ugc/untitled/components/HeroProfile.tsx's layout (avatar +
// identity | reel preview + match-adjacent card | CTA column), rebuilt with
// this project's inline-style + useSite() token convention instead of
// Tailwind classes, and wired to real TalentData / real portfolio items
// instead of ugc/untitled/data/creatorData.ts.
//
// Dropped vs. source (no real feature behind them — see integration report):
//   - multi-currency switcher (project is EGP-only)
//   - "AI Match Score" widget (no matching feature exists)
//   - Avg Response Time / On-Time Delivery quick-stat tiles (not tracked)
//   - follower counts on social links (only the URL is stored)
// "Add to Campaign" stays visible but does nothing — no campaign-roster
// feature exists on the brand side today.

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Globe, Award, Star, ShieldCheck, MessageSquare, FolderPlus,
  Heart, Share2, Play, ExternalLink, Check, CheckCircle2, Sparkles,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import { cdnImage } from "@/lib/images";
import ProtectedAction from "@/components/auth/ProtectedAction";
import type { TalentData, BookingStats, PortfolioItem } from "@/features/talent-profile/types";

const VIOLET = "#7C3AED";
const EMERALD = "#10B981";
const AMBER = "#F4B740";

const PLATFORM_META: Record<string, { icon: string; label: string }> = {
  instagram: { icon: "📸", label: "Instagram" },
  tiktok:    { icon: "🎵", label: "TikTok" },
  facebook:  { icon: "📘", label: "Facebook" },
  youtube:   { icon: "▶️", label: "YouTube" },
  linkedin:  { icon: "💼", label: "LinkedIn" },
  telegram:  { icon: "✈️", label: "Telegram" },
  website:   { icon: "🌐", label: "Website" },
  other:     { icon: "🔗", label: "Other" },
};
const PLATFORM_ORDER = ["instagram", "tiktok", "facebook", "youtube", "linkedin", "telegram", "website", "other"];
const PROFILE_URL_BASE: Record<string, string> = {
  instagram: "https://instagram.com/",
  tiktok:    "https://tiktok.com/@",
  telegram:  "https://t.me/",
  facebook:  "https://facebook.com/",
  youtube:   "https://youtube.com/@",
  linkedin:  "https://linkedin.com/in/",
};
function toHref(key: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const base = PROFILE_URL_BASE[key];
  if (!base) return `https://${value}`;
  const handle = value.replace(/^@/, "").trim();
  return handle ? `${base}${handle}` : `https://${value}`;
}

interface Props {
  talent: TalentData;
  presenceLinks: Record<string, string>;
  portfolioItems: PortfolioItem[];
  bookingStats: BookingStats;
  onOpenBrief: () => void;
  onOpenVideo: (item: PortfolioItem) => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  favoriteError?: boolean;
}

export default function UgcHero({ talent, presenceLinks, portfolioItems, bookingStats, onOpenBrief, onOpenVideo, isFavorited, onToggleFavorite, favoriteError }: Props) {
  const isMobile = useIsMobile();
  const { lang } = useSite();
  const ar = lang !== "en";
  const [copied, setCopied] = useState(false);

  const displayName = talent.name.includes("@") ? talent.handle || talent.name.split("@")[0] : talent.name;
  const tags = talent.specialties?.length ? talent.specialties.slice(0, 4) : talent.category ? [talent.category] : [];
  const socialEntries = PLATFORM_ORDER.filter((k) => presenceLinks[k]);
  const reelThumbs = portfolioItems.slice(0, 5);
  const completedPct = bookingStats.total > 0 ? Math.round((bookingStats.completed / bookingStats.total) * 100) : null;

  function handleShare() {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    // Full-bleed band — NOT inside the shell's centered .site-container, so
    // the dark background spans the full page width. Its own inner div is
    // the one thing that gets the shared max-width + gutters, so the actual
    // hero content lines up with every section below it.
    <div style={{ width: "100%", backgroundColor: "#0B0F19", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -60, insetInlineStart: "20%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${VIOLET}22, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, insetInlineEnd: "20%", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${EMERALD}1a, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{
        position: "relative", width: "min(var(--container-max), 100%)", margin: "0 auto",
        padding: isMobile ? "20px 16px" : "28px var(--container-pad)",
      }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "5fr 4fr 3fr",
        gap: isMobile ? 20 : 24, alignItems: "start",
      }}>
        {/* Identity — explicit gridColumn so it always lands in track 1,
            never shifted by the reel-preview column below being absent. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, gridColumn: isMobile ? undefined : 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: isMobile ? 84 : 100, height: isMobile ? 84 : 100, borderRadius: "50%", padding: 3,
                background: `linear-gradient(135deg, ${VIOLET}, ${EMERALD})`,
              }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", backgroundColor: "#1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {talent.avatarUrl ? (
                    <img src={cdnImage(talent.avatarUrl, 240)} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 34, fontWeight: 900, color: VIOLET }}>{displayName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>
              {talent.availability === "available" && (
                <span style={{
                  position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
                  backgroundColor: "rgba(15,23,42,0.9)", border: `1px solid ${EMERALD}99`, borderRadius: 20,
                  padding: "2px 8px", fontSize: 10, fontWeight: 800, color: EMERALD, whiteSpace: "nowrap",
                }}>
                  {ar ? "متصل" : "Online"}
                </span>
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, margin: 0 }}>{displayName}</h1>
                {talent.verified && (
                  <span style={{ width: 20, height: 20, borderRadius: "50%", backgroundColor: "#0EA5E9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Check size={13} color="#fff" strokeWidth={3} />
                  </span>
                )}
              </div>
              {talent.title && <p style={{ color: "#CBD5E1", fontSize: 13.5, fontWeight: 600, margin: "4px 0 0" }}>{talent.title}</p>}

              <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#94A3B8", fontSize: 12, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} />{talent.location}</span>
                {talent.languages && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Globe size={13} />{talent.languages}</span>}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, backgroundColor: `${AMBER}26`, border: `1px solid ${AMBER}66`, color: AMBER, fontSize: 11.5, fontWeight: 800 }}>
                  <Award size={13} />{ar ? "منشئ ذهبي" : "Gold Creator"}
                </span>
                {talent.rating > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, backgroundColor: "rgba(148,163,184,0.12)", color: "#E2E8F0", fontSize: 11.5, fontWeight: 700 }}>
                    <Star size={13} color={AMBER} fill={AMBER} />{talent.rating.toFixed(1)}
                    <span style={{ color: "#94A3B8" }}>({talent.reviewCount} {ar ? "تقييم" : "reviews"})</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {tags.map((tag) => (
                <span key={tag} style={{ padding: "4px 10px", borderRadius: 20, backgroundColor: `${VIOLET}22`, border: `1px solid ${VIOLET}55`, color: "#C4B5FD", fontSize: 11.5 }}>{tag}</span>
              ))}
            </div>
          )}

          {(completedPct !== null || talent.availability) && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(2, minmax(0,1fr))", gap: 8 }}>
              {completedPct !== null && (
                <div style={{ backgroundColor: "rgba(15,23,42,0.6)", border: "1px solid #1E293B", borderRadius: 12, padding: "8px 10px" }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{completedPct}%</div>
                  <div style={{ fontSize: 10, color: "#94A3B8" }}>{ar ? "نسبة الإنجاز" : "Completion Rate"}</div>
                </div>
              )}
              {talent.availability && (
                <div style={{ backgroundColor: "rgba(15,23,42,0.6)", border: "1px solid #1E293B", borderRadius: 12, padding: "8px 10px" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: talent.availability === "available" ? EMERALD : "#94A3B8" }}>
                    {talent.availability === "available" ? (ar ? "متاح" : "Available") : (ar ? "غير متاح" : "Unavailable")}
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8" }}>{ar ? "استقبال طلبات" : "Accepting Projects"}</div>
                </div>
              )}
            </div>
          )}

          {socialEntries.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {socialEntries.map((key) => {
                const meta = PLATFORM_META[key];
                return (
                  <a
                    key={key}
                    href={toHref(key, presenceLinks[key])}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 20, backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0", fontSize: 11.5, textDecoration: "none" }}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                    <ExternalLink size={11} color="#64748B" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Reel preview strip — explicit gridColumn 2. Conditionally
            rendered (no portfolio yet), so without an explicit column the
            actions block below it would auto-place into this track and
            visually end up in the middle instead of on the far side. */}
        {reelThumbs.length > 0 && (
          <div style={{ gridColumn: isMobile ? undefined : 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "#94A3B8", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
              <Play size={12} color={VIOLET} fill={VIOLET} />
              {ar ? "نماذج فيديو مختارة" : "Featured Video Snippets"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(5, reelThumbs.length)}, 1fr)`, gap: 8, height: isMobile ? 100 : 132 }}>
              {reelThumbs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onOpenVideo(item)}
                  style={{
                    position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer",
                    border: "1px solid #1E293B", backgroundColor: "#0F172A",
                    backgroundImage: item.media_type !== "video" && item.url ? `url(${item.url})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                  }}
                >
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to top, rgba(2,6,23,0.7), transparent 50%)" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Play size={12} color="#fff" fill="#fff" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTAs — explicit gridColumn 3 (the "far" track: left in RTL,
            right in LTR), so the action column always lands there and
            never collapses into the middle track when reelThumbs is empty. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, gridColumn: isMobile ? undefined : 3 }}>
          <ProtectedAction action="create_booking">
            <motion.button
              onClick={onOpenBrief}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 16px", borderRadius: 12, border: "none", background: `linear-gradient(90deg, ${VIOLET}, #4F46E5)`, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
            >
              <ShieldCheck size={16} color={EMERALD} />{ar ? "وظف الآن" : "Hire Now"}
            </motion.button>
          </ProtectedAction>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 10.5, color: "#94A3B8" }}>
            <ShieldCheck size={12} color={EMERALD} />{ar ? "محمي بنظام الدفع الآمن" : "Protected by Secure Payment"}
          </div>

          {/* No campaign-roster feature exists yet — kept visible per source, intentionally inert. */}
          <button
            disabled
            title={ar ? "غير متاح حالياً" : "Not available yet"}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "1px solid #1E293B", backgroundColor: "rgba(15,23,42,0.7)", color: "#64748B", fontWeight: 700, fontSize: 12.5, cursor: "not-allowed", fontFamily: "'Cairo',sans-serif" }}
          >
            <FolderPlus size={14} />{ar ? "إضافة إلى حملة" : "Add to Campaign"}
          </button>

          <ProtectedAction action="start_conversation">
            <motion.button
              onClick={() => window.dispatchEvent(new CustomEvent("open-chat-widget", {
                detail: {
                  otherUserId: talent.id,
                  otherUser: { id: talent.id, full_name: talent.name, avatar_url: talent.avatarUrl, handle: talent.handle },
                },
              }))}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 16px", borderRadius: 12, border: "1px solid #1E293B", backgroundColor: "rgba(15,23,42,0.7)", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
            >
              <MessageSquare size={14} color={EMERALD} />{ar ? "إرسال رسالة" : "Message"}
            </motion.button>
          </ProtectedAction>

          <div style={{ display: "flex", gap: 8 }}>
            <ProtectedAction action="favorite_talent">
              <button
                onClick={onToggleFavorite}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "8px 0", borderRadius: 10, cursor: "pointer", fontFamily: "'Cairo',sans-serif", fontSize: 12,
                  border: isFavorited ? "1px solid #F43F5E" : "1px solid #1E293B",
                  backgroundColor: isFavorited ? "rgba(244,63,94,0.12)" : "transparent",
                  color: isFavorited ? "#FB7185" : "#94A3B8",
                }}
              >
                <Heart size={13} fill={isFavorited ? "#FB7185" : "none"} />{isFavorited ? (ar ? "في المفضلة" : "Favorited") : (ar ? "إضافة للمفضلة" : "Favorite")}
              </button>
            </ProtectedAction>
            <button onClick={handleShare} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 10, border: "1px solid #1E293B", backgroundColor: "transparent", color: "#94A3B8", fontSize: 12, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
              <Share2 size={13} />{copied ? (ar ? "تم النسخ" : "Copied!") : ar ? "مشاركة" : "Share"}
            </button>
          </div>
          {favoriteError && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#FB7185" }}>
              {ar ? "تعذر تحديث المفضلة، حاول مرة أخرى" : "Couldn't update favorites, try again"}
            </p>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
