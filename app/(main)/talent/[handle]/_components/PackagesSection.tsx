"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { PackageItem } from "@/features/talent-profile/types";

type Package = PackageItem;

interface Props {
  onSelect: (pkg: Package) => void;
  packages?: Package[] | null;
}

export default function PackagesSection({ onSelect, packages }: Props) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const data = packages ?? [];

  return (
    <div
      style={{
        backgroundColor: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 24,
      }}
    >
      <h2
        style={{
          color: dark ? "#fff" : "#0F172A",
          fontSize: 18,
          fontWeight: 800,
          marginBottom: 20,
          margin: "0 0 20px",
        }}
      >
        {ar ? "الباقات والأسعار" : "Packages & Prices"}
      </h2>
      {data.length === 0 && (
        <p style={{ color: MUTED, fontSize: 14, textAlign: "center", padding: "32px 0" }}>
          {ar ? "لا توجد باقات متاحة حالياً" : "No packages available yet"}
        </p>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
          gap: 16,
        }}
      >
        {data.map((pkg, i) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            style={{
              backgroundColor: pkg.popular ? "rgba(0,210,106,0.06)" : SURFACE,
              border: `1px solid ${pkg.popular ? GREEN : BORDER}`,
              borderRadius: 14,
              padding: 20,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {pkg.popular && (
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: GREEN,
                  color: "#000",
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "3px 12px",
                  borderRadius: 20,
                  whiteSpace: "nowrap",
                }}
              >
                {ar ? "الأكثر طلباً" : "Most Popular"}
              </div>
            )}
            <div>
              <p style={{ color: MUTED, fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                {pkg.name}
              </p>
              <p
                style={{
                  color: pkg.popular ? GREEN : (dark ? "#fff" : "#0F172A"),
                  fontSize: 26,
                  fontWeight: 900,
                  margin: 0,
                }}
              >
                {pkg.price}{" "}
                <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>{ar ? "جنيه" : "EGP"}</span>
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {pkg.features.map((f, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={13} color={GREEN} />
                  <span style={{ color: MUTED, fontSize: 12 }}>{f}</span>
                </div>
              ))}
            </div>
            <motion.button
              onClick={() => onSelect(pkg)}
              whileHover={{ translateY: -2 }}
              style={{
                backgroundColor: pkg.popular ? GREEN : "transparent",
                color: pkg.popular ? "#000" : GREEN,
                border: `1px solid ${pkg.popular ? GREEN : "rgba(0,210,106,0.3)"}`,
                borderRadius: 10,
                padding: "10px 0",
                width: "100%",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Cairo',sans-serif",
                transition: "all 0.2s",
              }}
            >
              {ar ? "اختر الباقة" : "Choose Package"}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
