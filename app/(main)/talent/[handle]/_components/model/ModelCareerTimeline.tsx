"use client";

// Career Timeline — built entirely from real, already-tracked data: when the
// talent joined the platform (profiles.created_at) and their admin-verified
// brand collaborations (talent_brands, verified = true, with year_collaborated).
// No invented "badge earned" or "tier changed" events — those have no dated
// history anywhere in the schema, so they're left out rather than faked.

import { UserPlus, CheckCircle } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { BrandItem } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

interface TimelineEntry {
  key: string;
  label: string;
  year: string;
  icon: "joined" | "brand";
}

interface Props {
  registeredAt: string | null;
  brands: BrandItem[];
}

export default function ModelCareerTimeline({ registeredAt, brands }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";

  const entries: TimelineEntry[] = [];

  for (const brand of brands) {
    if (!brand.verified || !brand.year_collaborated) continue;
    entries.push({
      key: `brand-${brand.id}`,
      label: ar ? `تعاقد مع ${brand.name}` : `Collaborated with ${brand.name}`,
      year: brand.year_collaborated,
      icon: "brand",
    });
  }

  if (registeredAt) {
    const year = new Date(registeredAt).getFullYear();
    if (!Number.isNaN(year)) {
      entries.push({
        key: "joined",
        label: ar ? "انضم إلى Talents" : "Joined Talents",
        year: String(year),
        icon: "joined",
      });
    }
  }

  entries.sort((a, b) => Number(b.year) - Number(a.year));

  if (entries.length === 0) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
      <h3 style={{ color: TEXT, fontSize: 13.5, fontWeight: 800, margin: "0 0 14px" }}>
        {ar ? "المسيرة المهنية" : "Career Timeline"}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map((entry) => (
          <div key={entry.key} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
              backgroundColor: "rgba(216,155,55,0.14)", border: `1px solid ${GOLD}66`,
            }}>
              {entry.icon === "joined" ? <UserPlus size={11} color={GOLD} /> : <CheckCircle size={11} color={GOLD} />}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: MUTED, fontSize: 11, fontWeight: 700 }}>{entry.year}</div>
              <div style={{ color: TEXT, fontSize: 12.5, fontWeight: 600 }}>{entry.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
