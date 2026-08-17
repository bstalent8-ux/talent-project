"use client";

// ─── Model Hero ────────────────────────────────────────────────────────────
// Port of model/components/HeroProfile.tsx — a bordered card (not full-bleed
// like the UGC hero; the source keeps it inside the standard container),
// rebuilt with this project's inline-style + useSite() token convention and
// wired to real TalentData/presenceLinks instead of model/lib/model-data.ts.
//
// Dropped vs. source (no real feature/data behind them — see integration
// report): "TOP RATED" badge (not a tracked designation), follower counts on
// social links (only the URL is stored).

import { CheckCircle2, Award, MapPin, Maximize2, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import { cdnImage } from "@/lib/images";
import type { TalentData, PortfolioItem } from "@/features/talent-profile/types";

const GOLD = "#d89b37";
const GOLD_SOFT = "rgba(216,155,55,0.14)";

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
  firstPortfolioItem: PortfolioItem | null;
  onOpenGallery: () => void;
}

export default function ModelHero({ talent, presenceLinks, firstPortfolioItem, onOpenGallery }: Props) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang !== "en";

  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const SURFACE = dark ? "var(--bg-card-muted)" : "#F8FAFC";

  const displayName = talent.name.includes("@") ? talent.handle || talent.name.split("@")[0] : talent.name;
  const tags = talent.specialties?.length ? talent.specialties.slice(0, 6) : talent.category ? [talent.category] : [];
  const socialEntries = PLATFORM_ORDER.filter((k) => presenceLinks[k]);

  return (
    <div style={{
      width: "100%", backgroundColor: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: isMobile ? 16 : 24, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, insetInlineEnd: 0, width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${GOLD_SOFT}, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 24, position: "relative" }}>
        {/* Main photo card */}
        <div style={{ width: isMobile ? "100%" : 300, flexShrink: 0 }}>
          <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, backgroundColor: SURFACE, aspectRatio: "4 / 5" }}>
            {talent.avatarUrl ? (
              <img src={cdnImage(talent.avatarUrl, 480)} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900, color: GOLD }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent 40%, rgba(0,0,0,0.15))", pointerEvents: "none" }} />
            {firstPortfolioItem && (
              <button
                onClick={onOpenGallery}
                style={{
                  position: "absolute", bottom: 12, insetInline: 12, zIndex: 2,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  backgroundColor: "rgba(10,13,20,0.85)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10, padding: "9px 12px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Cairo',sans-serif", backdropFilter: "blur(6px)", width: "calc(100% - 24px)",
                }}
              >
                <Maximize2 size={14} color={GOLD} />{ar ? "عرض جميع الصور" : "View All Photos"}
              </button>
            )}
          </div>
        </div>

        {/* Identity */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              {talent.verified && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800 }}>
                  <CheckCircle2 size={13} />{ar ? "موثّق" : "VERIFIED"}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: 5, backgroundColor: "rgba(216,155,55,0.14)", color: GOLD, border: `1px solid ${GOLD}66`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800 }}>
                <Award size={13} />{ar ? "موديل ذهبي" : "GOLD MODEL"}
              </span>
            </div>

            <h1 style={{ color: TEXT, fontSize: isMobile ? 24 : 32, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.01em" }}>{displayName}</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 8, color: MUTED, fontSize: 13.5, fontWeight: 600, marginBottom: 14, flexWrap: "wrap" }}>
              {talent.title && <span>{talent.title}</span>}
              {talent.title && <span style={{ opacity: 0.5 }}>•</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: GOLD }}>
                <MapPin size={13} />{talent.location}
              </span>
            </div>

            {tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {tags.map((tag) => (
                  <span key={tag} style={{ backgroundColor: SURFACE, color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            )}

            {talent.bio && (
              <p style={{ color: MUTED, fontSize: 13.5, lineHeight: 1.7, margin: "0 0 20px", maxWidth: 640 }}>{talent.bio}</p>
            )}
          </div>

          {socialEntries.length > 0 && (
            <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: isMobile ? 12 : 14 }}>
              <span style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                {ar ? "الحسابات الاجتماعية" : "Social Profiles"}
              </span>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
                {socialEntries.map((key) => {
                  const meta = PLATFORM_META[key];
                  return (
                    <a
                      key={key}
                      href={toHref(key, presenceLinks[key])}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: dark ? "var(--bg-page-subtle)" : "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 8, textDecoration: "none", minWidth: 0 }}
                    >
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{meta.icon}</span>
                      <span style={{ color: TEXT, fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.label}</span>
                      <ExternalLink size={11} color={MUTED} style={{ marginInlineStart: "auto", flexShrink: 0 }} />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
