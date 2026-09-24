"use client";

// Recent Activity — derived from real portfolio_items.created_at timestamps,
// grouped by calendar day (a bulk upload lands as one entry: "5 new photos
// added" rather than 5 rows), with thumbnails of the photos from that day.
// Booking-level events aren't exposed by any public query today, so they're
// left out rather than faked. No dated uploads → the card says "No content".

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { cdnImage } from "@/lib/images";
import type { PortfolioItem } from "@/features/talent-profile/types";

const GOLD = "var(--color-accent-strong)";
const VISIBLE = 3;

interface Props {
  portfolioItems: PortfolioItem[];
  /** Model's display name — the title reads "<first name>'s recent activity". */
  name?: string;
}

function relativeTime(iso: string, ar: boolean): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return ar ? "منذ قليل" : "Just now";
  if (hours < 24) return ar ? (hours === 1 ? "منذ ساعة" : hours === 2 ? "منذ ساعتين" : `منذ ${hours} ساعات`) : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return ar ? "منذ يوم" : "1 day ago";
  if (days === 2) return ar ? "منذ يومين" : "2 days ago";
  if (days < 30) return ar ? `منذ ${days} أيام` : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return ar ? "منذ شهر" : "1 month ago";
  if (months < 12) return ar ? `منذ ${months} أشهر` : `${months} months ago`;
  const years = Math.floor(months / 12);
  return ar ? `منذ ${years} سنة` : `${years}y ago`;
}

export default function ModelRecentActivity({ portfolioItems, name }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FBF7EA";
  const BORDER = dark ? "var(--border-subtle)" : "#E6DCC3";
  const TEXT = dark ? "var(--text-primary)" : "#2B211D";
  const MUTED = dark ? "var(--text-muted)" : "#6E5F55";
  const [open, setOpen] = useState(false);

  const dated = portfolioItems.filter((item): item is PortfolioItem & { created_at: string } => Boolean(item.created_at));
  const groups = new Map<string, { latest: string; items: (PortfolioItem & { created_at: string })[] }>();
  for (const item of dated) {
    const key = item.created_at.slice(0, 10);
    const g = groups.get(key);
    if (g) {
      g.items.push(item);
      if (item.created_at > g.latest) g.latest = item.created_at;
    } else {
      groups.set(key, { latest: item.created_at, items: [item] });
    }
  }
  const entries = Array.from(groups.values()).sort((a, b) => (a.latest < b.latest ? 1 : -1));
  const shown = open ? entries : entries.slice(0, VISIBLE);
  const first = (name ?? "").trim().split(/\s+/)[0];
  const title = first ? (ar ? `نشاط ${first} مؤخراً` : `${first}'s recent activity`) : (ar ? "النشاط الأخير" : "Recent Activity");

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>{title}</h3>

      {entries.length === 0 ? (
        <div style={{ padding: "18px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{ar ? "لا يوجد محتوى" : "No content"}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {shown.map((entry) => (
            <div key={entry.latest} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid color-mix(in srgb, ${GOLD} 40%, transparent)`, backgroundColor: "rgba(231,165,138,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ImagePlus size={15} color={GOLD} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: TEXT, fontSize: 13.5, fontWeight: 700 }}>
                  {ar
                    ? `تمت إضافة ${entry.items.length} ${entry.items.length === 1 ? "صورة" : "صور"} جديدة`
                    : `${entry.items.length} new ${entry.items.length === 1 ? "photo" : "photos"} added`}
                </div>
                <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{relativeTime(entry.latest, ar)}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {entry.items.filter((i) => i.media_type?.toLowerCase() !== "video" && i.url).slice(0, 2).map((i) => (
                  <span key={i.id} style={{ width: 34, height: 34, borderRadius: 8, backgroundImage: `url(${cdnImage(i.url, 80)})`, backgroundSize: "cover", backgroundPosition: "center", border: `1px solid ${BORDER}` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          style={{ width: "100%", marginTop: 18, padding: "11px 0", borderRadius: 10, border: `1px solid ${GOLD}`, backgroundColor: "transparent", color: GOLD, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
        >
          {open ? (ar ? "عرض أقل" : "Show less") : (ar ? "عرض كل النشاط" : "View all activity")}
        </button>
      )}
    </div>
  );
}
