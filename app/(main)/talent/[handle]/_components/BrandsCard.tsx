"use client";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";
import type { BrandItem } from "@/features/talent-profile/types";

const COLORS = ["#FFB800", "#1565C0", "#D32F2F", "#00D26A", "#9C27B0", "#E91E63"];

interface Props {
  brands: BrandItem[];
  /** Model shows real logo_url/year_collaborated from talent_brands.
   * UGC/legacy keep the prior initial-circle, name-only card. */
  variant?: "default" | "model";
}

export default function BrandsCard({ brands, variant = "default" }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const isModel = variant === "model";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";

  if (brands.length === 0) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, height: isModel ? "100%" : undefined }}>
      <h3 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
        {ar ? "\u0627\u0644\u062a\u0639\u0627\u0648\u0646 \u0645\u0639 \u0627\u0644\u0628\u0631\u0627\u0646\u062f\u0627\u062a" : "Brand Collaborations"}
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {brands.slice(0, 6).map((brand, i) => (
          <motion.div
            key={brand.id}
            whileHover={{ scale: 1.04 }}
            style={{
              position: "relative",
              backgroundColor: SURFACE,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: "14px 8px",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 6,
              cursor: "pointer",
            }}
          >
            {brand.verified && (
              <span style={{
                position: "absolute", top: 6, insetInlineEnd: 6,
                display: "inline-flex", alignItems: "center", gap: 3,
                backgroundColor: "rgba(0,210,106,0.14)", color: "#00D26A",
                border: "1px solid rgba(0,210,106,0.35)",
                borderRadius: 999, padding: "1px 6px",
                fontSize: 8.5, fontWeight: 800, letterSpacing: 0.2,
              }}>
                {ar ? "\u0645\u0648\u062b\u0651\u0642" : "VERIFIED"}
              </span>
            )}
            {isModel && brand.logo_url ? (
              <div style={{
                width: 38, height: 38, borderRadius: "50%", overflow: "hidden",
                border: `1px solid ${BORDER}`, flexShrink: 0,
                backgroundColor: dark ? "rgba(255,255,255,0.94)" : "#FFFFFF",
                padding: 5,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img
                  src={brand.logo_url}
                  alt={`${brand.name} logo`}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                />
              </div>
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                backgroundColor: isModel ? "color-mix(in srgb, var(--color-primary) 15%, transparent)" : COLORS[i % COLORS.length] + "22",
                border: isModel ? "1px solid var(--color-primary)" : `1px solid ${COLORS[i % COLORS.length]}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 900,
                color: isModel ? "var(--color-primary)" : COLORS[i % COLORS.length],
              }}>
                {brand.name[0]}
              </div>
            )}
            <span style={{ color: MUTED, fontSize: 11, fontWeight: 600, textAlign: "center" }}>
              {brand.name}
            </span>
            {isModel && brand.year_collaborated && (
              <span style={{ color: MUTED, fontSize: 10, opacity: 0.8 }}>{brand.year_collaborated}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
