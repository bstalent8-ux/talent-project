"use client";

// Port of ugc/untitled/components/ContentSpecialties.tsx — real
// talent.specialties chips instead of the source's fixed 12-item catalog
// (unboxing/tutorial/beauty/...), which has no equivalent stored field.

import { Tag } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const VIOLET = "#16a3a3"; // site --color-accent, was violet

export default function UgcContentSpecialties({ specialties }: { specialties: string[] }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";

  if (specialties.length === 0) return null;

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <Tag size={15} color={VIOLET} />{ar ? "مجالات المحتوى" : "Content Specialties"}
      </h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {specialties.map((s) => (
          <span key={s} style={{ padding: "6px 12px", borderRadius: 12, backgroundColor: `${VIOLET}14`, border: `1px solid ${VIOLET}44`, color: dark ? "#7dd3c0" : "#0f766e", fontSize: 12, fontWeight: 600 }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
