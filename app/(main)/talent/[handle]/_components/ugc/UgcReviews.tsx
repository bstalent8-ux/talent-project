"use client";

// Port of ugc/untitled/components/ReviewsSection.tsx — real Review[] with a
// real per-star breakdown computed from that array. The source's inline
// "Write a Review" form is not reproduced: reviews are brand-authored after
// a completed booking (POST /api/bookings/[id]/review), not a public form
// on the profile — see CLAUDE.md §10.1.

import { Star, ShieldCheck } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { Review } from "@/features/talent-profile/types";

const VIOLET = "#7C3AED";
const GOLD = "#F4B740";

export default function UgcReviews({ reviews, rating }: { reviews: Review[]; rating: number }) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";

  if (reviews.length === 0) return null;

  const counts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);
  const maxCount = Math.max(...counts, 1);

  return (
    <section id="ugc-reviews" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: isMobile ? 16 : 24 }}>
      <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>{ar ? "تقييمات العملاء" : "Client Reviews"}</h2>
      <p style={{ color: MUTED, fontSize: 12, margin: "0 0 20px" }}>{reviews.length} {ar ? "تقييم موثّق" : "verified reviews"}</p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 24, padding: 16, borderRadius: 14, backgroundColor: SURFACE, border: `1px solid ${BORDER}`, marginBottom: 20, alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: TEXT, fontSize: 34, fontWeight: 900 }}>{rating.toFixed(1)}</div>
          <div style={{ display: "flex", gap: 2, justifyContent: "center", margin: "4px 0" }}>
            {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} color={GOLD} fill={s <= Math.round(rating) ? GOLD : "transparent"} />)}
          </div>
          <div style={{ color: MUTED, fontSize: 11 }}>{reviews.length} {ar ? "تقييم" : "reviews"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[5, 4, 3, 2, 1].map((star, i) => (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ color: MUTED, width: 40, flexShrink: 0 }}>{star} {ar ? "نجوم" : "stars"}</span>
              <div style={{ flex: 1, height: 6, backgroundColor: dark ? "#1a2535" : "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(counts[i] / maxCount) * 100}%`, backgroundColor: GOLD, borderRadius: 4 }} />
              </div>
              <span style={{ color: MUTED, width: 18, textAlign: "right", flexShrink: 0 }}>{counts[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviews.map((r) => (
          <div key={r.id} style={{ padding: 16, borderRadius: 14, backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, backgroundColor: `${VIOLET}22`, border: `1px solid ${VIOLET}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: VIOLET }}>
                  {r.author[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.author}</p>
                  <p style={{ color: MUTED, fontSize: 11, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <ShieldCheck size={11} color="#10B981" />{r.date}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", flexShrink: 0 }}>
                {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} color={s <= r.rating ? GOLD : MUTED} fill={s <= r.rating ? GOLD : "transparent"} />)}
              </div>
            </div>
            {r.text && <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: 0 }}>&quot;{r.text}&quot;</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
