"use client";

// Port of ugc/untitled/components/PackagesSection.tsx's 3-card layout —
// violet "most popular" gradient card, real PackageItem[] (id/name/price/
// popular/features). Source's billing-cycle toggle (single vs. monthly
// retainer with a 15% discount) has no real feature behind it — Talents
// packages are one-time prices, not subscriptions — so it is not
// reproduced. Selecting a package opens the real DirectBriefModal (source's
// own 3-step escrow-deposit wizard has no backing; booking is manual
// confirmation only, see CLAUDE.md §10.1).

import { Check, Sparkles, Shield, Clock, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { PackageItem } from "@/features/talent-profile/types";

const VIOLET = "#16a3a3"; // site --color-accent, was violet
const EMERALD = "#10B981";

interface Props {
  packages: PackageItem[] | null;
  onSelectPackage: (pkg: PackageItem) => void;
}

export default function UgcPackages({ packages, onSelectPackage }: Props) {
  const isMobile = useIsMobile();
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";

  const data = (packages ?? []).filter((p) => p.name && p.price);
  if (data.length === 0) return null;

  return (
    <section id="ugc-packages" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: isMobile ? 16 : 24 }}>
      <h2 style={{ color: TEXT, fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>{ar ? "الباقات والأسعار" : "Packages & Pricing"}</h2>
      <p style={{ color: MUTED, fontSize: 12.5, margin: "0 0 20px" }}>
        {ar ? "اختر الباقة المناسبة لحملتك." : "Choose the package that fits your campaign."}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(3, data.length)}, 1fr)`, gap: 16 }}>
        {data.map((pkg) => (
          <div
            key={pkg.id}
            style={{
              position: "relative", borderRadius: 18, padding: 20, display: "flex", flexDirection: "column", gap: 14,
              background: pkg.popular ? `linear-gradient(160deg, #0d2321, ${VIOLET}, #0a1a17)` : SURFACE,
              border: pkg.popular ? `1px solid ${VIOLET}` : `1px solid ${BORDER}`,
              color: pkg.popular ? "#fff" : TEXT,
            }}
          >
            {pkg.popular && (
              <span style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", padding: "4px 12px", borderRadius: 20, background: `linear-gradient(90deg, ${VIOLET}, #0f766e)`, color: "#fff", fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <Sparkles size={11} />{ar ? "الأكثر طلباً" : "Most Popular"}
              </span>
            )}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>{pkg.name}</h3>
              <div style={{ fontSize: 30, fontWeight: 900 }}>
                {pkg.price} <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7 }}>{ar ? "جنيه" : "EGP"}</span>
              </div>
            </div>
            {pkg.features.length > 0 && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {pkg.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5 }}>
                    <span style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: pkg.popular ? "rgba(255,255,255,0.15)" : `${EMERALD}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Check size={10} color={pkg.popular ? "#fff" : EMERALD} />
                    </span>
                    <span style={{ opacity: pkg.popular ? 0.9 : 1 }}>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => onSelectPackage(pkg)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                background: pkg.popular ? `linear-gradient(90deg, ${EMERALD}, #14B8A6)` : "#0F172A",
                color: pkg.popular ? "#052e16" : "#fff", fontWeight: 800, fontSize: 13,
              }}
            >
              {ar ? "اختيار الباقة" : "Select Package"}<ArrowRight size={14} />
            </button>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 10, opacity: 0.7 }}>
              <Shield size={11} color={EMERALD} />{ar ? "حماية دفع كاملة" : "Full payment protection"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
