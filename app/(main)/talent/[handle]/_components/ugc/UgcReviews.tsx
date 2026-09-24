"use client";

// ─── Reviews ───────────────────────────────────────────────────────────────
// Card matching the approved reference: "Reviews (N)" + "View All", each review
// with a brand logo, brand name, package line, score + stars, quote, date and a
// "Recommended" tag. Real reviews only:
//   - logo        → the matching talent_brands logo, else the brand's initial
//   - package     → not stored with a review, so that line reads "No content"
//   - Recommended → shown for 4-5 star reviews
// No reviews → the card says "No content".

import { useState } from "react";
import { Star } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { Review, BrandItem } from "@/features/talent-profile/types";

const PURPLE = "var(--color-primary-text)";
const GOLD = "var(--color-accent-strong)";
const VISIBLE = 2;

function findLogo(names: string[], brands: BrandItem[]): string | null {
  const hit = brands.find((b) => b.logo_url && names.some((n) => n && n.toLowerCase().includes(b.name.toLowerCase())));
  return hit?.logo_url ?? null;
}

export default function UgcReviews({ reviews, brands = [] }: { reviews: Review[]; rating?: number; brands?: BrandItem[] }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "rgba(255,255,255,0.10)" : "#E6DCC3";
  const TEXT = dark ? "#fff" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const noContent = ar ? "لا يوجد محتوى" : "No content";
  const [open, setOpen] = useState(false);

  const canExpand = reviews.length > VISIBLE;
  const visible = open ? reviews : reviews.slice(0, VISIBLE);

  return (
    <section id="ugc-reviews" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: 0 }}>
          {ar ? "التقييمات" : "Reviews"}
          <span style={{ color: MUTED, fontSize: 14, fontWeight: 500, marginInlineStart: 6 }}>({reviews.length})</span>
        </h2>
        {canExpand && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{ background: "none", border: "none", padding: 0, color: PURPLE, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
          >
            {open ? (ar ? "عرض أقل" : "Show Less") : (ar ? "عرض الكل" : "View All")}
          </button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>{noContent}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {visible.map((r, i) => {
            const logo = findLogo([r.author, r.brand], brands);
            const initial = (r.author || r.brand || "?").trim().charAt(0).toUpperCase();
            return (
              <div key={r.id} style={{ display: "flex", gap: 14, padding: "16px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER}`, paddingTop: i === 0 ? 0 : 16 }}>
                <div style={{ width: 54, height: 54, borderRadius: "50%", backgroundColor: "#1B1310", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {logo ? (
                    <img src={logo} alt={r.author} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>{initial}</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: TEXT, fontSize: 15, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.author}</div>
                      <div style={{ color: MUTED, fontSize: 12.5, marginTop: 3 }}>{noContent}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ color: TEXT, fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{r.rating.toFixed(1)}</span>
                      <span style={{ display: "flex", gap: 1 }}>
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={14} color={s <= Math.round(r.rating) ? GOLD : MUTED} fill={s <= Math.round(r.rating) ? GOLD : "transparent"} />)}
                      </span>
                    </div>
                  </div>

                  <p style={{ color: TEXT, fontSize: 13.5, lineHeight: 1.55, margin: "10px 0 0" }}>
                    {r.text ? `"${r.text}"` : noContent}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                    <span style={{ color: MUTED, fontSize: 12 }}>{r.date}</span>
                    {r.rating >= 4 && (
                      <span style={{ padding: "3px 10px", borderRadius: 6, backgroundColor: dark ? "rgba(30,166,114,0.16)" : "#E1F3EA", color: dark ? "var(--color-success)" : "var(--color-success)", fontSize: 11.5, fontWeight: 700 }}>
                        {ar ? "موصى به" : "Recommended"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
