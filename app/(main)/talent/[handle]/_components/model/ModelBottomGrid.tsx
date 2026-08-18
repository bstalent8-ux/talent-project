"use client";

// 2-col row: compact Reviews (REAL, first review — real brand/reviewer name,
// see talent.context.ts's toReviews fix) and Performance (real cancellation
// rate from bookingStats + admin-managed talent_profiles.model_metrics —
// every other row renders only when the admin actually entered a value; see
// CLAUDE.md's model-profile report). Career Timeline was dropped entirely —
// no achievement/milestone log table exists to back it.

import { Star } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { BookingStats, ModelMetrics, Review } from "@/features/talent-profile/types";

const GOLD = "#d89b37";

interface Props {
  reviews: Review[];
  reviewCount: number;
  bookingStats: BookingStats;
  modelMetrics?: ModelMetrics;
}

export default function ModelBottomGrid({ reviews, reviewCount, bookingStats, modelMetrics }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const SURFACE = dark ? "var(--bg-card-muted)" : "#F8FAFC";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const featured = reviews[0] ?? null;

  const cancellationRate = bookingStats.total > 0
    ? Math.round((bookingStats.cancelled / bookingStats.total) * 100)
    : 0;

  const performance: { label: string; pct: number }[] = [
    { label: ar ? "معدل الإلغاء" : "Cancellation Rate", pct: cancellationRate },
  ];
  if (modelMetrics?.repeatClientRate !== null && modelMetrics?.repeatClientRate !== undefined) {
    performance.push({ label: ar ? "عملاء متكررون" : "Repeat Clients", pct: modelMetrics.repeatClientRate });
  }
  if (modelMetrics?.onTimeRate !== null && modelMetrics?.onTimeRate !== undefined) {
    performance.push({ label: ar ? "تسليم في الموعد" : "On-time Delivery", pct: modelMetrics.onTimeRate });
  }
  if (modelMetrics?.noShowRate !== null && modelMetrics?.noShowRate !== undefined) {
    performance.push({ label: ar ? "معدل عدم الحضور" : "No Show Rate", pct: modelMetrics.noShowRate });
  }
  if (modelMetrics?.responseRate !== null && modelMetrics?.responseRate !== undefined) {
    performance.push({ label: ar ? "معدل الاستجابة" : "Response Rate", pct: modelMetrics.responseRate });
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
      <style>{`@media (max-width:700px){.model-bottom-grid{grid-template-columns:1fr !important}}`}</style>
      <div className="model-bottom-grid" style={{ display: "contents" }}>

        {/* Reviews */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h3 style={{ color: TEXT, fontSize: 13.5, fontWeight: 800, margin: 0 }}>Reviews ({reviewCount})</h3>
            <span style={{ color: GOLD, fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>{ar ? "عرض الكل" : "View all"}</span>
          </div>

          {featured ? (
            <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(216,155,55,0.14)", border: `1px solid ${GOLD}55`, color: GOLD, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {featured.brand.slice(0, 4).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: TEXT, fontSize: 11.5, fontWeight: 800 }}>{featured.brand}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                      <span style={{ color: GOLD, fontSize: 11, fontWeight: 800 }}>{featured.rating.toFixed(1)}</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={9} color={GOLD} fill={i < Math.round(featured.rating) ? GOLD : "none"} />
                      ))}
                    </div>
                  </div>
                </div>
                <span style={{ color: MUTED, fontSize: 10 }}>{featured.date}</span>
              </div>
              <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: 0 }}>&quot;{featured.text}&quot;</p>
            </div>
          ) : (
            <p style={{ color: MUTED, fontSize: 12 }}>{ar ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
          )}
        </div>

        {/* Performance — real cancellation rate + admin-managed metrics */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
          <h3 style={{ color: TEXT, fontSize: 13.5, fontWeight: 800, margin: "0 0 14px" }}>{ar ? "الأداء" : "Performance"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {performance.map((m) => (
              <div key={m.label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: MUTED, fontSize: 11.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: GOLD }} />{m.label}
                  </span>
                  <span style={{ color: TEXT, fontSize: 12, fontWeight: 800 }}>{m.pct}%</span>
                </div>
                <div style={{ width: "100%", height: 6, borderRadius: 999, backgroundColor: SURFACE, overflow: "hidden" }}>
                  <div style={{ width: `${m.pct}%`, height: "100%", borderRadius: 999, backgroundColor: "#10b981" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
