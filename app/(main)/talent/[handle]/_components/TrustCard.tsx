"use client";
import { ShieldCheck } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

export default function TrustCard() {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  const features = ar
    ? ["مدفوعات آمنة 100%", "حماية الضمان المالي (Escrow)", "مراجعة يدوية لكل طلب", "حل سريع للنزاعات"]
    : ["100% Secure Payments", "Financial Guarantee (Escrow)", "Manual Review for Every Order", "Fast Dispute Resolution"];
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const GREEN = "#00D26A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <ShieldCheck size={18} color={GREEN} />
        <h3 style={{ color: dark ? "#fff" : "#0F172A", fontSize: 16, fontWeight: 800, margin: 0 }}>{ar ? "الأمان والثقة" : "Safety & Trust"}</h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(0,210,106,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span style={{ color: MUTED, fontSize: 13 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
