"use client";

// ─── Key stats strip ───────────────────────────────────────────────────────
// Six cells in one card, split by hairlines, built to the approved reference:
// Rating | Cancellation Rate | Response Time | Response Rate | Projects | Avg.
// Project Value. Every value is real — derived from bookings/reviews, or an
// admin-entered talent_profiles.model_metrics field — and a cell without a
// value reads "No content" instead of a made-up number.

import { Star } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { TalentData, BookingStats } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

interface Props {
  talent: TalentData;
  bookingStats: BookingStats;
  onOpenReviews?: () => void;
}

export default function ModelKeyStats({ talent, bookingStats, onOpenReviews }: Props) {
  const phone = useIsMobile(640);
  const compact = useIsMobile(1024);
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-surface)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const HAIR = dark ? "rgba(255,255,255,0.10)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const noContent = ar ? "لا يوجد محتوى" : "No content";
  const metrics = talent.modelMetrics;

  const cancellationRate = bookingStats.total > 0
    ? `${Math.round((bookingStats.cancelled / bookingStats.total) * 100)}%`
    : "0%";

  const cells: { label: string; value: string | null; sub?: string; star?: boolean; onClick?: () => void }[] = [
    {
      label: ar ? "تقييم عام" : "Rating",
      value: talent.rating > 0 ? talent.rating.toFixed(1) : null,
      sub: `(${talent.reviewCount} ${ar ? "تقييم" : "reviews"})`,
      star: true,
      onClick: onOpenReviews,
    },
    { label: ar ? "معدل الإلغاء" : "Cancellation Rate", value: cancellationRate },
    { label: ar ? "معدل الوصول" : "Response Time", value: metrics?.responseTimeLabel || null },
    { label: ar ? "معدل الاستجابة" : "Response Rate", value: metrics?.responseRate !== null && metrics?.responseRate !== undefined ? `${metrics.responseRate}%` : null },
    { label: ar ? "عدد المشاريع" : "Projects", value: String(bookingStats.completed) },
    { label: ar ? "متوسط قيمة المشروع" : "Avg. Project Value", value: metrics?.avgProjectValue !== null && metrics?.avgProjectValue !== undefined ? `${metrics.avgProjectValue.toLocaleString()} EGP` : null },
  ];

  const cols = phone ? 2 : compact ? 3 : 6;

  return (
    <div style={{ width: "100%", backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: phone ? "16px 8px" : "20px 12px", boxSizing: "border-box" }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, rowGap: 18 }}>
        {cells.map((c, i) => (
          <div
            key={c.label}
            onClick={c.onClick}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, textAlign: "center", minWidth: 0, padding: "2px 8px",
              borderInlineStart: i % cols === 0 ? "none" : `1px solid ${HAIR}`, cursor: c.onClick ? "pointer" : undefined,
            }}
          >
            <span style={{ fontSize: 12, color: MUTED, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{c.label}</span>
            {c.value === null ? (
              <span style={{ fontSize: 12.5, fontWeight: 700, color: MUTED }}>{noContent}</span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: phone ? 18 : 20, fontWeight: 800, lineHeight: 1.1, color: c.star ? GOLD : TEXT, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {c.star && <Star size={phone ? 18 : 21} color={GOLD} fill={GOLD} />}{c.value}
              </span>
            )}
            {c.sub && <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>{c.sub}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
