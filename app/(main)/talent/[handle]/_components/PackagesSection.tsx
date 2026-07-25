"use client";

import { useState } from "react";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const data = packages ?? [];

  const card = dark ? "#0D1623" : "#FFFFFF";
  const border = dark ? "rgba(0,201,177,0.16)" : "#E2E8F0";
  const muted = dark ? "#A8B3C2" : "#64748B";
  const teal = "#00C9B1";
  const orange = "#FF6B2B";
  const purple = "#8B2FC9";
  const selectedPackageId = selectedId ?? data.find((pkg) => pkg.popular)?.id ?? null;

  const handleSelect = (pkg: Package) => {
    setSelectedId(pkg.id);
    onSelect(pkg);
  };

  return (
    <section
      style={{
        background: dark
          ? `linear-gradient(145deg, ${card} 0%, #101A2C 52%, #111728 100%)`
          : "linear-gradient(145deg, #FFFFFF 0%, #FFF7F2 48%, #F0F7FF 100%)",
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: isMobile ? 18 : 26,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2
            style={{
              color: dark ? "#FFFFFF" : "#0F172A",
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1.2,
              margin: "0 0 8px",
            }}
          >
            {ar ? "الباقات والأسعار" : "Packages & Prices"}
          </h2>
          <p style={{ color: muted, fontSize: 13, margin: 0, maxWidth: 560 }}>
            {ar
              ? "اختار الباقة المناسبة للحملة. الكارد المختار هيكبر ويتحوّل للون مميز من ألوان الهوم."
              : "Pick the right campaign package. The selected card grows and switches into the highlighted home palette."}
          </p>
        </div>

        <div
          aria-label={ar ? "مدة الباقة" : "Billing period"}
          style={{
            display: "inline-flex",
            gap: 4,
            padding: 4,
            borderRadius: 999,
            backgroundColor: dark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
          }}
        >
          <span
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              backgroundColor: purple,
              color: "#FFFFFF",
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            {ar ? "شهري" : "Monthly"}
          </span>
          <span style={{ padding: "6px 14px", color: muted, fontSize: 11, fontWeight: 900 }}>
            {ar ? "سنوي" : "Yearly"}
          </span>
        </div>
      </div>

      {data.length === 0 && (
        <p style={{ color: muted, fontSize: 14, textAlign: "center", padding: "32px 0" }}>
          {ar ? "لا توجد باقات متاحة حالياً" : "No packages available yet"}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 14 : 0,
          alignItems: "center",
          padding: isMobile ? 0 : "8px 10px 12px",
        }}
      >
        {data.map((pkg, index) => {
          const selected = selectedPackageId === pkg.id;
          const accent = index % 3 === 0 ? teal : index % 3 === 1 ? orange : purple;

          return (
            <motion.article
              key={pkg.id}
              onClick={() => handleSelect(pkg)}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: selected && !isMobile ? 1.08 : 1,
              }}
              transition={{
                delay: index * 0.07,
                type: "spring",
                stiffness: 210,
                damping: 22,
              }}
              whileHover={{ y: -4 }}
              style={{
                background: selected
                  ? `linear-gradient(160deg, #21164F 0%, ${purple} 62%, ${orange} 130%)`
                  : "rgba(255,255,255,0.9)",
                color: selected ? "#FFFFFF" : "#231846",
                border: `1px solid ${selected ? "rgba(255,255,255,0.18)" : "rgba(35,24,70,0.08)"}`,
                borderRadius: 16,
                boxShadow: selected
                  ? "0 10px 8px rgba(0,0,0,0.18)"
                  : "0 6px 8px rgba(15,23,42,0.06)",
                padding: selected ? 24 : 22,
                minHeight: selected ? 300 : 274,
                position: "relative",
                zIndex: selected ? 2 : 1,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {(pkg.popular || selected) && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    insetInlineEnd: 12,
                    backgroundColor: selected ? "rgba(255,255,255,0.16)" : "rgba(139,47,201,0.12)",
                    color: selected ? "#FFFFFF" : purple,
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "4px 10px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                  }}
                >
                  {selected ? (ar ? "الباقة المختارة" : "Selected Plan") : ar ? "الأكثر طلباً" : "Most Popular"}
                </div>
              )}

              <div>
                <p
                  style={{
                    color: selected ? "rgba(255,255,255,0.8)" : "#6B5F83",
                    fontSize: 13,
                    fontWeight: 800,
                    margin: "0 0 8px",
                  }}
                >
                  {pkg.name}
                </p>
                <p
                  style={{
                    color: selected ? "#FFFFFF" : "#241447",
                    fontSize: selected ? 32 : 29,
                    lineHeight: 1,
                    fontWeight: 950,
                    margin: 0,
                  }}
                >
                  {pkg.price}
                  <span
                    style={{
                      color: selected ? "rgba(255,255,255,0.76)" : "#7B7191",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {" "}
                    {ar ? "جنيه" : "EGP"}
                  </span>
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                {pkg.features.map((feature, featureIndex) => (
                  <div key={featureIndex} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 18,
                        height: 18,
                        borderRadius: 999,
                        backgroundColor: selected ? "rgba(255,255,255,0.14)" : `${accent}22`,
                        flex: "0 0 auto",
                      }}
                    >
                      <Check size={12} color={selected ? "#FFFFFF" : accent} />
                    </span>
                    <span
                      style={{
                        color: selected ? "rgba(255,255,255,0.86)" : "#5A506F",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <motion.button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleSelect(pkg);
                }}
                whileHover={{ translateY: -2 }}
                style={{
                  background: selected ? `linear-gradient(90deg, ${teal}, ${orange})` : "rgba(36,20,71,0.68)",
                  color: "#FFFFFF",
                  border: 0,
                  borderRadius: 10,
                  padding: "11px 0",
                  width: "100%",
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "'Cairo',sans-serif",
                }}
              >
                {selected ? (ar ? "الباقة المختارة" : "Selected Plan") : ar ? "اختر الباقة" : "Choose Package"}
              </motion.button>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
