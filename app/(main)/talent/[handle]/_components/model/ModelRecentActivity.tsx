"use client";

// Recent Activity — derived from real portfolio_items.created_at timestamps,
// grouped by calendar day (a bulk upload lands as one entry: "5 photos
// added" rather than 5 separate rows). No booking-level activity here yet —
// there is no public query exposing individual booking rows with brand
// names today (only aggregate bookingStats), so that event type is left out
// rather than faked.

import { ImagePlus } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { PortfolioItem } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

interface Props {
  portfolioItems: PortfolioItem[];
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function relativeTime(iso: string, ar: boolean): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return ar ? "اليوم" : "Today";
  if (days === 1) return ar ? "منذ يوم" : "1 day ago";
  if (days < 30) return ar ? `منذ ${days} أيام` : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return ar ? "منذ شهر" : "1 month ago";
  if (months < 12) return ar ? `منذ ${months} أشهر` : `${months} months ago`;
  const years = Math.floor(months / 12);
  return ar ? `منذ ${years} سنة` : `${years}y ago`;
}

export default function ModelRecentActivity({ portfolioItems }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";

  const dated = portfolioItems.filter((item): item is PortfolioItem & { created_at: string } => Boolean(item.created_at));
  if (dated.length === 0) return null;

  const groups = new Map<string, { count: number; latest: string }>();
  for (const item of dated) {
    const key = dayKey(item.created_at);
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      if (item.created_at > existing.latest) existing.latest = item.created_at;
    } else {
      groups.set(key, { count: 1, latest: item.created_at });
    }
  }

  const entries = Array.from(groups.values())
    .sort((a, b) => (a.latest < b.latest ? 1 : -1))
    .slice(0, 3);

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 14px" }}>
        {ar ? "نشاط مؤخراً" : "Recent Activity"}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {entries.map((entry) => (
          <div key={entry.latest} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
              backgroundColor: "rgba(216,155,55,0.14)", border: `1px solid ${GOLD}66`,
            }}>
              <ImagePlus size={13} color={GOLD} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: TEXT, fontSize: 12.5, fontWeight: 700 }}>
                {ar
                  ? `تمت إضافة ${entry.count} ${entry.count === 1 ? "صورة" : "صور"} جديدة`
                  : `${entry.count} new ${entry.count === 1 ? "photo" : "photos"} added`}
              </div>
              <div style={{ color: MUTED, fontSize: 11 }}>{relativeTime(entry.latest, ar)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
