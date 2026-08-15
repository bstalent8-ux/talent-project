"use client";
import { useState } from "react";
import { Star, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { Review } from "@/features/talent-profile/types";

interface Props {
  reviews: Review[];
  rating?: number;
  /** "model" swaps the sidebar one-at-a-time carousel for a full-width main-
   * column block showing a concise set of reviews as cards — meant to sit
   * beneath Packages, same visual weight. UGC/legacy keep the exact prior
   * carousel card (unchanged code path below). */
  variant?: "default" | "model";
}

export default function ReviewsCard({ reviews, rating = 0, variant = "default" }: Props) {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const ar = lang === "ar";
  const isModel = variant === "model";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const GOLD = "#F4B740";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const [idx, setIdx] = useState(0);
  const review = reviews[idx];

  // No reviews means no rating either, so the whole card would be a zero.
  if (reviews.length === 0) return null;

  if (isModel) {
    const TEAL = "var(--color-primary)";
    const MGOLD = "var(--color-secondary)";
    const MCARD = "var(--bg-card)";
    const MBORDER = "var(--border-subtle)";
    const MTEXT = "var(--text-primary)";
    const MMUTED = "var(--text-muted)";
    const shown = reviews.slice(0, 3);

    return (
      <section style={{ backgroundColor: MCARD, border: `1px solid ${MBORDER}`, borderRadius: 16, padding: isMobile ? 16 : 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
          <div>
            <h2 style={{ color: MTEXT, fontSize: 18, fontWeight: 800, margin: "0 0 2px" }}>
              {ar ? "التقييمات" : "Reviews"}
            </h2>
            <span style={{ color: MMUTED, fontSize: 12 }}>{reviews.length} {ar ? "تقييم" : "reviews"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: MGOLD, fontSize: 20, fontWeight: 900 }}>{rating.toFixed(1)}</span>
            <div style={{ display: "flex" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={13} color={MGOLD} fill={s <= Math.round(rating) ? MGOLD : "transparent"} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${shown.length}, 1fr)`, gap: 14 }}>
          {shown.map((r) => (
            <div key={r.id} style={{ backgroundColor: "var(--bg-card-muted)", border: `1px solid ${MBORDER}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                  border: `1px solid ${TEAL}`, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: TEAL,
                }}>
                  {r.author[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: MTEXT, fontSize: 12.5, fontWeight: 700, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.author}
                  </p>
                  {r.date && <p style={{ color: MMUTED, fontSize: 11, margin: 0 }}>{r.date}</p>}
                </div>
                <div style={{ marginInlineStart: "auto", display: "flex", flexShrink: 0 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={10} color={s <= r.rating ? MGOLD : MMUTED} fill={s <= r.rating ? MGOLD : "transparent"} />
                  ))}
                </div>
              </div>
              {r.text && (
                <p style={{ color: MMUTED, fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>&quot;{r.text}&quot;</p>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div
      style={{
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 22,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h3 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 16, fontWeight: 800, margin: "0 0 2px" }}>
            {ar ? "التقييمات" : "Reviews"}
          </h3>
          <span style={{ color: MUTED, fontSize: 12 }}>
            {reviews.length} {ar ? "تقييم" : "reviews"}
          </span>
        </div>
        {reviews.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: GOLD, fontSize: 22, fontWeight: 900 }}>{rating.toFixed(1)}</span>
            <div style={{ display: "flex" }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={13} color={GOLD}
                  fill={s <= Math.floor(rating) ? GOLD : s - 0.5 <= rating ? GOLD : "transparent"}
                  opacity={s - 0.5 <= rating && s > Math.floor(rating) ? 0.5 : 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {reviews.length > 0 && <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          style={{
            backgroundColor: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "rgba(0,210,106,0.15)",
                border: "1px solid rgba(0,210,106,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: GREEN,
              }}
            >
              {review.author[0]}
            </div>
            <div>
              <p style={{ color: dark ? "#fff" : "#0F172A", fontSize: 13, fontWeight: 700, margin: 0 }}>
                {review.author}
              </p>
              <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>
                {review.brand} · {review.date}
              </p>
            </div>
            <div style={{ marginRight: "auto", display: "flex" }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  size={11}
                  color={s <= review.rating ? GOLD : MUTED}
                  fill={s <= review.rating ? GOLD : "transparent"}
                />
              ))}
            </div>
          </div>
          <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            &quot;{review.text}&quot;
          </p>
        </motion.div>
      </AnimatePresence>}

      {/* Carousel nav */}
      {reviews.length > 1 &&
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          marginTop: 14,
        }}
      >
        <button
          onClick={() => setIdx(i => Math.max(0, i - 1))}
          disabled={idx === 0}
          style={{
            background: "none",
            border: "none",
            color: idx === 0 ? MUTED : GREEN,
            cursor: idx === 0 ? "default" : "pointer",
            opacity: idx === 0 ? 0.4 : 1,
          }}
        >
          <ChevronRight size={18} />
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === idx ? GREEN : "rgba(168,179,194,0.3)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setIdx(i => Math.min(reviews.length - 1, i + 1))}
          disabled={idx === reviews.length - 1}
          style={{
            background: "none",
            border: "none",
            color: idx === reviews.length - 1 ? MUTED : GREEN,
            cursor: idx === reviews.length - 1 ? "default" : "pointer",
            opacity: idx === reviews.length - 1 ? 0.4 : 1,
          }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>}
    </div>
  );
}
