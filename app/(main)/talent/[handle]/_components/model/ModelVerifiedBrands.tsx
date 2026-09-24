"use client";

// Pairs with ExperienceSection(variant="model") in the "Previous Shoots |
// Verified Through Talents" row — same row-list shape/tokens as that
// component (CARD/BORDER/GREEN/MUTED/SURFACE below are copy-matched to
// ExperienceSection.tsx's model branch on purpose, not the tile-grid layout
// from model/components/PreviousShoots.tsx).
//
// Real only: a row shows when a talent_brands row has verified = true
// (admin-flagged). No hard-coded placeholder rows — this section renders
// nothing until an admin actually verifies a real collaboration, rather than
// showing the same 3 fake brand names on every model's profile.

import { CheckCircle } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { BrandItem } from "@/features/talent-profile/types";

export default function ModelVerifiedBrands({ brands }: { brands: BrandItem[] }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "rgba(79,167,163,0.15)" : "#E6DCC3";
  const GREEN = "var(--color-primary-text)";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  const SURFACE = dark ? "#231A16" : "#F6F0DD";

  const rows = brands
    .filter((b) => b.verified)
    .map((b) => ({ id: b.id, name: b.name, year: b.year_collaborated }));

  if (rows.length === 0) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, height: "100%" }}>
      <h3 style={{ color: dark ? "#fff" : "#2B211D", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
        {ar ? "موثّق عبر Talents" : "Verified Through Talents"}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <div
            key={r.id}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", backgroundColor: SURFACE, borderRadius: 10, border: `1px solid ${BORDER}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{
                color: dark ? "#fff" : "#2B211D", fontSize: 13, fontWeight: 700,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {r.name}
              </span>
              {r.year && <span style={{ color: MUTED, fontSize: 12, flexShrink: 0 }}>· {r.year}</span>}
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
              backgroundColor: "rgba(8,127,131,0.12)", color: GREEN, border: `1px solid color-mix(in srgb, ${GREEN} 33%, transparent)`,
              borderRadius: 999, padding: "3px 9px", fontSize: 10.5, fontWeight: 800,
            }}>
              <CheckCircle size={11} />{ar ? "موثّق" : "VERIFIED"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
