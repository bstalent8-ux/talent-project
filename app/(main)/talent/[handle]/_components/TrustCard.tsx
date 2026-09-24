"use client";
import { ShieldCheck } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

export default function TrustCard() {
  const { dark, lang } = useSite();
  const ar = lang === "ar";
  // Previously claimed "100% Secure Payments" / "Escrow protection" / "Fast
  // dispute resolution" — none of that exists (CLAUDE.md §10.1: no escrow,
  // no payment provider, manual confirmation only; no dispute system either).
  // Replaced with claims the platform actually backs: talent verification,
  // moderated reviews, and pre-booking chat are all real, shipped features.
  const features = ar
    ? ["توثيق هوية المواهب", "تقييمات حقيقية من براندات", "مراجعة إدارية لكل تقييم", "تواصل مباشر قبل الحجز"]
    : ["Talent Identity Verification", "Real Reviews from Real Brands", "Admin-Moderated Reviews", "Direct Chat Before You Book"];
  const CARD = dark ? "#2B211D" : "#FBF7EA";
  const BORDER = dark ? "rgba(79,167,163,0.15)" : "#E6DCC3";
  const GREEN = "var(--color-primary-text)";
  const MUTED = dark ? "#A99B8E" : "#6E5F55";
  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <ShieldCheck size={18} color={GREEN} />
        <h3 style={{ color: dark ? "#fff" : "#2B211D", fontSize: 16, fontWeight: 800, margin: 0 }}>{ar ? "الأمان والثقة" : "Safety & Trust"}</h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "rgba(8,127,131,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span style={{ color: MUTED, fontSize: 13 }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
