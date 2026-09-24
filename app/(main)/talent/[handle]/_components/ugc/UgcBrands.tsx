"use client";

// ─── Brands I've Worked With ───────────────────────────────────────────────
// Card matching the approved reference: a wrapping cloud of plain-text brand
// pills. Real talent_brands rows only; "and more..." shows when there are more
// brands than fit and expands the rest. No brands → the card says "No content".

import { useState } from "react";
import { useSite } from "@/contexts/SiteContext";
import type { BrandItem } from "@/features/talent-profile/types";

const PURPLE = "var(--color-primary-text)";
const VISIBLE = 14;

export default function UgcBrands({ brands, bare = false }: { brands: BrandItem[]; bare?: boolean }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "rgba(255,255,255,0.10)" : "#E6DCC3";
  const PILL_BORDER = dark ? "rgba(255,255,255,0.14)" : "#DDD1B7";
  const TEXT = dark ? "#fff" : "#2B211D";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const [expanded, setExpanded] = useState(false);

  const hasMore = brands.length > VISIBLE;
  const shown = expanded ? brands : brands.slice(0, VISIBLE);
  const pill = { padding: "8px 16px", borderRadius: 8, border: `1px solid ${PILL_BORDER}`, fontSize: 13.5, fontWeight: 600, backgroundColor: "transparent" } as const;

  const body = (
    <>
      <h2 style={{ color: TEXT, fontSize: 17, fontWeight: 800, margin: "0 0 18px" }}>{ar ? "براندات اشتغلت معاها" : "Brands I've Worked With"}</h2>

      {brands.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>
          {ar ? "لا يوجد محتوى" : "No content"}
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {shown.map((b) => (
            <span key={b.id} style={{ ...pill, color: TEXT }}>{b.name}</span>
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              style={{ ...pill, color: PURPLE, cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif" }}
            >
              {expanded ? (ar ? "عرض أقل" : "Show less") : (ar ? "وأكتر..." : "and more...")}
            </button>
          )}
        </div>
      )}
    </>
  );

  // bare: rendered inside a parent card that supplies the chrome.
  if (bare) return body;
  return (
    <section style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 22, minWidth: 0 }}>
      {body}
    </section>
  );
}
