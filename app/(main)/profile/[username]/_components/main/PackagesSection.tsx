"use client";
import { useState } from "react";
import { useTheme, TX } from "../ProfileThemeContext";

type Package = {
  name?: string; title?: string; icon?: string;
  price?: string | number; currency?: string;
  desc?: string; description?: string;
  features?: string[]; includes?: string[];
  is_popular?: boolean;
};

export default function PackagesSection({ packages }: { packages: Package[] }) {
  const [selected, setSelected] = useState(0);
  const { lang, CARD, BORDER, ELV, TEXT, SUB, MUTED, GOLD, GOLD_BG } = useTheme();
  const tx = TX[lang];

  if (!packages || packages.length === 0) {
    return (
      <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "40px", textAlign: "center", color: MUTED, fontSize: "14px", marginBottom: "16px" }}>
        {tx.noPackages}
      </div>
    );
  }

  const popular = lang === "ar" ? "الأكثر طلباً" : "Most Popular";
  const choose  = lang === "ar" ? "اختر الباقة"  : "Choose Package";
  const title   = lang === "ar" ? "الباقات والأسعار" : "Packages & Pricing";

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
      <h3 style={{ color: TEXT, fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>{title}</h3>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(packages.length, 3)}, 1fr)`, gap: "12px" }}>
        {packages.map((pkg, idx) => {
          const isSelected = selected === idx;
          const name     = pkg.name ?? pkg.title ?? `${lang === "ar" ? "باقة" : "Package"} ${idx + 1}`;
          const desc     = pkg.desc ?? pkg.description ?? "";
          const features = pkg.features ?? pkg.includes ?? [];
          const price    = pkg.price ?? "—";
          const currency = pkg.currency ?? "EGP";

          return (
            <div key={idx} onClick={() => setSelected(idx)} style={{
              backgroundColor: isSelected ? GOLD_BG : ELV,
              border: `1px solid ${isSelected ? GOLD : BORDER}`,
              borderRadius: "10px", padding: "16px",
              cursor: "pointer", position: "relative", transition: "all 0.2s",
            }}>
              {pkg.is_popular && (
                <span style={{ position: "absolute", top: "-10px", right: "50%", transform: "translateX(50%)", backgroundColor: "#FF6B2B", color: "#fff", fontSize: "10px", fontWeight: 700, borderRadius: "4px", padding: "2px 8px" }}>
                  {popular}
                </span>
              )}
              <div style={{ fontSize: "20px", marginBottom: "6px" }}>{pkg.icon ?? "📦"}</div>
              <p style={{ color: SUB, fontSize: "14px", fontWeight: 700, margin: "0 0 2px" }}>{name}</p>
              <p style={{ color: TEXT, fontSize: "22px", fontWeight: 900, margin: "0 0 2px" }}>
                {price} <span style={{ fontSize: "13px", color: MUTED }}>{currency}</span>
              </p>
              {desc && <p style={{ color: MUTED, fontSize: "12px", marginBottom: "12px" }}>{desc}</p>}
              {features.map((f, i) => (
                <p key={i} style={{ color: SUB, fontSize: "12px", margin: "4px 0", display: "flex", gap: "6px" }}>
                  <span style={{ color: GOLD }}>✓</span> {f}
                </p>
              ))}
              <button style={{
                width: "100%", marginTop: "14px", padding: "9px",
                backgroundColor: isSelected ? GOLD : "transparent",
                border: `1px solid ${isSelected ? GOLD : BORDER}`,
                borderRadius: "8px",
                color: isSelected ? "#000" : SUB,
                fontSize: "13px", fontWeight: 700,
                cursor: "pointer", fontFamily: "'Cairo', sans-serif",
              }}>
                {choose}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
