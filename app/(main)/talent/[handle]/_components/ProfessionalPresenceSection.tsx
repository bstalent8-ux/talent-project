"use client";

// ─── Professional Presence ─────────────────────────────────────────────────
// Renders the links a talent added on My Profile's Presence step
// (lib/profile-fields.ts's TALENT_SOCIAL_KEYS). URL-only, no OAuth, no
// follower counts, no external API calls — this component only formats data
// the provider already loaded.
//
// `links` only ever contains platforms the talent actually filled in — see
// talent.context.ts's toPresenceLinks(). An empty object never reaches here:
// section-content.ts's `social` rule hides the whole section first.

import { ExternalLink } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Props {
  links: Record<string, string>;
}

/** Official brand spelling in both languages — these are trademarks, not copy to localize. */
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

/**
 * Talents often type a bare handle ("@name") rather than a URL, since the My
 * Profile input placeholder says "Profile URL" but does not enforce it. A
 * naive `https://` prefix on "@name" produces "https://@name" — not a link
 * to anywhere. Each platform has one well-known profile URL shape, so a bare
 * handle is expanded into it; this is string formatting, not an API call —
 * no OAuth, no follower lookups, nothing fetched.
 */
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

export default function ProfessionalPresenceSection({ links }: Props) {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const ar = lang === "ar";

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const SURFACE= dark ? "#0A121C" : "#F8FAFC";
  const GREEN  = "#00D26A";

  const entries = PLATFORM_ORDER.filter((key) => links[key]);
  if (!entries.length) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
        {ar ? "الحضور المهني" : "Professional Presence"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {entries.map((key) => {
          const meta = PLATFORM_META[key];
          const value = links[key];
          return (
            <a
              key={key}
              href={toHref(key, value)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                padding: "12px 14px", backgroundColor: SURFACE, border: `1px solid ${BORDER}`,
                borderRadius: 12, textDecoration: "none", minWidth: 0,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{meta.icon}</span>
                <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <span style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>{meta.label}</span>
                  <span
                    dir="ltr"
                    style={{
                      color: MUTED, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", maxWidth: isMobile ? 160 : 200,
                    }}
                  >
                    {value}
                  </span>
                </span>
              </span>
              <span style={{
                display: "flex", alignItems: "center", gap: 4, color: GREEN,
                fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {ar ? "عرض الملف" : "View Profile"}
                <ExternalLink size={13} />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
