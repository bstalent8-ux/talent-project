"use client";

import { Briefcase } from "lucide-react";
import BrandCard, { useBrandPalette } from "./BrandCard";

const TX = {
  ar: { title: "المجال" },
  en: { title: "Industry" },
};

/**
 * `industry` is free text and `categoryId` is a categories FK. Both are shown as
 * chips, deduplicated — a brand that filled in only one still gets a full card.
 */
export default function BrandIndustryCard({
  industry,
  categoryId,
}: {
  industry:   string | null;
  categoryId: string | null;
}) {
  const { ar, dark, GREEN } = useBrandPalette();
  const tx = TX[ar ? "ar" : "en"];

  const chips = [industry, categoryId]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v))
    .filter((v, i, all) => all.findIndex((o) => o.toLowerCase() === v.toLowerCase()) === i);

  if (chips.length === 0) return null;

  return (
    <BrandCard icon={<Briefcase size={18} color={GREEN} />} title={tx.title}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {chips.map((chip) => (
          <span
            key={chip}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 700,
              color: GREEN,
              backgroundColor: dark ? "rgba(0,210,106,0.12)" : "rgba(0,210,106,0.08)",
              border: "1px solid rgba(0,210,106,0.25)",
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </BrandCard>
  );
}
