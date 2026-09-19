"use client";

// ─── Packages ──────────────────────────────────────────────────────────────
// Card matching the approved reference: "Packages" + subtitle, then up to three
// package cards — icon, name, price, dot-bullet features and a "Select Package"
// button, with the popular one framed in purple under a "Most Popular" tab.
// Real PackageItem[] only (name / price / popular / features / icon). Selecting a
// package feeds the real booking flow. No packages → the card says "No content".

import { Check, Crown, Gem, Medal, Rocket, Shield, Sun } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSite } from "@/contexts/SiteContext";
import type { PackageItem } from "@/features/talent-profile/types";

const PURPLE = "#6C4DFF";

// Admin-set `icon` keys (see PackageItem.icon); anything else gets the medal.
const ICONS: Record<string, { Icon: typeof Medal; color: string; bg: string }> = {
  sun:     { Icon: Sun,    color: "#F59E0B", bg: "#FEF3C7" },
  diamond: { Icon: Gem,    color: "#38A9F5", bg: "#E1F1FE" },
  gem:     { Icon: Gem,    color: "#38A9F5", bg: "#E1F1FE" },
  crown:   { Icon: Crown,  color: "#D4A017", bg: "#FBF0CC" },
  rocket:  { Icon: Rocket, color: PURPLE,    bg: "#ECE8FF" },
};
const DEFAULT_ICON = { Icon: Medal, color: "#B7791F", bg: "#FBEBD3" };

function formatPrice(price: string): string {
  const n = Number(String(price).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n.toLocaleString("en-US") : price;
}

const GOLD = "#d89b37";

interface Props {
  /** "model" restyles the same cards for the Model page: gold accent, green ticks, escrow note. */
  variant?: "ugc" | "model";
  packages: PackageItem[] | null;
  selectedId?: string | null;
  onSelectPackage: (pkg: PackageItem) => void;
}

export default function UgcPackages({ packages, selectedId, onSelectPackage, variant = "ugc" }: Props) {
  const model = variant === "model";
  const ACCENT = model ? GOLD : PURPLE;
  const phone = useIsMobile(640);
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = model ? (dark ? "var(--bg-card)" : "#FFFFFF") : (dark ? "#0D1623" : "#FFFFFF");
  const BORDER = model ? (dark ? "var(--border-subtle)" : "#E2E8F0") : (dark ? "rgba(255,255,255,0.10)" : "#E5E7EB");
  const TILE_BORDER = dark ? "rgba(255,255,255,0.12)" : "#E3E7EE";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";
  const POPULAR_BG = model ? (dark ? "rgba(216,155,55,0.07)" : "#FFF8EC") : (dark ? "rgba(108,77,255,0.12)" : "#F7F5FF");

  const data = (packages ?? []).filter((p) => p.name && p.price);
  // Always three tracks: a lone package keeps the width it has when there are three
  // and sits at the inline-start side (left in LTR, right in RTL) instead of stretching.
  const cols = phone ? 1 : 3;

  return (
    <section id="ugc-packages" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: phone ? 16 : 22, minWidth: 0 }}>
      <h2 style={{ color: TEXT, fontSize: 18, fontWeight: 800, margin: 0 }}>{model ? "Packages" : ar ? "الباقات" : "Packages"}</h2>
      <p style={{ color: MUTED, fontSize: 13, margin: "4px 0 22px" }}>
        {model ? (ar ? "اختر الباقة المناسبة لمشروعك" : "Choose the right package for your project") : ar ? "اختر الباقة المثالية لمشروعك" : "Choose the perfect package for your project"}
      </p>

      {data.length === 0 ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: MUTED, fontSize: 14, fontWeight: 600 }}>
          {ar ? "لا يوجد محتوى" : "No content"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 14, alignItems: "stretch", paddingTop: 6 }}>
          {data.map((pkg) => {
            const { Icon, color, bg } = ICONS[pkg.icon ?? ""] ?? (model ? { Icon: Sun, color: GOLD, bg: "rgba(216,155,55,0.14)" } : DEFAULT_ICON);
            const selected = selectedId === pkg.id;
            const filled = pkg.popular || selected;
            return (
              <div
                key={pkg.id}
                style={{
                  position: "relative", borderRadius: 14, padding: "20px 16px 16px", display: "flex", flexDirection: "column", gap: 16, minWidth: 0,
                  border: pkg.popular ? `1.5px solid ${ACCENT}` : `1px solid ${TILE_BORDER}`,
                  backgroundColor: pkg.popular ? POPULAR_BG : (dark ? "rgba(255,255,255,0.02)" : "#fff"),
                }}
              >
                {pkg.popular && (
                  <span style={model
                    ? { position: "absolute", top: -11, insetInlineEnd: 14, padding: "3px 12px", borderRadius: 8, backgroundColor: dark ? "#2a2113" : "#FFF3D9", border: `1px solid ${GOLD}`, color: GOLD, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }
                    : { position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", padding: "3px 14px", borderRadius: 8, backgroundColor: PURPLE, color: "#fff", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {ar ? "الأكثر طلباً" : "Most Popular"}
                  </span>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <span style={{ width: 42, height: 42, borderRadius: "50%", backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={21} color={color} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.name}</h3>
                      {model && pkg.popular && <Gem size={13} color={GOLD} style={{ flexShrink: 0 }} />}
                    </div>
                    <div style={{ color: TEXT, fontSize: 19, fontWeight: 800, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                      {formatPrice(pkg.price)} <span style={{ fontSize: 12, fontWeight: 600, color: MUTED }}>{ar ? "جنيه" : "EGP"}</span>
                    </div>
                  </div>
                </div>

                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                  {pkg.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: 13, color: TEXT, lineHeight: 1.35 }}>
                      {model
                        ? <Check size={14} color="#22c55e" strokeWidth={3} style={{ flexShrink: 0, marginTop: 2 }} />
                        : <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: TEXT, flexShrink: 0, marginTop: 7 }} />}
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => onSelectPackage(pkg)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 0", borderRadius: 8, cursor: "pointer",
                    fontFamily: "'IBM Plex Sans Arabic',sans-serif", fontWeight: 700, fontSize: 13.5,
                    border: `1.5px solid ${ACCENT}`, color: filled ? (model ? "#0b0d13" : "#fff") : ACCENT,
                    ...(model && filled ? { background: "linear-gradient(135deg, #e5a93c, #c88924)" } : { backgroundColor: filled ? ACCENT : "transparent" }),
                  }}
                >
                  {selected ? <><Check size={14} />{ar ? "تم الاختيار" : "Selected"}</> : (ar ? (model ? "اختر الباقة" : "اختيار الباقة") : "Select Package")}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {model && data.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20, color: MUTED, fontSize: 12.5 }}>
          <Shield size={15} color={GOLD} />
          {ar ? "جميع الباقات تشمل حماية الدفع عبر Escrow" : "All packages include payment protection via Escrow"}
        </div>
      )}
    </section>
  );
}
