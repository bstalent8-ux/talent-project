"use client";

// ─── UGC Hero ──────────────────────────────────────────────────────────────
// Matches the approved reference band 1:1 — big avatar + identity | video
// mosaic (5 tiles on top, 2 tiles + AI Match card below) | 2 tiles + CTA
// column; then a stats row and a single-line "Social Profiles" bar under the
// identity block. Inline styles + useSite() tokens, real TalentData /
// portfolio / presence links only.
//
// Data honesty (nothing here is invented):
//   - Response Time / On-Time Delivery read talent.modelMetrics.* — auto-computed
//     by recalc_talent_response_metrics(); NULL (tile hidden) until the 5-booking
//     sample floor. Completion Rate + Availability read real bookingStats /
//     talent.availability.
//   - AI Match Score has no scoring model behind it → the card keeps the
//     reference's design but reads "Soon" instead of a made-up percentage.
//   - Social follower counts aren't stored (only the profile URL is), so the
//     bold line under each icon is the account handle, the muted line the
//     platform name.
//   - "Add to Campaign" has no campaign-roster feature behind it: same look,
//     inert.
//   - The pencil badge on the avatar only renders for the profile's own owner.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MapPin, Globe, Shield, Star, MessageCircle, MessageSquarePlus, Heart, Share2, Play,
  Clock3, ClipboardCheck, Timer, Sparkles, BadgeCheck, Gem, Lock, Pencil, ChevronDown, Link2, ExternalLink,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { cdnImage } from "@/lib/images";
import ProtectedAction from "@/components/auth/ProtectedAction";
import type { TalentData, BookingStats, PortfolioItem } from "@/features/talent-profile/types";

const PURPLE = "#6C4DFF";
const PURPLE_SOFT = "#8B74FF";
const EMERALD = "#10B981";
const AMBER = "#F4B740";
const BAND = "#0A0E1A";
const LINE = "rgba(255,255,255,0.14)";
const MUTED = "#9AA4B5";
const FONT = "'IBM Plex Sans Arabic',sans-serif";

const PRIMARY_SOCIALS = ["instagram", "tiktok", "facebook", "youtube", "linkedin", "telegram"];
const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", youtube: "YouTube",
  linkedin: "LinkedIn", telegram: "Telegram", website: "Website", other: "Link",
};
const PROFILE_URL_BASE: Record<string, string> = {
  instagram: "https://instagram.com/",
  tiktok:    "https://tiktok.com/@",
  telegram:  "https://t.me/",
  facebook:  "https://facebook.com/",
  youtube:   "https://youtube.com/@",
  linkedin:  "https://linkedin.com/in/",
};

function formatResponseTime(hours: number, ar: boolean): string {
  if (hours < 24) return ar ? "خلال يوم" : "Within a day";
  const days = Math.round(hours / 24);
  return ar ? `${days} ${days === 1 ? "يوم" : "أيام"}` : `${days} ${days === 1 ? "Day" : "Days"}`;
}

function toHref(key: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const base = PROFILE_URL_BASE[key];
  if (!base) return `https://${value}`;
  const handle = value.replace(/^@/, "").trim();
  return handle ? `${base}${handle}` : `https://${value}`;
}

/** "@nour.ugc" from a stored value that is either a bare handle or a full URL. */
function displayHandle(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  let last = raw;
  if (/^https?:\/\//i.test(raw) || raw.includes("/")) {
    try {
      const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
      last = url.pathname.split("/").filter(Boolean).pop() ?? "";
    } catch {
      return null;
    }
  }
  last = last.replace(/^@/, "").trim();
  if (!last || /\.(php|html?|aspx?)$/i.test(last)) return null;
  return `@${last}`;
}

function videoPoster(url: string | null): string | undefined {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return undefined;
  const [withoutQuery] = url.split("#")[0].split("?");
  const marker = "/video/upload/";
  const at = withoutQuery.indexOf(marker);
  if (at === -1) return undefined;
  const prefix = withoutQuery.slice(0, at + marker.length);
  const publicId = withoutQuery.slice(at + marker.length).replace(/\.[a-z0-9]+$/i, ".jpg");
  return `${prefix}so_0.5,f_jpg,q_auto,w_420/${publicId}`;
}

// ─── Platform marks ────────────────────────────────────────────────────────
function PlatformMark({ kind }: { kind: string }) {
  const size = 40;
  switch (kind) {
    case "instagram":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
          <defs>
            <linearGradient id="ugc-ig" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#FEDA75" /><stop offset="0.35" stopColor="#FA7E1E" />
              <stop offset="0.6" stopColor="#D62976" /><stop offset="1" stopColor="#4F5BD5" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="11" fill="url(#ugc-ig)" />
          <rect x="10.5" y="10.5" width="19" height="19" rx="5.5" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="20" cy="20" r="4.6" fill="none" stroke="#fff" strokeWidth="2" />
          <circle cx="25.6" cy="14.4" r="1.2" fill="#fff" />
        </svg>
      );
    case "tiktok":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="11" fill="#000" />
          <path d="M22.2 10v13.1a3.6 3.6 0 1 1-3.6-3.6c.3 0 .6 0 .9.1v-3.3a7 7 0 1 0 6.3 7V17.6a8.1 8.1 0 0 0 4.7 1.5v-3.4a4.9 4.9 0 0 1-4.7-4.9V10z" fill="#25F4EE" transform="translate(-1 1)" />
          <path d="M22.2 10v13.1a3.6 3.6 0 1 1-3.6-3.6c.3 0 .6 0 .9.1v-3.3a7 7 0 1 0 6.3 7V17.6a8.1 8.1 0 0 0 4.7 1.5v-3.4a4.9 4.9 0 0 1-4.7-4.9V10z" fill="#FE2C55" transform="translate(1 -1)" />
          <path d="M22.2 10v13.1a3.6 3.6 0 1 1-3.6-3.6c.3 0 .6 0 .9.1v-3.3a7 7 0 1 0 6.3 7V17.6a8.1 8.1 0 0 0 4.7 1.5v-3.4a4.9 4.9 0 0 1-4.7-4.9V10z" fill="#fff" />
        </svg>
      );
    case "facebook":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="20" fill="#1877F2" />
          <path d="M22.4 32V21.6h3.4l.6-4h-4v-2.5c0-1.2.5-2 2.1-2h2v-3.5c-.4 0-1.6-.2-3-.2-3 0-5 1.8-5 5.1v3.1h-3.3v4h3.3V32z" fill="#fff" />
        </svg>
      );
    case "youtube":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="11" fill="#FF0000" />
          <path d="M17 14.5v11l9.5-5.5z" fill="#fff" />
        </svg>
      );
    case "linkedin":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="11" fill="#0A66C2" />
          <path d="M11.5 16.5h3.6V28h-3.6zM13.3 10.8a2.1 2.1 0 1 1 0 4.2 2.1 2.1 0 0 1 0-4.2zM17.4 16.5h3.4v1.6c.5-.9 1.7-1.9 3.5-1.9 3.700 0 4.400 2.400 4.400 5.600V28h-3.600v-5.400c0-1.300 0-3-1.900-3s-2.100 1.400-2.100 2.900V28h-3.700z" fill="#fff" />
        </svg>
      );
    case "telegram":
      return (
        <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="20" fill="#229ED9" />
          <path d="M9.500 19.700l17.700-6.800c.8-.3 1.500.2 1.200 1.400l-3 14.200c-.2 1-.8 1.300-1.700.8l-4.600-3.400-2.200 2.100c-.3.300-.5.500-1 .5l.3-4.700 8.500-7.700c.4-.3-.1-.5-.6-.2L13 22.300l-4.500-1.400c-1-.3-1-1 .2-1.500z" fill="#fff" />
        </svg>
      );
    default:
      return (
        <span style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#E2E8F0", flexShrink: 0 }}>
          <Link2 size={18} />
        </span>
      );
  }
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
  const compact = useIsMobile(1024);
  const phone = useIsMobile(640);
  const { lang } = useSite();
  const { user } = useGuestGuard();
  const ar = lang !== "en";
  const [copied, setCopied] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [moreOpen]);

  const isOwner = Boolean(user?.id && user.id === talent.id);
  const displayName = talent.name.includes("@") ? talent.handle || talent.name.split("@")[0] : talent.name;
  const completedPct = bookingStats.total > 0 ? Math.round((bookingStats.completed / bookingStats.total) * 100) : null;
  const avgResponseHours = talent.modelMetrics?.avgResponseHours ?? null;
  const autoOnTimeRate = talent.modelMetrics?.autoOnTimeRate ?? null;

  // Social bar: first three real social accounts get their own slot, everything
  // else (extra socials, website, other) sits behind the last "Portfolio Website ▾" slot.
  const present = Object.keys(PLATFORM_LABEL).filter((k) => presenceLinks[k]);
  const primary = present.filter((k) => PRIMARY_SOCIALS.includes(k)).slice(0, 3);
  const overflow = present.filter((k) => !primary.includes(k));
  const moreLabel = presenceLinks.website ? (ar ? "موقع الأعمال" : "Portfolio Website") : (ar ? "روابط أخرى" : "More Links");

  // Video mosaic mapping: 0-2 middle top row, 3-4 right column, 5-6 middle bottom row.
  const reel = portfolioItems.slice(0, 7);
  const midTop = reel.slice(0, 3);
  const rightTop = reel.slice(3, 5);
  const midBottom = reel.slice(5, 7);

  function handleShare() {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── pieces ──────────────────────────────────────────────────────────────
  const tile = (item: PortfolioItem, opts: { fade?: boolean; tilt?: boolean } = {}) => {
    const video = item.media_type?.toLowerCase() === "video";
    const src = video ? videoPoster(item.url) : item.url ? cdnImage(item.url, 420) : undefined;
    const fadeDir = ar ? "to left" : "to right";
    return (
      <div
        key={item.id}
        role="button"
        tabIndex={0}
        onClick={() => onOpenVideo(item)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenVideo(item); } }}
        style={{
          position: "relative", aspectRatio: compact ? "3 / 4" : "8 / 7", borderRadius: 14, overflow: "hidden", cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#141A2B",
          backgroundImage: src ? `url(${src})` : undefined, backgroundSize: "cover", backgroundPosition: "center",
          flex: compact ? (phone ? "0 0 116px" : "0 0 168px") : undefined,
          transform: opts.tilt && !compact ? `perspective(520px) rotateY(${ar ? -9 : 9}deg)` : undefined,
          WebkitMaskImage: opts.fade && !compact ? `linear-gradient(${fadeDir}, #000 55%, transparent 100%)` : undefined,
          maskImage: opts.fade && !compact ? `linear-gradient(${fadeDir}, #000 55%, transparent 100%)` : undefined,
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(2,6,23,0.55), transparent 55%)" }} />
        {video && (
          <span style={{ position: "absolute", bottom: 8, insetInlineEnd: 8, width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.22)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Play size={10} color="#fff" fill="#fff" />
          </span>
        )}
      </div>
    );
  };

  const matchCard = (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center",
      padding: "14px 10px", borderRadius: 16, border: `1px solid ${LINE}`, backgroundColor: "rgba(255,255,255,0.03)",
      minHeight: compact ? 96 : undefined, aspectRatio: compact ? undefined : "8 / 7",
      gridColumn: phone ? undefined : undefined,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>{ar ? "نسبة التطابق الذكي" : "AI Match Score"}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: PURPLE_SOFT, lineHeight: 1.1 }}>{ar ? "قريباً" : "Soon"}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: PURPLE_SOFT }}>
        <Sparkles size={12} />{ar ? "الميزة جاية قريب" : "Coming soon"}
      </div>
    </div>
  );

  const identity = (
    <div style={{ display: "flex", alignItems: "center", gap: phone ? 14 : 22, minWidth: 0 }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: phone ? 96 : compact ? 150 : "clamp(160px, 15vw, 214px)", aspectRatio: "1 / 1", borderRadius: "50%", padding: 3,
          background: "rgba(255,255,255,0.88)", boxShadow: "0 0 0 6px rgba(255,255,255,0.05), 0 18px 40px rgba(0,0,0,0.45)",
        }}>
          <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", backgroundColor: "#1a2535", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {talent.avatarUrl ? (
              <img src={cdnImage(talent.avatarUrl, 480)} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 56, fontWeight: 900, color: PURPLE_SOFT }}>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>
        {isOwner && (
          <Link
            href="/profile/me"
            aria-label={ar ? "تعديل الملف" : "Edit profile"}
            style={{
              position: "absolute", top: phone ? 2 : 8, insetInlineEnd: phone ? 2 : 8, width: phone ? 26 : 32, height: phone ? 26 : 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${PURPLE_SOFT}, ${PURPLE})`, border: "2px solid rgba(255,255,255,0.9)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
            }}
          >
            <Pencil size={phone ? 12 : 14} />
          </Link>
        )}
        {talent.isOnline && (
          <span style={{
            position: "absolute", bottom: phone ? -6 : -8, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
            backgroundColor: "rgba(10,14,26,0.92)", border: `1px solid ${EMERALD}`, borderRadius: 20,
            padding: phone ? "2px 8px" : "4px 12px", fontSize: phone ? 10 : 12, fontWeight: 700, color: "#D1FAE5",
          }}>
            <Gem size={phone ? 10 : 12} color={EMERALD} fill={EMERALD} />{ar ? "متصل" : "Online"}
          </span>
        )}
      </div>

      <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: phone ? 6 : 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: phone ? 22 : compact ? 28 : 32, fontWeight: 800, margin: 0, lineHeight: 1.15, overflowWrap: "anywhere" }}>{displayName}</h1>
          {talent.verified && <BadgeCheck size={phone ? 22 : 28} color="#fff" fill="#1D9BF0" strokeWidth={1.8} style={{ flexShrink: 0 }} />}
        </div>
        {talent.title && <p style={{ color: "#E2E8F0", fontSize: phone ? 13 : 15.5, fontWeight: 600, margin: 0 }}>{talent.title}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#CBD5E1", fontSize: 13.5, flexWrap: "wrap" }}>
          {talent.location && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><MapPin size={15} />{talent.location}</span>}
          {talent.languages && <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Globe size={15} />{talent.languages}</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 12, backgroundColor: `${AMBER}14`, border: `1px solid ${AMBER}66`, color: "#fff", fontSize: 13, fontWeight: 700 }}>
            <Shield size={18} color={AMBER} fill={AMBER} />{ar ? "منشئ ذهبي" : "Gold Creator"}
          </span>
          {talent.rating > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", border: `1px solid ${LINE}`, color: "#fff", fontSize: 13, fontWeight: 700 }}>
              <Star size={15} color={AMBER} fill={AMBER} />{talent.rating.toFixed(1)}
              <span style={{ color: MUTED, fontWeight: 500 }}>({talent.reviewCount} {ar ? "تقييم" : "reviews"})</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const mosaicMid = (midTop.length > 0 || midBottom.length > 0) && (
    <div style={{ display: "flex", flexDirection: compact ? "row" : "column", gap: 10, minWidth: 0, ...(compact ? { overflowX: "auto", paddingBottom: 4 } : {}) }}>
      {compact ? (
        <>
          {reel.map((item) => tile(item))}
        </>
      ) : (
        <>
          {midTop.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
              {midTop.map((item, i) => tile(item, { tilt: i === 0 }))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
            {midBottom.map((item) => tile(item))}
            {matchCard}
          </div>
        </>
      )}
    </div>
  );

  // No portfolio yet: the mosaic is gone, but the Match card still has its slot.
  const matchOnly = midTop.length === 0 && midBottom.length === 0 && (
    <div style={{ minWidth: 0 }}>{matchCard}</div>
  );

  const ctas = (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <ProtectedAction action="create_booking">
        <motion.button
          onClick={onOpenBrief}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{
            width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: "10px 16px",
            borderRadius: 14, border: "none", background: `linear-gradient(180deg, ${PURPLE_SOFT}, ${PURPLE})`, color: "#fff", cursor: "pointer", fontFamily: FONT,
            boxShadow: "0 10px 28px rgba(108,77,255,0.35)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 800 }}><Lock size={16} />{ar ? "وظّف الآن" : "Hire Now"}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, opacity: 0.92 }}><Sparkles size={11} />{ar ? "محمي بالضمان" : "Protected by Escrow"}</span>
        </motion.button>
      </ProtectedAction>

      {/* No campaign-roster feature exists yet — same look as the reference, intentionally inert. */}
      <button
        type="button"
        aria-disabled="true"
        title={ar ? "غير متاح حالياً" : "Not available yet"}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "12px 16px", borderRadius: 12, border: `1px solid ${LINE}`, backgroundColor: "transparent", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "default", fontFamily: FONT }}
      >
        <MessageSquarePlus size={17} />{ar ? "إضافة إلى حملة" : "Add to Campaign"}
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
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "12px 16px", borderRadius: 12, border: `1px solid ${LINE}`, backgroundColor: "transparent", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer", fontFamily: FONT }}
        >
          <MessageCircle size={17} />{ar ? "إرسال رسالة" : "Message"}
        </motion.button>
      </ProtectedAction>
    </div>
  );

  const stat = (icon: React.ReactNode, value: string, label: string, key: string) => (
    <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
      <span style={{ color: "#E2E8F0", display: "flex", flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );

  const stats: React.ReactNode[] = [];
  if (avgResponseHours !== null) stats.push(stat(<Clock3 size={30} strokeWidth={1.4} />, formatResponseTime(avgResponseHours, ar), ar ? "وقت الرد" : "Avg. Response Time", "resp"));
  if (completedPct !== null) stats.push(stat(<ClipboardCheck size={30} strokeWidth={1.4} />, `${completedPct}%`, ar ? "نسبة الإنجاز" : "Completion Rate", "comp"));
  if (autoOnTimeRate !== null) stats.push(stat(<Timer size={30} strokeWidth={1.4} />, `${Math.round(autoOnTimeRate)}%`, ar ? "في الموعد" : "On-Time Delivery", "ontime"));
  if (talent.availability) {
    const yes = talent.availability === "available";
    stats.push(
      <div key="avail" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: yes ? EMERALD : "#64748B", flexShrink: 0, boxShadow: yes ? `0 0 8px ${EMERALD}` : undefined }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, color: yes ? "#fff" : MUTED }}>{yes ? (ar ? "متاح" : "Available") : (ar ? "غير متاح" : "Unavailable")}</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{ar ? "استقبال طلبات" : "Accepting Projects"}</div>
        </div>
      </div>,
    );
  }

  const statsRow = stats.length > 0 && (
    <div style={{
      display: phone ? "grid" : "flex", gridTemplateColumns: phone ? "repeat(2, minmax(0,1fr))" : undefined,
      alignItems: "center", columnGap: phone ? 16 : 0, rowGap: 16, flexWrap: "wrap",
    }}>
      {stats.map((node, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", ...(phone ? {} : { paddingInlineEnd: 26, marginInlineEnd: 26, borderInlineEnd: i < stats.length - 1 ? `1px solid ${LINE}` : "none" }) }}>
          {node}
        </div>
      ))}
    </div>
  );

  const socialCell = (key: string) => {
    const handle = displayHandle(presenceLinks[key]);
    return (
      <a
        key={key}
        href={toHref(key, presenceLinks[key])}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#fff", minWidth: 0 }}
      >
        <PlatformMark kind={key} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>{handle ?? (ar ? "عرض الحساب" : "View profile")}</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>{PLATFORM_LABEL[key]}</div>
        </div>
      </a>
    );
  };

  const socialCells: React.ReactNode[] = primary.map(socialCell);
  if (overflow.length > 0) {
    socialCells.push(
      <div key="more" ref={moreRef} style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, color: "#fff", cursor: "pointer", fontFamily: FONT, textAlign: "start" }}
        >
          <PlatformMark kind="other" />
          <span style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.25, maxWidth: 110 }}>{moreLabel}</span>
          <ChevronDown size={16} color={MUTED} style={{ transform: moreOpen ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
        </button>
        {moreOpen && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 12px)", insetInlineEnd: 0, zIndex: 20, minWidth: 220,
            backgroundColor: "#111726", border: `1px solid ${LINE}`, borderRadius: 14, padding: 6, boxShadow: "0 18px 40px rgba(0,0,0,0.5)",
          }}>
            {overflow.map((key) => {
              const handle = displayHandle(presenceLinks[key]);
              return (
                <a
                  key={key}
                  href={toHref(key, presenceLinks[key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, textDecoration: "none", color: "#E2E8F0", fontSize: 13.5 }}
                >
                  <span style={{ display: "flex", transform: "scale(0.75)", transformOrigin: "center", width: 30, height: 30, alignItems: "center", justifyContent: "center", flexShrink: 0 }}><PlatformMark kind={key} /></span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{PLATFORM_LABEL[key]}{handle ? ` · ${handle}` : ""}</span>
                  <ExternalLink size={13} color={MUTED} />
                </a>
              );
            })}
          </div>
        )}
      </div>,
    );
  }

  const socialBar = socialCells.length > 0 && (
    <div style={{
      display: "flex", alignItems: phone ? "stretch" : "center", flexDirection: phone ? "column" : "row", gap: phone ? 14 : 0,
      border: `1px solid ${LINE}`, borderRadius: 14, padding: phone ? "14px 16px" : "12px 20px", width: phone ? "100%" : "fit-content", maxWidth: "100%", boxSizing: "border-box",
    }}>
      <div style={{ fontSize: 15, fontWeight: 800, paddingInlineEnd: phone ? 0 : 22, marginInlineEnd: phone ? 0 : 22, borderInlineEnd: phone ? "none" : `1px solid ${LINE}`, whiteSpace: "nowrap" }}>
        {ar ? "حسابات التواصل" : "Social Profiles"}
      </div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 14 }}>
        {socialCells.map((cell, i) => (
          <div key={i} style={{ paddingInlineEnd: 22, marginInlineEnd: 22, borderInlineEnd: !phone && i < socialCells.length - 1 ? `1px solid ${LINE}` : "none", minWidth: 0 }}>
            {cell}
          </div>
        ))}
      </div>
    </div>
  );

  // Favorite / Share live in the free corner beside the social bar so the band
  // itself stays identical to the reference.
  const utilityButtons = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginInlineStart: "auto" }}>
      <ProtectedAction action="favorite_talent">
        <button
          onClick={onToggleFavorite}
          aria-label={isFavorited ? (ar ? "في المفضلة" : "Favorited") : (ar ? "إضافة للمفضلة" : "Favorite")}
          title={isFavorited ? (ar ? "في المفضلة" : "Favorited") : (ar ? "إضافة للمفضلة" : "Favorite")}
          style={{
            width: 42, height: 42, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            border: isFavorited ? "1px solid #F43F5E" : `1px solid ${LINE}`, backgroundColor: isFavorited ? "rgba(244,63,94,0.12)" : "transparent",
            color: isFavorited ? "#FB7185" : "#CBD5E1",
          }}
        >
          <Heart size={17} fill={isFavorited ? "#FB7185" : "none"} />
        </button>
      </ProtectedAction>
      <button
        onClick={handleShare}
        aria-label={ar ? "مشاركة" : "Share"}
        title={copied ? (ar ? "تم النسخ" : "Copied!") : (ar ? "مشاركة" : "Share")}
        style={{ width: 42, height: 42, borderRadius: "50%", border: `1px solid ${LINE}`, backgroundColor: "transparent", color: copied ? EMERALD : "#CBD5E1", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Share2 size={17} />
      </button>
    </div>
  );

  const padX = compact ? "16px" : "var(--container-pad)";

  return (
    // Full-bleed band — NOT inside the shell's centered container, so the dark
    // background spans the page. The inner div carries the shared max-width.
    <div style={{ width: "100%", backgroundColor: BAND, color: "#fff", position: "relative", overflow: "hidden", fontFamily: FONT }}>
      <div style={{ position: "absolute", top: -80, insetInlineStart: "38%", width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${PURPLE}26, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ position: "relative", width: "min(1760px, 100%)", margin: "0 auto", padding: `${compact ? 20 : 30}px ${padX}`, boxSizing: "border-box" }}>
        {compact ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {identity}
            {mosaicMid}
            {reel.length > 0 ? <div style={{ maxWidth: 300 }}>{matchCard}</div> : matchOnly}
            <div style={{ maxWidth: phone ? undefined : 420 }}>{ctas}</div>
            {statsRow}
            {socialBar}
            <div style={{ display: "flex" }}>{utilityButtons}</div>
          </div>
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "minmax(0,41fr) minmax(0,36fr) minmax(0,23fr)", columnGap: 22, rowGap: 22, alignItems: "start",
          }}>
            <div style={{ gridColumn: 1, gridRow: 1, alignSelf: "center" }}>{identity}</div>
            <div style={{ gridColumn: 2, gridRow: 1, minWidth: 0 }}>{mosaicMid}{matchOnly}</div>
            <div style={{ gridColumn: 3, gridRow: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
              {rightTop.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
                  {rightTop.map((item, i) => tile(item, { fade: i === rightTop.length - 1 && rightTop.length > 1 }))}
                </div>
              )}
              {ctas}
            </div>
            <div style={{ gridColumn: "1 / -1", gridRow: 2, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
              {statsRow}
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {socialBar}
                {utilityButtons}
              </div>
            </div>
          </div>
        )}
        {favoriteError && (
          <p style={{ margin: "10px 0 0", fontSize: 11, color: "#FB7185" }}>
            {ar ? "تعذر تحديث المفضلة، حاول مرة أخرى" : "Couldn't update favorites, try again"}
          </p>
        )}
      </div>
    </div>
  );
}
