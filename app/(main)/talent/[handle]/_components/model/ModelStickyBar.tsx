"use client";

// Sticky booking bar, built to the approved reference: estimated price on one
// side, trust cues in the middle, a two-line gold "Continue to Brief" button on
// the other. Real data only:
//   - price  → the selected package + checked add-ons, else the admin-entered
//              average project value ("for a similar project"), else a prompt
//   - trust  → "Escrow protected" (the platform holds payment until approval) and
//              "Identity verified" (only when the talent's ID check is approved)
// "Continue to Brief" opens the real booking modals.

import { ShieldCheck, IdCard, ArrowLeft } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { parsePrice } from "@/lib/utils";
import type { PackageItem } from "@/features/talent-profile/types";

interface Props {
  selectedPackage: PackageItem | null;
  /** Sum of checked UsageRightsSection add-on prices, EGP. */
  addonsTotal?: number;
  /** Admin-entered average project value, EGP — shown until a package is picked. */
  avgProjectValue?: number | null;
  identityVerified: boolean;
  onContinueToBrief: () => void;
}

export default function ModelStickyBar({ selectedPackage, addonsTotal = 0, avgProjectValue = null, identityVerified, onContinueToBrief }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const BG = dark ? "rgba(9,13,21,0.96)" : "rgba(255,255,255,0.96)";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const GOLD = "#d89b37";

  const price = selectedPackage ? parsePrice(selectedPackage.price) + addonsTotal : avgProjectValue;
  const caption = selectedPackage
    ? (addonsTotal > 0 ? `${selectedPackage.name} + ${ar ? "إضافات" : "add-ons"}` : selectedPackage.name)
    : avgProjectValue
      ? (ar ? "لمشروع مشابه" : "for a similar project")
      : (ar ? "اختر باقة" : "Choose a package");

  const trust: { key: string; label: string; Icon: typeof ShieldCheck }[] = [
    { key: "escrow", label: ar ? "محمي بـ Escrow" : "Escrow protected", Icon: ShieldCheck },
    ...(identityVerified ? [{ key: "id", label: ar ? "هوية موثّقة" : "Identity verified", Icon: IdCard }] : []),
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, insetInline: 0, zIndex: 40,
      backgroundColor: BG, backdropFilter: "blur(14px)", borderTop: `1px solid ${BORDER}`,
      padding: "12px var(--container-pad, 24px)", boxShadow: "0 -8px 30px rgba(0,0,0,0.25)",
    }}>
      <div style={{ maxWidth: 1480, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap", minWidth: 0 }}>
          <div>
            <div style={{ color: MUTED, fontSize: 11.5 }}>{ar ? "السعر التقريبي" : "Estimated price"}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, lineHeight: 1.2 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: TEXT, fontVariantNumeric: "tabular-nums" }}>
                {price ? price.toLocaleString("en-US") : "—"}
              </span>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: GOLD }}>EGP</span>
            </div>
            <div style={{ color: MUTED, fontSize: 11 }}>{caption}</div>
          </div>

          {trust.map(({ key, label, Icon }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: MUTED, whiteSpace: "nowrap" }}>
              <Icon size={17} />{label}
            </div>
          ))}
        </div>

        <ProtectedAction action="create_booking">
          <button
            onClick={onContinueToBrief}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "10px 26px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #e5a93c, #c88924)", color: "#0b0d13", cursor: "pointer", fontFamily: "'IBM Plex Sans Arabic',sans-serif",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.25 }}>
              <span style={{ fontWeight: 800, fontSize: 15 }}>{ar ? "المتابعة للحجز" : "Continue to Brief"}</span>
              <span style={{ fontWeight: 600, fontSize: 11, opacity: 0.85 }}>{ar ? "الخطوة التالية: وصف المشروع" : "Next step: describe the project"}</span>
            </span>
            <ArrowLeft size={18} style={{ transform: ar ? "none" : "scaleX(-1)" }} />
          </button>
        </ProtectedAction>
      </div>
    </div>
  );
}
