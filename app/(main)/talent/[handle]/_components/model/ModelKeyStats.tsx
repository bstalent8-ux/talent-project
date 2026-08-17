"use client";

// Port of model/components/KeyStats.tsx's 6-cell strip. Source cells are
// rating, cancellationRate, responseTime, responseRate, projectsCount,
// avgProjectPrice — only rating/reviewCount/projectsCount(=completed
// bookings) are tracked anywhere. cancellationRate/responseTime/
// responseRate/avgProjectPrice have no backing column or aggregate
// anywhere in the schema, so they're replaced with real numbers
// (totalBookings, profileViews) rather than invented.

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

  const cells = [
    { label: ar ? "التقييم العام" : "Rating", value: talent.rating > 0 ? talent.rating.toFixed(1) : "—", sub: `(${talent.reviewCount} ${ar ? "تقييم" : "reviews"})`, onClick: onOpenReviews, star: true },
    { label: ar ? "المشاريع المكتملة" : "Completed", value: String(bookingStats.completed) },
    { label: ar ? "إجمالي الحجوزات" : "Total Bookings", value: String(bookingStats.total) },
    { label: ar ? "قيد التنفيذ" : "Pending", value: String(bookingStats.pending) },
    { label: ar ? "مشاهدات الملف" : "Profile Views", value: talent.views },
    { label: ar ? "الحالة" : "Status", value: talent.availability === "available" ? (ar ? "متاحة" : "Available") : (ar ? "غير متاحة" : "Unavailable"), accent: talent.availability === "available" },
  ];

  return (
    <div style={{ width: "100%", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        <style>{`@media (min-width:640px){.model-keystats{grid-template-columns:repeat(3,1fr) !important}}@media (min-width:1024px){.model-keystats{grid-template-columns:repeat(6,1fr) !important}}`}</style>
        <div className="model-keystats" style={{ display: "contents" }}>
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
    </div>
  );
}
