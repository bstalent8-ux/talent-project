"use client";

// Port of ugc/untitled/components/TopContentTypesChart.tsx's SVG donut.
// HARDCODED per explicit request — no per-video content-type tracking
// exists in the schema (talent_profiles has no per-video category field),
// so this cannot be made real without new tracked data. Kept visible only
// when the talent has at least one portfolio item, so an empty profile
// doesn't show a fabricated breakdown of nothing.

import { useState } from "react";
import { PieChart } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";

const SLICES = [
  { name: { ar: "مراجعة المنتجات", en: "Product Review" }, pct: 42, color: "#16a3a3" },
  { name: { ar: "فتح الصناديق", en: "Unboxing" }, pct: 25, color: "#3B82F6" },
  { name: { ar: "الشروحات التعليمية", en: "Tutorial & How-To" }, pct: 18, color: "#10B981" },
  { name: { ar: "لايف ستايل", en: "Lifestyle & Vlogs" }, pct: 10, color: "#F4B740" },
  { name: { ar: "محتوى آخر", en: "Others & Memes" }, pct: 5, color: "#94A3B8" },
];

export default function UgcContentChart({ hasPortfolio }: { hasPortfolio: boolean }) {
  const { dark, lang } = useSite();
  const ar = lang !== "en";
  const [hovered, setHovered] = useState<number | null>(null);
  const CARD = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT = dark ? "#fff" : "#0F172A";
  const MUTED = dark ? "#A8B3C2" : "#64748B";

  if (!hasPortfolio) return null;

  const size = 140;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const slices = SLICES.map((s) => {
    const strokeDasharray = `${(s.pct / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((offset / 100) * circumference);
    offset += s.pct;
    return { ...s, strokeDasharray, strokeDashoffset };
  });

  return (
    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 20 }}>
      <h3 style={{ color: TEXT, fontSize: 14, fontWeight: 800, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <PieChart size={15} color="#16a3a3" />{ar ? "أنواع المحتوى الأكثر إنتاجاً" : "Top Content Types"}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            {slices.map((s, i) => (
              <circle
                key={i}
                cx={center} cy={center} r={radius}
                fill="transparent"
                stroke={s.color}
                strokeWidth={hovered === i ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={s.strokeDasharray}
                strokeDashoffset={s.strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-width 0.2s", cursor: "pointer" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", textAlign: "center" }}>
            <span style={{ color: MUTED, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" }}>
              {hovered !== null ? (ar ? SLICES[hovered].name.ar : SLICES[hovered].name.en) : (ar ? "الإجمالي" : "Total")}
            </span>
            <span style={{ color: TEXT, fontSize: 19, fontWeight: 900 }}>
              {hovered !== null ? `${SLICES[hovered].pct}%` : "100%"}
            </span>
          </div>
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
          {SLICES.map((s, i) => (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11.5, padding: "4px 6px", borderRadius: 8, backgroundColor: hovered === i ? (dark ? "rgba(148,163,184,0.08)" : "#F8FAFC") : "transparent" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6, color: MUTED, minWidth: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: s.color, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ar ? s.name.ar : s.name.en}</span>
              </span>
              <span style={{ color: TEXT, fontWeight: 800, flexShrink: 0 }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
