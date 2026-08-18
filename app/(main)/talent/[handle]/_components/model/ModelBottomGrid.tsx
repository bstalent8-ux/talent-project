"use client";

// 2-col row: compact Reviews (REAL review rows) and Performance (real
// cancellation rate from bookingStats + admin-managed model_metrics). The
// Reviews card starts compact and expands in place to avoid dumping every
// review into the page on first load.

import { useState } from "react";
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
  const [reviewsExpanded, setReviewsExpanded] = useState(false);

  const cancellationRate = bookingStats.total > 0
    ? Math.round((bookingStats.cancelled / bookingStats.total) * 100)
    : 0;

  const performance: { label: string; pct: number }[] = [
    { label: ar ? "\u0645\u0639\u062f\u0644 \u0627\u0644\u0625\u0644\u063a\u0627\u0621" : "Cancellation Rate", pct: cancellationRate },
  ];
  if (modelMetrics?.repeatClientRate !== null && modelMetrics?.repeatClientRate !== undefined) {
    performance.push({ label: ar ? "\u0639\u0645\u0644\u0627\u0621 \u0645\u062a\u0643\u0631\u0631\u0648\u0646" : "Repeat Clients", pct: modelMetrics.repeatClientRate });
  }
  if (modelMetrics?.onTimeRate !== null && modelMetrics?.onTimeRate !== undefined) {
    performance.push({ label: ar ? "\u062a\u0633\u0644\u064a\u0645 \u0641\u064a \u0627\u0644\u0645\u0648\u0639\u062f" : "On-time Delivery", pct: modelMetrics.onTimeRate });
  }
  if (modelMetrics?.noShowRate !== null && modelMetrics?.noShowRate !== undefined) {
    performance.push({ label: ar ? "\u0645\u0639\u062f\u0644 \u0639\u062f\u0645 \u0627\u0644\u062d\u0636\u0648\u0631" : "No Show Rate", pct: modelMetrics.noShowRate });
  }
  if (modelMetrics?.responseRate !== null && modelMetrics?.responseRate !== undefined) {
    performance.push({ label: ar ? "\u0645\u0639\u062f\u0644 \u0627\u0644\u0627\u0633\u062a\u062c\u0627\u0628\u0629" : "Response Rate", pct: modelMetrics.responseRate });
  }

  const visibleReviews = reviewsExpanded ? reviews : reviews.slice(0, 1);
  const hasMoreReviews = reviews.length > visibleReviews.length;
  const canCollapseReviews = reviewsExpanded && reviews.length > 1;
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const reviewActionLabel = reviewsExpanded
    ? (ar ? "\u0639\u0631\u0636 \u0623\u0642\u0644" : "Show Less")
    : (ar ? "\u0639\u0631\u0636 \u0643\u0644 \u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a" : "View All Reviews");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
      <style>{`@media (max-width:700px){.model-bottom-grid{grid-template-columns:1fr !important}}`}</style>
      <div className="model-bottom-grid" style={{ display: "contents" }}>

        {/* Reviews */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ color: TEXT, fontSize: 13.5, fontWeight: 800, margin: 0 }}>
                {ar ? "\u0627\u0644\u062a\u0642\u064a\u064a\u0645\u0627\u062a" : "Reviews"} ({reviewCount})
              </h3>
              {reviews.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ color: GOLD, fontSize: 11.5, fontWeight: 800 }}>{averageRating.toFixed(1)}</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={9} color={GOLD} fill={i < Math.round(averageRating) ? GOLD : "none"} />
                  ))}
                </div>
              )}
            </div>
            {(hasMoreReviews || canCollapseReviews) && (
              <button
                type="button"
                onClick={() => setReviewsExpanded((open) => !open)}
                style={{
                  background: "none", border: "none", padding: 0, color: GOLD,
                  fontSize: 11.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                {reviewActionLabel}
              </button>
            )}
          </div>

          {visibleReviews.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleReviews.map((review) => (
                <div key={review.id} style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(216,155,55,0.14)", border: `1px solid ${GOLD}55`, color: GOLD, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {(review.brand || review.author || "R").slice(0, 4).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: TEXT, fontSize: 11.5, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{review.brand || review.author}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                          <span style={{ color: GOLD, fontSize: 11, fontWeight: 800 }}>{review.rating.toFixed(1)}</span>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={9} color={GOLD} fill={i < Math.round(review.rating) ? GOLD : "none"} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span style={{ color: MUTED, fontSize: 10, flexShrink: 0 }}>{review.date}</span>
                  </div>
                  {review.text && <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.6, margin: 0 }}>&quot;{review.text}&quot;</p>}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: MUTED, fontSize: 12 }}>{ar ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0642\u064a\u064a\u0645\u0627\u062a \u0628\u0639\u062f" : "No reviews yet"}</p>
          )}
        </div>

        {/* Performance - real cancellation rate + admin-managed metrics */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 18 }}>
          <h3 style={{ color: TEXT, fontSize: 13.5, fontWeight: 800, margin: "0 0 14px" }}>{ar ? "\u0627\u0644\u0623\u062f\u0627\u0621" : "Performance"}</h3>
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
