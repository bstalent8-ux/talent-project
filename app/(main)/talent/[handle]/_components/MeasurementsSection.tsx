"use client";

// ─── Measurements (Model public profile only) ──────────────────────────────
// Renders exactly the 5 approved Model fields — height_cm, weight_kg,
// shoe_size_eu, hair_color, eye_color. No other measurement exists in the
// data model; none is invented here. section-content.ts's `physical` rule
// already restricts this section to category === "model", so `measurements`
// is never non-null for any other category — see talent.context.ts's
// toMeasurements().

import { useSite } from "@/contexts/SiteContext";
import { useIsMobile } from "@/hooks/useIsMobile";

interface Props {
  measurements: Record<string, string>;
}

const FIELD_ORDER = ["height", "weight", "shoe_size", "hair_color", "eye_color"];

const FIELD_LABELS: Record<string, { ar: string; en: string; unit?: string }> = {
  height:     { ar: "الطول",       en: "Height",    unit: "cm" },
  weight:     { ar: "الوزن",       en: "Weight",    unit: "kg" },
  shoe_size:  { ar: "مقاس الحذاء", en: "Shoe Size", unit: "EU" },
  hair_color: { ar: "لون الشعر",   en: "Hair Color" },
  eye_color:  { ar: "لون العين",   en: "Eye Color" },
};

export default function MeasurementsSection({ measurements }: Props) {
  const { dark, lang } = useSite();
  const isMobile = useIsMobile();
  const ar = lang === "ar";

  const CARD   = "var(--bg-card)";
  const BORDER = "var(--border-subtle)";
  const TEXT   = "var(--text-primary)";
  const MUTED  = "var(--text-muted)";
  const SURFACE= "var(--bg-surface)";
  const GOLD   = "var(--color-secondary)";

  const entries = FIELD_ORDER.filter((key) => measurements[key]);
  if (!entries.length) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22 }}>
      <h3 style={{ color: TEXT, fontSize: 16, fontWeight: 800, margin: "0 0 16px" }}>
        {ar ? "المقاسات" : "Measurements"}
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: 10 }}>
        {entries.map((key) => {
          const meta = FIELD_LABELS[key];
          return (
            <div
              key={key}
              style={{
                backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: "12px 10px", textAlign: "center",
              }}
            >
              <p style={{ color: MUTED, fontSize: 11, fontWeight: 600, margin: "0 0 6px" }}>
                {ar ? meta.ar : meta.en}
              </p>
              <p style={{ color: GOLD, fontSize: 15, fontWeight: 800, margin: 0 }} dir="ltr">
                {measurements[key]}{meta.unit ? ` ${meta.unit}` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
