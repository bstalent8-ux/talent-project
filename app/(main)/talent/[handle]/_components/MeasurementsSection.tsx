"use client";

// ─── Measurements (Model public profile only) ──────────────────────────────
// Renders exactly the 5 approved Model fields — height_cm, weight_kg,
// shoe_size_eu, hair_color, eye_color. No other measurement exists in the
// data model; none is invented here. section-content.ts's `physical` rule
// already restricts this section to category === "model", so `measurements`
// is never non-null for any other category — see talent.context.ts's
// toMeasurements().
//
// Lives in the sidebar (talent-layout.ts puts "physical" there for model,
// never in main), so the layout is a compact row list — a 5-column grid
// would be cramped in a ~280px rail.

import { useSite } from "@/contexts/SiteContext";

interface Props {
  measurements: Record<string, string>;
}

// Exported so ProfileHero's Model branch (which now renders these same 5
// fields inline) uses the identical labels/units/order — one source of
// truth, never two copies that could drift.
export const FIELD_ORDER = ["height", "weight", "shoe_size", "hair_color", "eye_color"];

export const FIELD_LABELS: Record<string, { ar: string; en: string; unit?: string }> = {
  height:     { ar: "الطول",       en: "Height",    unit: "cm" },
  weight:     { ar: "الوزن",       en: "Weight",    unit: "kg" },
  shoe_size:  { ar: "مقاس الحذاء", en: "Shoe Size", unit: "EU" },
  hair_color: { ar: "لون الشعر",   en: "Hair Color" },
  eye_color:  { ar: "لون العين",   en: "Eye Color" },
};

export default function MeasurementsSection({ measurements }: Props) {
  const { dark, lang } = useSite();
  const ar = lang === "ar";

  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const GOLD   = "#F4B740";

  const entries = FIELD_ORDER.filter((key) => measurements[key]);
  if (!entries.length) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 12px" }}>
        {ar ? "بيانات الموديل" : "Model Details"}
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {entries.map((key, i) => {
          const meta = FIELD_LABELS[key];
          return (
            <div
              key={key}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 0",
                borderTop: i > 0 ? `1px solid ${BORDER}` : undefined,
              }}
            >
              <span style={{ color: MUTED, fontSize: 12.5 }}>{ar ? meta.ar : meta.en}</span>
              <span style={{ color: GOLD, fontSize: 13, fontWeight: 800 }} dir="ltr">
                {measurements[key]}{meta.unit ? ` ${meta.unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
