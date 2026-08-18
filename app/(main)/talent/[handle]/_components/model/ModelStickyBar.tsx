"use client";

// Port of model/components/StickyBottomBar.tsx. Price shows the real
// selected package (PackagesSection's "model" variant already lifts this
// same selection state up — see ModelProfileShell.tsx) plus any checked
// UsageRightsSection add-ons (also lifted, same file). "Continue to
// Brief" opens the real DirectBriefModal instead of the source's own
// BookingBriefModal mock.

import { ShieldCheck, UserCheck, ArrowLeft } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import ProtectedAction from "@/components/auth/ProtectedAction";
import { parsePrice } from "@/lib/utils";
import type { PackageItem } from "@/features/talent-profile/types";

interface Props {
  selectedPackage: PackageItem | null;
  /** Sum of checked UsageRightsSection add-on prices, EGP. */
  addonsTotal?: number;
  identityVerified: boolean;
  onContinueToBrief: () => void;
}

export default function ModelStickyBar({ selectedPackage, addonsTotal = 0, identityVerified, onContinueToBrief }: Props) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const BORDER = dark ? "var(--border-subtle)" : "#E2E8F0";
  const BG = dark ? "rgba(9,13,21,0.95)" : "rgba(255,255,255,0.95)";
  const TEXT = dark ? "var(--text-primary)" : "#0F172A";
  const MUTED = dark ? "var(--text-muted)" : "#64748B";
  const GOLD = "#d89b37";

  return (
    <div style={{
      position: "fixed", bottom: 0, insetInline: 0, zIndex: 40,
      backgroundColor: BG, backdropFilter: "blur(14px)", borderTop: `1px solid ${BORDER}`,
      padding: "12px var(--container-pad, 24px)", boxShadow: "0 -8px 30px rgba(0,0,0,0.25)",
    }}>
      <div style={{ maxWidth: "var(--container-max, 1440px)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: TEXT, fontFamily: "monospace" }}>
                {selectedPackage ? (parsePrice(selectedPackage.price) + addonsTotal).toLocaleString("en-US") : "—"}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>EGP</span>
            </div>
            <span style={{ fontSize: 10.5, color: MUTED }}>
              {selectedPackage
                ? (addonsTotal > 0 ? `${selectedPackage.name} + ${ar ? "إضافات" : "add-ons"}` : selectedPackage.name)
                : (ar ? "اختر باقة" : "Choose a package")}
            </span>
          </div>

          <div style={{ width: 1, height: 28, backgroundColor: BORDER }} />

          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
            <ShieldCheck size={15} color={GOLD} />{ar ? "دفع آمن" : "Secure Payment"}
          </div>
          {identityVerified && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: MUTED }}>
              <UserCheck size={15} color="#34d399" />{ar ? "هوية موثّقة" : "Identity Verified"}
            </div>
          )}
        </div>

        <ProtectedAction action="create_booking">
          <button
            onClick={onContinueToBrief}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "11px 22px", borderRadius: 10, border: "none",
              background: `linear-gradient(135deg, #e5a93c, #c88924)`, color: "#0b0d13", fontWeight: 800, fontSize: 13.5,
              cursor: "pointer", fontFamily: "'Cairo',sans-serif",
            }}
          >
            {ar ? "المتابعة للحجز" : "Continue to Brief"}<ArrowLeft size={15} style={{ transform: ar ? "scaleX(-1)" : "none" }} />
          </button>
        </ProtectedAction>
      </div>
    </div>
  );
}
