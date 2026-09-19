"use client";

// Reviews | Career Timeline | Performance — three cards in one row, built to
// the approved reference. Real data only: review rows come from approved
// reviews, Cancellation Rate from bookings, the rest from admin-managed
// talent_profiles.model_metrics; anything without a value reads "No content".

import { useState } from "react";
import { Star, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { BookingStats, BrandItem, ExperienceItem, ModelMetrics, Review } from "@/features/talent-profile/types";
import ModelCareerTimeline from "./ModelCareerTimeline";

const GOLD = "#d89b37";
const ORANGE = "#f26b3a";

interface Props {
  reviews: Review[];
  reviewCount: number;
  bookingStats: BookingStats;
  modelMetrics?: ModelMetrics;
  registeredAt: string | null;
  brands: BrandItem[];
  experience?: ExperienceItem[] | null;
}

export default function ModelBottomGrid({ reviews, reviewCount, bookingStats, modelMetrics, registeredAt, brands, experience }: Props) {
  const compact = useIsMobile(1100);
  const phone = useIsMobile(700);
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "var(--bg-card)" : "#FFFFFF";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const noContent = ar ? "لا يوجد محتوى" : "No content";
  const [open, setOpen] = useState(false);

  const cancellationRate = bookingStats.total > 0 ? Math.round((bookingStats.cancelled / bookingStats.total) * 100) : 0;
  const pct = (v: number | null | undefined) => (v !== null && v !== undefined ? `${Math.round(v)}%` : null);

  const performance: { label: string; value: string | null }[] = [
    { label: ar ? "عملاء متكررون" : "Repeat Clients", value: pct(modelMetrics?.repeatClientRate) },
    { label: ar ? "معدل الإلغاء" : "Cancellation Rate", value: `${cancellationRate}%` },
    { label: ar ? "تسليم في الموعد" : "On-time Delivery", value: pct(modelMetrics?.onTimeRate ?? modelMetrics?.autoOnTimeRate) },
    { label: ar ? "معدل عدم الحضور" : "No Show Rate", value: pct(modelMetrics?.noShowRate) },
    { label: ar ? "معدل التأخر" : "Late Arrival Rate", value: null },
    { label: ar ? "معدل الاستجابة" : "Response Rate", value: pct(modelMetrics?.responseRate) },
  ];

  const visible = open ? reviews : reviews.slice(0, 1);
  const canToggle = reviews.length > 1;
  const cardStyle = { backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20, minWidth: 0 } as const;
  const head = { color: TEXT, fontSize: 15, fontWeight: 800, margin: 0 } as const;

  return (
    <div style={{ display: "grid", gridTemplateColumns: phone ? "minmax(0,1fr)" : compact ? "repeat(2, minmax(0,1fr))" : "repeat(3, minmax(0,1fr))", gap: 16, alignItems: "start" }}>
      {/* Reviews */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16 }}>
          <h3 style={head}>{ar ? "التقييمات" : "Reviews"} <span style={{ color: MUTED, fontWeight: 500 }}>({reviewCount})</span></h3>
          {canToggle && (
            <button type="button" onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", padding: 0, color: GOLD, fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}>
              {open ? (ar ? "عرض أقل" : "Show Less") : (ar ? "عرض الكل" : "View All")}
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div style={{ padding: "22px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{noContent}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {visible.map((review) => {
              const name = review.brand || review.author;
              return (
                <div key={review.id}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      <span style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#0A0E1A", color: "#fff", fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${BORDER}` }}>
                        {(name || "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: TEXT, fontSize: 14, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                          <span style={{ color: TEXT, fontSize: 12.5, fontWeight: 700 }}>{review.rating.toFixed(1)}</span>
                          <span style={{ display: "flex", gap: 1 }}>
                            {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} color={GOLD} fill={i < Math.round(review.rating) ? GOLD : "none"} />)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span style={{ color: MUTED, fontSize: 11.5, flexShrink: 0, whiteSpace: "nowrap" }}>{review.date}</span>
                  </div>
                  <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: "12px 0 0" }}>{review.text ? review.text : noContent}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ModelCareerTimeline registeredAt={registeredAt} brands={brands} experience={experience} />

      {/* Performance */}
      <div style={cardStyle}>
        <h3 style={{ ...head, marginBottom: 16 }}>{ar ? "الأداء" : "Performance"}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {performance.map((m) => (
            <div key={m.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10, color: TEXT, fontSize: 13, fontWeight: 600, minWidth: 0 }}>
                <span style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={11} color="#fff" strokeWidth={3.5} />
                </span>
                {m.label}
              </span>
              <span style={{ color: m.value ? TEXT : MUTED, fontSize: m.value ? 13.5 : 12, fontWeight: m.value ? 800 : 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {m.value ?? noContent}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
