"use client";

// ─── BrandHero ────────────────────────────────────────────────────────────────
// Page chrome, not a layout section: it renders above the slots and must survive
// an otherwise empty profile, because a profile with no name is not a profile.
//
// It carries the `logo` core section's data, which is why `logo` stays out of
// the brand layout JSON — a section rendered here must not also get a slot.

import { BadgeCheck, Globe, MapPin, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useBrandPalette } from "./BrandCard";

const TX = {
  ar: { collaborations: (n: number) => `${n} تعاون مكتمل`, since: "عضو منذ", visit: "زيارة الموقع" },
  en: { collaborations: (n: number) => `${n} completed collaborations`, since: "Member since", visit: "Visit website" },
};

function safeHref(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export default function BrandHero({
  name,
  companyName,
  avatarUrl,
  city,
  isVerified,
  memberSince,
  websiteUrl,
  completedBookings,
}: {
  name:              string;
  companyName:       string | null;
  avatarUrl:         string | null;
  city:              string | null;
  isVerified:        boolean;
  memberSince:       string | null;
  websiteUrl:        string | null;
  completedBookings: number;
}) {
  const { ar, dark, CARD, BORDER, TEXT, MUTED, GREEN } = useBrandPalette();
  const isMobile = useIsMobile();
  const tx = TX[ar ? "ar" : "en"];

  const href = safeHref(websiteUrl);
  // The trading name is the headline; the legal name is a subtitle, and only
  // when it actually differs — repeating the same string twice reads as a bug.
  const subtitle = companyName && companyName.trim() !== name.trim() ? companyName : null;

  return (
    <section
      style={{
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: isMobile ? 20 : 28,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 18,
        }}
      >
        <div
          style={{
            width: isMobile ? 72 : 92, height: isMobile ? 72 : 92,
            borderRadius: 16, overflow: "hidden", flexShrink: 0,
            backgroundColor: dark ? "#0A121C" : "#F1F5F9",
            border: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: GREEN, fontSize: 34, fontWeight: 900,
          }}
        >
          {avatarUrl
            ? <img alt="" src={avatarUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : name.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              color: TEXT, fontSize: isMobile ? 22 : 28, fontWeight: 900,
              margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
            }}
          >
            {name}
            {isVerified && <BadgeCheck size={20} color={GREEN} />}
          </h1>

          {subtitle && (
            <p style={{ color: MUTED, fontSize: 14, fontWeight: 700, margin: "0 0 8px" }}>{subtitle}</p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", color: MUTED, fontSize: 13 }}>
            {city && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <MapPin size={14} color={GREEN} />{city}
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <Users size={14} color={GREEN} />{tx.collaborations(completedBookings)}
            </span>
            {memberSince && <span>{tx.since} {memberSince}</span>}
          </div>
        </div>

        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "11px 22px", borderRadius: 10,
              // Same pairing as the existing green CTAs (JobsGrid.tsx:228):
              // the base background colour on green, not white — white on
              // #00D26A is under 2:1.
              backgroundColor: GREEN, color: "#050B12",
              fontSize: 14, fontWeight: 800, textDecoration: "none",
              flexShrink: 0, alignSelf: isMobile ? "stretch" : "center",
              justifyContent: "center",
            }}
          >
            <Globe size={15} />
            {tx.visit}
          </a>
        )}
      </div>
    </section>
  );
}
