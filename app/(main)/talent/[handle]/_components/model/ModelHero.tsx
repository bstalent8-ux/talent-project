"use client";

// ─── Model Hero ────────────────────────────────────────────────────────────
// Three columns, built to the approved reference: big portrait with a TOP RATED
// tab and "View All Photos" | identity (badges, serif name, title + city, tags,
// bio, gold-framed Social Profiles strip) | "Match with your request" gauge card.
// Coloured with the site palette (gold accent, site greens) in both themes.
//
// Data notes:
//   - VERIFIED / tier badge / TOP RATED read real fields (talent.verified,
//     model_metrics.tier, and a 4.5★ + 3-review floor for TOP RATED — the old
//     unmoderated `premium` flag is still not used).
//   - Follower counts aren't stored (only the profile URL), so each social slot
//     shows the account handle over the platform name.
//   - The Match card (92% + factor list) is a FIXED demo figure on every model, by
//     explicit request — there is no matching engine and a public page has no
//     brief to match against. "Why this score?" says so.

import { useState } from "react";
import { CheckCircle2, MapPin, Maximize2, Image as ImageIcon, Info, Check, Link2, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import { cdnImage } from "@/lib/images";
import { formatTalentTag } from "@/lib/talent-tags";
import { PlatformMark, displayHandle, toHref } from "../ugc/UgcHero";
import type { TalentData, PortfolioItem } from "@/features/talent-profile/types";

const GOLD = "#d89b37";
const GREEN = "#00D26A";
const SERIF = "'Iowan Old Style','Palatino Linotype','Book Antiqua',Georgia,'Times New Roman',serif";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", youtube: "YouTube",
  linkedin: "LinkedIn", telegram: "Telegram", website: "Website", other: "Link",
};
const SOCIAL_ORDER = ["instagram", "tiktok", "facebook", "youtube", "linkedin", "telegram"];

// Fixed demo breakdown (see header). The first two rows follow the model's own
// specialty and city; the weights are illustrative.
const MATCH_SCORE = 92;
const FACTOR_WEIGHTS = [30, 15, 20, 15, 10, 5, 5];
const FACTOR_LABELS = {
  ar: ["", "", "خبرة في التصوير التجاري", "متاحة في التاريخ المطلوب", "تقييمات ممتازة", "سرعة الرد عالية", "ملف شخصي مكتمل"],
  en: ["", "", "Commercial shoot experience", "Available on the requested date", "Excellent reviews", "Fast response time", "Complete profile"],
};

interface Props {
  talent: TalentData;
  presenceLinks: Record<string, string>;
  firstPortfolioItem: PortfolioItem | null;
  onOpenGallery: () => void;
}

export default function ModelHero({ talent, presenceLinks, firstPortfolioItem, onOpenGallery }: Props) {
  const compact = useIsMobile(1024);
  const phone = useIsMobile(640);
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const [why, setWhy] = useState(false);

  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const SURFACE = dark ? "var(--bg-card-muted)" : "#F8FAFC";
  const HAIR = dark ? "rgba(255,255,255,0.12)" : "#E2E8F0";

  const displayName = talent.name.includes("@") ? talent.handle || talent.name.split("@")[0] : talent.name;
  const tags = talent.specialties?.length
    ? talent.specialties.slice(0, 6).map((tag) => formatTalentTag(tag, lang))
    : talent.category ? [formatTalentTag(talent.category, lang)] : [];
  const tier = talent.modelMetrics?.tier ? String(talent.modelMetrics.tier).toUpperCase() : null;
  const tierLabel = tier ? (tier.includes("MODEL") ? tier : `${tier} MODEL`) : null;
  const topRated = talent.rating >= 4.5 && talent.reviewCount >= 3;
  const photoUrl = talent.avatarUrl ?? (firstPortfolioItem?.media_type !== "video" ? firstPortfolioItem?.url : null) ?? null;

  // Social strip: real accounts first (max 4 slots), the website / other link last as "Portfolio / Website".
  const socials = SOCIAL_ORDER.filter((k) => presenceLinks[k]);
  const webKey = presenceLinks.website ? "website" : presenceLinks.other ? "other" : null;
  const slots = [...socials.slice(0, webKey ? 3 : 4), ...(webKey ? [webKey] : [])];

  const factorNames = [
    tags[0] ?? (ar ? "موديل" : "Model"),
    talent.location || (ar ? "القاهرة" : "Cairo"),
    ...FACTOR_LABELS[ar ? "ar" : "en"].slice(2),
  ];

  // ─── Match gauge: 270° arc, open at the bottom ────────────────────────────
  const G = 168, stroke = 11, r = (G - stroke) / 2, c = G / 2, circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const trackColor = dark ? "rgba(255,255,255,0.10)" : "#E2E8F0";

  const photo = (
    <div style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 16, overflow: "hidden", backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
      {photoUrl ? (
        <img src={cdnImage(photoUrl, 900)} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, fontWeight: 900, color: GOLD }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      {topRated && (
        <span style={{ position: "absolute", top: 12, insetInlineStart: 12, backgroundColor: GOLD, color: "#0b0d13", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, letterSpacing: 0.3 }}>
          TOP RATED
        </span>
      )}
      {firstPortfolioItem && (
        <button
          type="button"
          onClick={onOpenGallery}
          style={{
            position: "absolute", bottom: 12, insetInlineStart: 12, display: "flex", alignItems: "center", gap: 10,
            backgroundColor: "rgba(10,13,20,0.78)", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 10,
            padding: "9px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(6px)", fontFamily: "'IBM Plex Sans Arabic',sans-serif",
          }}
        >
          <ImageIcon size={15} />{ar ? "عرض جميع الصور" : "View All Photos"}<Maximize2 size={13} color={GOLD} />
        </button>
      )}
    </div>
  );

  const identity = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {talent.verified && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: dark ? "#34d399" : "#059669", border: "1px solid rgba(16,185,129,0.5)", backgroundColor: "rgba(16,185,129,0.08)", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 800 }}>
            <CheckCircle2 size={13} />{ar ? "موثّق" : "VERIFIED"}
          </span>
        )}
        {tierLabel && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: GOLD, border: `1px solid ${GOLD}88`, backgroundColor: "rgba(216,155,55,0.10)", borderRadius: 8, padding: "5px 12px", fontSize: 11.5, fontWeight: 800 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: GOLD }} />{tierLabel}
          </span>
        )}
      </div>

      <h1 style={{ color: TEXT, fontFamily: SERIF, fontSize: phone ? 34 : compact ? 44 : 52, fontWeight: 500, lineHeight: 1.08, margin: 0, letterSpacing: "-0.01em", overflowWrap: "anywhere" }}>{displayName}</h1>

      <div style={{ display: "flex", alignItems: "center", gap: 14, color: TEXT, fontSize: 14.5, fontWeight: 600, flexWrap: "wrap" }}>
        {talent.title && <span>{talent.title}</span>}
        {talent.location && (
          <span style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontWeight: 500 }}>
            <MapPin size={15} color={GOLD} />{talent.location}
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {tags.map((tag) => (
            <span key={tag} style={{ color: TEXT, border: `1px solid ${HAIR}`, borderRadius: 999, padding: "5px 14px", fontSize: 12.5, fontWeight: 500 }}>{tag}</span>
          ))}
        </div>
      )}

      {talent.bio && (
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.85, margin: 0, maxWidth: 560, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{talent.bio}</p>
      )}

      {slots.length > 0 && (
        <div style={{ border: `1px solid ${GOLD}99`, borderRadius: 14, padding: "14px 18px", marginTop: 4 }}>
          <div style={{ color: TEXT, fontSize: 13, fontWeight: 800, marginBottom: 12 }}>{ar ? "الحسابات الاجتماعية" : "Social Profiles"}</div>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", rowGap: 14 }}>
            {slots.map((key, i) => {
              const isWeb = key === "website" || key === "other";
              const handle = isWeb ? null : displayHandle(presenceLinks[key]);
              return (
                <a
                  key={key}
                  href={toHref(key, presenceLinks[key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: TEXT, minWidth: 0,
                    paddingInlineEnd: 20, marginInlineEnd: 20, borderInlineEnd: i < slots.length - 1 ? `1px solid ${HAIR}` : "none",
                  }}
                >
                  {isWeb ? (
                    <span style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${HAIR}`, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, flexShrink: 0 }}><Link2 size={16} /></span>
                  ) : (
                    <span style={{ display: "flex", transform: "scale(0.85)", transformOrigin: "center", width: 34, height: 34, alignItems: "center", justifyContent: "center", flexShrink: 0 }}><PlatformMark kind={key} /></span>
                  )}
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, lineHeight: 1.2, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {isWeb ? (ar ? "الأعمال / الموقع" : "Portfolio / Website") : (handle ?? (ar ? "عرض الحساب" : "View profile"))}
                    </span>
                    {!isWeb && <span style={{ display: "block", fontSize: 11.5, color: MUTED, marginTop: 2 }}>{PLATFORM_LABEL[key]}</span>}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const match = (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: phone ? 18 : 22, minWidth: 0 }}>
      <h2 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 14px", textAlign: "center" }}>{ar ? "مدى المطابقة مع طلبك" : "Match with your request"}</h2>

      <div style={{ position: "relative", width: G, height: G, margin: "0 auto 14px" }}>
        <svg width={G} height={G} viewBox={`0 0 ${G} ${G}`} style={{ transform: "rotate(135deg)" }} aria-hidden="true">
          <circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arc} ${circ}`} />
          <circle cx={c} cy={c} r={r} fill="none" stroke={GREEN} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arc * (MATCH_SCORE / 100)} ${circ}`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: TEXT, fontSize: 40, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{MATCH_SCORE}%</span>
          <span style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>{ar ? "تطابق" : "Match"}</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {factorNames.map((name, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <span style={{ width: 17, height: 17, borderRadius: "50%", backgroundColor: GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Check size={11} color="#04150c" strokeWidth={3.5} />
            </span>
            <span style={{ flex: 1, minWidth: 0, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
            <span style={{ color: GREEN, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>+{FACTOR_WEIGHTS[i]}%</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setWhy((w) => !w)}
        aria-expanded={why}
        style={{ display: "flex", alignItems: "center", gap: 6, margin: "16px auto 0", background: "none", border: "none", padding: 0, color: GOLD, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
      >
        <Info size={14} />{ar ? "لماذا هذه النسبة؟" : "Why this score?"}
        <ChevronDown size={13} style={{ transform: why ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
      </button>
      {why && (
        <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.7, margin: "10px 0 0", textAlign: "center" }}>
          {ar
            ? "دي نسبة توضيحية لشكل الميزة. مطابقة حقيقية مع طلبك هتشتغل لما تبعت تفاصيل الحملة."
            : "This is a sample score showing how matching will look. Real matching against your brief comes once you share campaign details."}
        </p>
      )}
    </div>
  );

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -60, insetInlineEnd: "8%", width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(216,155,55,0.12), transparent 70%)", pointerEvents: "none" }} />
      <div style={{
        position: "relative", display: "grid", gap: phone ? 20 : 28, alignItems: "start",
        gridTemplateColumns: compact ? "minmax(0,1fr)" : "minmax(0,27fr) minmax(0,43fr) minmax(0,28fr)",
      }}>
        <div style={{ maxWidth: compact ? 380 : undefined, width: "100%", margin: compact ? "0 auto" : undefined }}>{photo}</div>
        {identity}
        <div style={{ maxWidth: compact ? 460 : undefined, width: "100%", margin: compact ? "0 auto" : undefined }}>{match}</div>
      </div>
    </div>
  );
}
