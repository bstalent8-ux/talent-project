"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { PackageItem, AddonItem } from "@/features/talent-profile/types";

interface Props {
  selectedPackage: PackageItem | null;
  addons?: AddonItem[] | null;
}

export default function UsageRightsSection({ selectedPackage, addons: addonsProp }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const addons = addonsProp ?? [];
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";

  const toggle = (k: string) => setChecked(p => ({ ...p, [k]: !p[k] }));
  const basePrice = selectedPackage ? (parseInt(selectedPackage.price.replace(/[^\d]/g, ""), 10) || 0) : 0;
  const addonTotal = addons.reduce((sum, a) => sum + (checked[a.key] ? a.price : 0), 0);
  const total = basePrice + addonTotal;

  const fmt = (n: number) => n.toLocaleString("ar-EG");

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
      <h2 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 18, fontWeight: 800, marginBottom: 20, margin: "0 0 20px" }}>{ar ? "حقوق الاستخدام والإضافات" : "Usage Rights & Add-ons"}</h2>
      {addons.length === 0 && (
        <p style={{ color: MUTED, fontSize: 14, textAlign: "center", padding: "32px 0" }}>
          {ar ? "لا توجد إضافات حالياً" : "No add-ons available yet"}
        </p>
      )}
      {addons.length > 0 && <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 20 }}>
        {/* Add-ons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {addons.map(a => (
            <label key={a.key} onClick={() => toggle(a.key)} style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "14px 16px", backgroundColor: checked[a.key] ? "rgba(0,210,106,0.06)" : SURFACE, border: `1px solid ${checked[a.key] ? GREEN : BORDER}`, borderRadius: 12, transition: "all 0.2s" }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked[a.key] ? GREEN : "rgba(168,179,194,0.4)"}`, backgroundColor: checked[a.key] ? GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}>
                {checked[a.key] && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7L10 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span style={{ flex: 1, color: dark ? "#fff" : "#0F172A", fontSize: 13, fontWeight: 600 }}>{a.label}</span>
              <span style={{ color: GREEN, fontSize: 13, fontWeight: 800, direction: "ltr" }}>+{fmt(a.price)} EGP</span>
            </label>
          ))}
        </div>

        {/* Order Summary */}
        <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Shield size={14} color={GREEN} />
            <p style={{ color: GREEN, fontSize: 12, fontWeight: 700, margin: 0 }}>{ar ? "ملخص الطلب" : "Order Summary"}</p>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: MUTED }}>
            <span>{ar ? "الباقة" : "Package"}</span>
            <span style={{ color: dark ? "#fff" : "#0F172A", fontWeight: 600 }}>{basePrice > 0 ? `${fmt(basePrice)} EGP` : "—"}</span>
          </div>
          {addons.filter(a => checked[a.key]).map(a => (
            <div key={a.key} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED }}>
              <span>{a.label}</span>
              <span style={{ color: GREEN }}>+{fmt(a.price)} EGP</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: dark ? "#fff" : "#0F172A", fontWeight: 700, fontSize: 14 }}>{ar ? "الإجمالي" : "Total"}</span>
            <span style={{ color: GREEN, fontWeight: 900, fontSize: 18 }}>{fmt(total)} EGP</span>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} style={{ backgroundColor: GREEN, color: "#000", border: "none", borderRadius: 10, padding: "12px 0", width: "100%", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "'Cairo',sans-serif", marginTop: 4 }}>
            {ar ? "احجز الآن" : "Book Now"}
          </motion.button>
        </div>
      </div>}
    </div>
  );
}
