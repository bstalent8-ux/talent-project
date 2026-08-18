"use client";

// Port of model/components/KeyStats.tsx's 6-cell strip. Every cell is either
// a real, automatically-derived number, or an admin-entered
// talent_profiles.model_metrics field — a cell renders only when its value
// actually exists; nothing here is a hardcoded fallback number (see
// CLAUDE.md's model-profile report on the removal of the old placeholders).

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
  const metrics = talent.modelMetrics;

  // Real, always derivable.
  const cancellationRate = bookingStats.total > 0
    ? `${Math.round((bookingStats.cancelled / bookingStats.total) * 100)}%`
    : "0%";

  const cells: { label: string; value: string; sub?: string; onClick?: () => void; star?: boolean; accent?: boolean }[] = [
    { label: ar ? "تقييم عام" : "Rating", value: talent.rating > 0 ? talent.rating.toFixed(1) : "—", sub: `(${talent.reviewCount} ${ar ? "تقييم" : "reviews"})`, onClick: onOpenReviews, star: true },
    { label: ar ? "معدل الإلغاء" : "Cancellation Rate", value: cancellationRate },
    { label: ar ? "المشاريع المكتملة" : "Completed Projects", value: String(bookingStats.completed) },
    { label: ar ? "إجمالي الحجوزات" : "Total Bookings", value: String(bookingStats.total) },
    { label: ar ? "مشاهدات الملف" : "Profile Views", value: talent.views },
  ];

  // Admin-managed (talent_profiles.model_metrics) — only rendered when the
  // admin has actually entered a value for that field.
  if (metrics?.responseTimeLabel) {
    cells.push({ label: ar ? "معدل الوصول" : "Response Time", value: metrics.responseTimeLabel });
  }
  if (metrics?.responseRate !== null && metrics?.responseRate !== undefined) {
    cells.push({ label: ar ? "معدل الاستجابة" : "Response Rate", value: `${metrics.responseRate}%`, accent: true });
  }
  if (metrics?.avgProjectValue !== null && metrics?.avgProjectValue !== undefined) {
    cells.push({ label: ar ? "متوسط قيمة المشروع" : "Avg. Project Value", value: `${metrics.avgProjectValue.toLocaleString()} EGP` });
  }

  return (
    <div style={{ width: "100%", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 10px" }}>
      <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "1fr", gap: 4 }}>
        {cells.map((c) => (
          <div
            key={c.label}
            onClick={c.onClick}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4px 2px", borderRadius: 10, cursor: c.onClick ? "pointer" : undefined, textAlign: "center", minWidth: 0 }}
          >
            <span style={{ fontSize: 9, color: MUTED, fontWeight: 600, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{c.label}</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              {c.star && <Star size={11} color={GOLD} fill={GOLD} />}
              <span style={{ fontSize: 14, fontWeight: 900, color: c.accent ? "#34d399" : TEXT, whiteSpace: "nowrap" }}>{c.value}</span>
            </div>
            {c.sub && <span style={{ fontSize: 8, color: MUTED, marginTop: 1, whiteSpace: "nowrap" }}>{c.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
