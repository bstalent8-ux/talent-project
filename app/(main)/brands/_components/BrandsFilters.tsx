"use client";
import { SlidersHorizontal, BadgeCheck } from "lucide-react";
import type { SortOption } from "./BrandsClient";

interface Industry { key: string; label_ar: string; label_en: string }

interface Props {
  dark: boolean;
  lang: "ar" | "en";
  sort: SortOption;
  onSort: (s: SortOption) => void;
  verified: boolean;
  onVerified: (v: boolean) => void;
  industry: string;
  onIndustry: (i: string) => void;
  industries: Industry[];
  resultCount: number;
  onReset: () => void;
}

const SORT_OPTIONS: { key: SortOption; label_ar: string; label_en: string }[] = [
  { key: "collab_desc", label_ar: "الأكثر تعاوناً", label_en: "Most Collabs" },
  { key: "name_asc",    label_ar: "أبجدياً",         label_en: "A → Z" },
  { key: "newest",      label_ar: "الأحدث",           label_en: "Newest" },
];

export default function BrandsFilters({
  dark, lang, sort, onSort, verified, onVerified,
  industry, onIndustry, industries, resultCount, onReset,
}: Props) {
  const ar     = lang === "ar";
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const GREEN  = "#00D26A";
  const GOLD   = "#F4B740";

  const sectionTitle = (label: string) => (
    <p style={{ color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" as const }}>
      {label}
    </p>
  );
  const divider = <div style={{ height: 1, backgroundColor: BORDER, margin: "12px 0" }} />;

  return (
    <aside style={{
      backgroundColor: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: "14px 16px",
      alignSelf: "start", position: "sticky", top: 68,
      maxHeight: "calc(100vh - 80px)", overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={16} color={GREEN} />
          <span style={{ color: TEXT, fontSize: 15, fontWeight: 800 }}>{ar ? "التصفية" : "Filters"}</span>
        </div>
        <button onClick={onReset} style={{
          background: "none", border: "none", cursor: "pointer",
          color: GOLD, fontSize: 12, fontWeight: 600, fontFamily: "'Cairo',sans-serif",
        }}>{ar ? "إعادة ضبط" : "Reset"}</button>
      </div>

      {/* Result count */}
      <div style={{
        backgroundColor: dark ? "rgba(0,210,106,0.06)" : "rgba(0,210,106,0.04)",
        border: `1px solid rgba(0,210,106,0.15)`,
        borderRadius: 8, padding: "6px 10px", marginBottom: 14, textAlign: "center",
      }}>
        <span style={{ color: GREEN, fontSize: 13, fontWeight: 700 }}>
          {resultCount} {ar ? "براند" : "Brands"}
        </span>
      </div>

      {/* Sort */}
      {sectionTitle(ar ? "الترتيب" : "Sort By")}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {SORT_OPTIONS.map(opt => {
          const active = sort === opt.key;
          return (
            <button key={opt.key} onClick={() => onSort(opt.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 10px", borderRadius: 8,
              border: `1px solid ${active ? GREEN : "transparent"}`,
              backgroundColor: active ? (dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.06)") : SURFACE,
              color: active ? GREEN : MUTED,
              fontSize: 13, fontWeight: active ? 700 : 400,
              cursor: "pointer", fontFamily: "'Cairo',sans-serif",
              textAlign: "start" as const, transition: "all 0.15s",
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${active ? GREEN : MUTED}`,
                backgroundColor: active ? GREEN : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {active && <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#000" }} />}
              </span>
              {ar ? opt.label_ar : opt.label_en}
            </button>
          );
        })}
      </div>

      {divider}

      {/* Industry */}
      {sectionTitle(ar ? "القطاع" : "Industry")}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {industries.map(ind => {
          const active = industry === ind.key;
          return (
            <button key={ind.key} onClick={() => onIndustry(ind.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 10px", borderRadius: 8,
              border: `1px solid ${active ? GOLD : "transparent"}`,
              backgroundColor: active ? (dark ? "rgba(244,183,64,0.1)" : "rgba(244,183,64,0.06)") : SURFACE,
              color: active ? GOLD : MUTED,
              fontSize: 13, fontWeight: active ? 700 : 400,
              cursor: "pointer", fontFamily: "'Cairo',sans-serif",
              textAlign: "start" as const, transition: "all 0.15s",
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                backgroundColor: active ? GOLD : MUTED, opacity: active ? 1 : 0.4,
              }} />
              {ar ? ind.label_ar : ind.label_en}
            </button>
          );
        })}
      </div>

      {divider}

      {/* Verified toggle */}
      <button onClick={() => onVerified(!verified)} style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "9px 12px", borderRadius: 8,
        border: `1px solid ${verified ? GREEN : BORDER}`,
        backgroundColor: verified ? (dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.06)") : "transparent",
        cursor: "pointer", fontFamily: "'Cairo',sans-serif",
      }}>
        <BadgeCheck size={18} color={verified ? GREEN : MUTED} />
        <span style={{ color: verified ? GREEN : MUTED, fontSize: 13, fontWeight: verified ? 700 : 400 }}>
          {ar ? "موثّق فقط" : "Verified Only"}
        </span>
        <div style={{
          width: 36, height: 20, borderRadius: 10,
          backgroundColor: verified ? GREEN : SURFACE,
          border: `1px solid ${verified ? GREEN : BORDER}`,
          position: "relative", transition: "all 0.2s", flexShrink: 0,
          marginInlineStart: "auto",
        }}>
          <span style={{
            position: "absolute", top: 2,
            left: verified ? 18 : 2,
            width: 14, height: 14, borderRadius: "50%",
            backgroundColor: verified ? "#000" : MUTED,
            transition: "left 0.2s",
          }} />
        </div>
      </button>
    </aside>
  );
}
