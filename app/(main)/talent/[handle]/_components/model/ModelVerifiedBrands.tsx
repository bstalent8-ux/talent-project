"use client";

// Pairs with ExperienceSection(variant="model") in the "Previous Shoots |
// Verified Through Talents" row — same row-list shape/tokens as that
// component (CARD/BORDER/GREEN/MUTED/SURFACE below are copy-matched to
// ExperienceSection.tsx's model branch on purpose, not the tile-grid layout
// from model/components/PreviousShoots.tsx).
//
// REAL when any talent_brands row has verified = true (admin-flagged).
// Until an admin verifies a real collaboration, falls back to 3 HARD-CODED
// placeholder rows (matching model/lib/model-data.ts's verifiedWork) so the
// card isn't empty — swap this out once verification is actually used.

import { CheckCircle } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { BrandItem } from "@/features/talent-profile/types";

const FALLBACK_AR: { name: string; year: string }[] = [
  { name: "L'AZUR", year: "يونيو 2026" },
  { name: "TechStore", year: "مايو 2026" },
  { name: "BeBold", year: "أبريل 2026" },
];
const FALLBACK_EN: { name: string; year: string }[] = [
  { name: "L'AZUR", year: "Jun 2026" },
  { name: "TechStore", year: "May 2026" },
  { name: "BeBold", year: "Apr 2026" },
];

export default function ModelVerifiedBrands({ brands }: { brands: BrandItem[] }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";

  const verifiedReal = brands.filter((b) => b.verified);
  const isFallback = verifiedReal.length === 0;
  const rows = isFallback
    ? (ar ? FALLBACK_AR : FALLBACK_EN).map((r, i) => ({ id: `fallback-${i}`, name: r.name, year: r.year }))
    : verifiedReal.map((b) => ({ id: b.id, name: b.name, year: b.year_collaborated }));

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, height: "100%" }}>
      <h3 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
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
                color: dark ? "#fff" : "#0F172A", fontSize: 13, fontWeight: 700,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {r.name}
              </span>
              {r.year && <span style={{ color: MUTED, fontSize: 12, flexShrink: 0 }}>· {r.year}</span>}
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
              backgroundColor: "rgba(0,210,106,0.12)", color: GREEN, border: `1px solid ${GREEN}55`,
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
