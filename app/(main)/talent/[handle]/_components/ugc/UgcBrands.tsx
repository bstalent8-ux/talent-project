"use client";

// Port of ugc/untitled/components/BrandsWorkedWith.tsx — real BrandItem[]
// (talent_brands table) instead of the source's fixed 16-brand name list.

import { Building2 } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { BrandItem } from "@/features/talent-profile/types";

const VIOLET = "#7C3AED";
const COLORS = ["#7C3AED", "#0EA5E9", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];

export default function UgcBrands({ brands }: { brands: BrandItem[] }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";

  if (brands.length === 0) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <Building2 size={15} color={VIOLET} />{ar ? "التعاون مع البراندات" : "Brands I've Worked With"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {brands.slice(0, 9).map((b, i) => (
          <div key={b.id} style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            {b.logo_url ? (
              <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", border: `1px solid ${BORDER}`, backgroundImage: `url(${b.logo_url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: `${COLORS[i % COLORS.length]}22`, border: `1px solid ${COLORS[i % COLORS.length]}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: COLORS[i % COLORS.length] }}>
                {b.name[0]}
              </div>
            )}
            <span style={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textAlign: "center" }}>{b.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
