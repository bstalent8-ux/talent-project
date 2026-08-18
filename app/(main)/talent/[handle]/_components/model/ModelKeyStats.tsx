"use client";

// Port of model/components/KeyStats.tsx's 6-cell strip, matching the
// source's exact 6 labels this time (rating / cancellation / response time /
// response rate / projects / avg. project price). Real where the schema
// supports it: rating, reviewCount and cancellationRate (cancelled/total
// from real bookingStats) and projectsCount (completed bookings). responseTime,
// responseRate and avgProjectPrice have no backing column or aggregate
// anywhere — HARD-CODED placeholders, see CLAUDE.md's model-profile report.

import { Star } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { TalentData, BookingStats } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

interface Props {
  talent: TalentData;
  bookingStats: BookingStats;
  onOpenReviews?: () => void;
}

export default function ModelKeyStats({ talent, bookingStats, onOpenReviews }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-surface)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";

  // HARD-CODED — no tracked source (see module comment above).
  const RESPONSE_TIME = ar ? "~1.8 ساعة" : "~1.8h";
  const RESPONSE_RATE = "95%";
  const AVG_PROJECT_PRICE = 5200;

  const cancellationRate = bookingStats.total > 0
    ? `${Math.round((bookingStats.cancelled / bookingStats.total) * 100)}%`
    : "0%";

  const cells = [
    { label: ar ? "تقييم عام" : "Rating", value: talent.rating > 0 ? talent.rating.toFixed(1) : "—", sub: `(${talent.reviewCount} ${ar ? "تقييم" : "reviews"})`, onClick: onOpenReviews, star: true },
    { label: ar ? "معدل الإلغاء" : "Cancellation Rate", value: cancellationRate },
    { label: ar ? "معدل الوصول" : "Response Time", value: RESPONSE_TIME },
    { label: ar ? "معدل الاستجابة" : "Response Rate", value: RESPONSE_RATE, accent: true },
    { label: ar ? "عدد المشاريع" : "Projects", value: String(bookingStats.completed) },
    { label: ar ? "متوسط قيمة المشروع" : "Avg. Project Value", value: `${AVG_PROJECT_PRICE.toLocaleString()} EGP` },
  ];

  return (
    <div style={{ width: "100%", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {cells.map((c) => (
          <div
            key={c.label}
            onClick={c.onClick}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 10, borderRadius: 10, cursor: c.onClick ? "pointer" : undefined, textAlign: "center" }}
          >
            <span style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4 }}>{c.label}</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              {c.star && <Star size={14} color={GOLD} fill={GOLD} />}
              <span style={{ fontSize: 19, fontWeight: 900, color: c.accent ? "#34d399" : TEXT }}>{c.value}</span>
            </div>
            {c.sub && <span style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{c.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
