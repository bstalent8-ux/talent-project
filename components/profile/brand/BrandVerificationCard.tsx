"use client";

import { ShieldCheck } from "lucide-react";
import BrandCard, { useBrandPalette } from "./BrandCard";

const TX = {
  ar: {
    title:  "التوثيق",
    badge:  "علامة تجارية موثقة",
    body:   "تم التحقق من هذه العلامة التجارية من قبل فريق Talents.",
    points: ["هوية تجارية مؤكدة", "مستندات ضريبية مراجعة", "مدفوعات مضمونة"],
  },
  en: {
    title:  "Verification",
    badge:  "Verified brand",
    body:   "This brand has been reviewed and approved by the Talents team.",
    points: ["Confirmed business identity", "Tax documents reviewed", "Guaranteed payments"],
  },
};

/**
 * Only ever rendered for an approved brand: the provider's public gate returns
 * null for anything else, so an unapproved brand has no public profile at all.
 * `isApproved` is still checked rather than assumed — this component must not be
 * the thing that leaks moderation state if that gate ever moves.
 */
export default function BrandVerificationCard({ isApproved }: { isApproved: boolean }) {
  const { ar, dark, MUTED, GREEN } = useBrandPalette();
  const tx = TX[ar ? "ar" : "en"];

  if (!isApproved) return null;

  return (
    <BrandCard icon={<ShieldCheck size={18} color={GREEN} />} title={tx.title}>
      <div
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 14px", borderRadius: 20, marginBottom: 14,
          fontSize: 12, fontWeight: 800, color: GREEN,
          backgroundColor: dark ? "rgba(0,210,106,0.12)" : "rgba(0,210,106,0.08)",
          border: "1px solid rgba(0,210,106,0.25)",
        }}
      >
        <ShieldCheck size={13} color={GREEN} />
        {tx.badge}
      </div>

      <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.8, margin: "0 0 14px" }}>{tx.body}</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {tx.points.map((point) => (
          <div key={point} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                backgroundColor: "rgba(0,210,106,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                <path d="M1 5L4.5 8.5L11 1" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ color: MUTED, fontSize: 13 }}>{point}</span>
          </div>
        ))}
      </div>
    </BrandCard>
  );
}
