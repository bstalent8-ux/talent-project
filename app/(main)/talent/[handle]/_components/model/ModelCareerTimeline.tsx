"use client";

// Career Timeline — built entirely from real, already-tracked data: when the
// talent joined the platform (profiles.created_at), their own listed experience
// (name + year) and their admin-verified brand collaborations (talent_brands,
// verified = true, with year_collaborated). No invented "badge earned" or "tier
// changed" events — those have no dated history in the schema. No entries → the
// card says "No content".

import { useSite } from "@/contexts/SiteContext";
import type { BrandItem, ExperienceItem } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

interface TimelineEntry {
  key: string;
  label: string;
  when: string;
  sort: number;
}

interface Props {
  registeredAt: string | null;
  brands: BrandItem[];
  experience?: ExperienceItem[] | null;
}

export default function ModelCareerTimeline({ registeredAt, brands, experience }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const noContent = ar ? "لا يوجد محتوى" : "No content";

  const yearSort = (year: string) => {
    const y = Number(year);
    return Number.isFinite(y) ? new Date(y, 11, 31).getTime() : 0;
  };

  const entries: TimelineEntry[] = [];

  if (registeredAt) {
    const d = new Date(registeredAt);
    if (!Number.isNaN(d.getTime())) {
      entries.push({
        key: "joined",
        label: ar ? "تم الانضمام إلى Talents" : "Joined Talents",
        when: d.toLocaleDateString(ar ? "ar-EG-u-nu-latn" : "en-US", { month: "long", year: "numeric" }),
        sort: d.getTime(),
      });
    }
  }
  for (const brand of brands) {
    if (!brand.verified || !brand.year_collaborated) continue;
    entries.push({ key: `brand-${brand.id}`, label: ar ? `تعاقد مع ${brand.name}` : `Collaborated with ${brand.name}`, when: brand.year_collaborated, sort: yearSort(brand.year_collaborated) });
  }
  (experience ?? []).forEach((e, i) => {
    if (!e.name || !e.year) return;
    entries.push({ key: `exp-${i}`, label: e.name, when: e.year, sort: yearSort(e.year) });
  });

  entries.sort((a, b) => b.sort - a.sort);

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, minWidth: 0 }}>
      <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 800, margin: "0 0 18px" }}>
        {ar ? "المسيرة المهنية" : "Career Timeline"}
      </h3>

      {entries.length === 0 ? (
        <div style={{ padding: "22px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{noContent}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {entries.map((entry, i) => (
            <div key={entry.key} style={{ display: "flex", alignItems: "flex-start", gap: 12, position: "relative", paddingBottom: i === entries.length - 1 ? 0 : 18 }}>
              {i < entries.length - 1 && (
                <span aria-hidden="true" style={{ position: "absolute", insetInlineStart: 6, top: 16, bottom: 0, width: 1, backgroundColor: dark ? "rgba(216,155,55,0.35)" : "#E8D3A8" }} />
              )}
              <span style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${GOLD}`, backgroundColor: CARD, flexShrink: 0, marginTop: 3, position: "relative", zIndex: 1 }} />
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, flex: 1, minWidth: 0, flexWrap: "wrap" }}>
                <span style={{ color: TEXT, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>{entry.when}</span>
                <span style={{ color: MUTED, fontSize: 12.5, minWidth: 0, overflowWrap: "anywhere" }}>{entry.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
