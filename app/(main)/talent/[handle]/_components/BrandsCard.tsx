"use client";
import { motion } from "framer-motion";
import { useSite } from "@/contexts/SiteContext";
import type { BrandItem } from "@/features/talent-profile/types";

const COLORS = ["#FFB800", "#1565C0", "#D32F2F", "#00D26A", "#9C27B0", "#E91E63"];

export default function BrandsCard({ brands }: { brands: BrandItem[] }) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <h3 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
        {ar ? "براندات تعاونت معها" : "Collaborated Brands"}
      </h3>

      {brands.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "20px 0",
          color: MUTED, fontSize: 13,
        }}>
          {ar ? "لا توجد براندات مسجلة بعد" : "No brands registered yet"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {brands.slice(0, 6).map((brand, i) => (
            <motion.div
              key={brand.id}
              whileHover={{ scale: 1.04 }}
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "14px 8px",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 6,
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                backgroundColor: COLORS[i % COLORS.length] + "22",
                border: `1px solid ${COLORS[i % COLORS.length]}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 900,
                color: COLORS[i % COLORS.length],
              }}>
                {brand.name[0]}
              </div>
              <span style={{ color: MUTED, fontSize: 11, fontWeight: 600, textAlign: "center" }}>
                {brand.name}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
