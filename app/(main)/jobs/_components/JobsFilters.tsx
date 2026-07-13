"use client";
import { SlidersHorizontal } from "lucide-react";
import type { SortOption } from "./JobsClient";

interface Cat { key: string; label_ar: string; label_en: string }
interface Props {
  dark: boolean; lang: "ar" | "en";
  sort: SortOption; onSort: (s: SortOption) => void;
  minBudget: number; maxBudget: number;
  onMinBudget: (n: number) => void; onMaxBudget: (n: number) => void;
  category: string; onCategory: (c: string) => void;
  categories: Cat[];
  resultCount: number; onReset: () => void;
}

const SORT_OPTIONS: { key: SortOption; label_ar: string; label_en: string }[] = [
  { key: "newest",      label_ar: "الأحدث",          label_en: "Newest" },
  { key: "budget_desc", label_ar: "الأعلى ميزانية",  label_en: "Highest Budget" },
  { key: "budget_asc",  label_ar: "الأقل ميزانية",   label_en: "Lowest Budget" },
  { key: "slots_desc",  label_ar: "أكثر أماكن",      label_en: "Most Slots" },
];

export default function JobsFilters({
  dark, lang, sort, onSort, minBudget, maxBudget, onMinBudget, onMaxBudget,
  category, onCategory, categories, resultCount, onReset,
}: Props) {
  const ar     = lang === "ar";
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const GREEN  = "#00D26A";
  const GOLD   = "#F4B740";

  const sec = (label: string) => (
    <p style={{ color: MUTED, fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" as const }}>{label}</p>
  );
  const divider = <div style={{ height: 1, backgroundColor: BORDER, margin: "12px 0" }} />;

  return (
    <aside style={{
      backgroundColor: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 16, padding: "14px 16px",
      alignSelf: "start", position: "sticky", top: 68,
      maxHeight: "calc(100vh - 80px)", overflowY: "auto",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={16} color={GREEN} />
          <span style={{ color: TEXT, fontSize: 15, fontWeight: 800 }}>{ar ? "التصفية" : "Filters"}</span>
        </div>
        <button onClick={onReset} style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontSize: 12, fontWeight: 600, fontFamily: "'Cairo',sans-serif" }}>
          {ar ? "إعادة ضبط" : "Reset"}
        </button>
      </div>

      <div style={{ backgroundColor: dark ? "rgba(0,210,106,0.06)" : "rgba(0,210,106,0.04)", border: "1px solid rgba(0,210,106,0.15)", borderRadius: 8, padding: "6px 10px", marginBottom: 14, textAlign: "center" }}>
        <span style={{ color: GREEN, fontSize: 13, fontWeight: 700 }}>{resultCount} {ar ? "وظيفة" : "Jobs"}</span>
      </div>

      {sec(ar ? "الترتيب" : "Sort By")}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {SORT_OPTIONS.map(opt => {
          const active = sort === opt.key;
          return (
            <button key={opt.key} onClick={() => onSort(opt.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 10px", borderRadius: 8,
              border: `1px solid ${active ? GREEN : "transparent"}`,
              backgroundColor: active ? (dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.06)") : SURFACE,
              color: active ? GREEN : MUTED, fontSize: 13, fontWeight: active ? 700 : 400,
              cursor: "pointer", fontFamily: "'Cairo',sans-serif", textAlign: "start" as const,
            }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `2px solid ${active ? GREEN : MUTED}`, backgroundColor: active ? GREEN : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {active && <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#000" }} />}
              </span>
              {ar ? opt.label_ar : opt.label_en}
            </button>
          );
        })}
      </div>

      {divider}

      {sec(ar ? "نوع الموهبة" : "Talent Type")}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {categories.map(cat => {
          const active = category === cat.key;
          return (
            <button key={cat.key} onClick={() => onCategory(cat.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "7px 10px", borderRadius: 8,
              border: `1px solid ${active ? GOLD : "transparent"}`,
              backgroundColor: active ? (dark ? "rgba(244,183,64,0.1)" : "rgba(244,183,64,0.06)") : SURFACE,
              color: active ? GOLD : MUTED, fontSize: 13, fontWeight: active ? 700 : 400,
              cursor: "pointer", fontFamily: "'Cairo',sans-serif", textAlign: "start" as const,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, backgroundColor: active ? GOLD : MUTED, opacity: active ? 1 : 0.4 }} />
              {ar ? cat.label_ar : cat.label_en}
            </button>
          );
        })}
      </div>

      {divider}

      {sec(ar ? "نطاق الميزانية (EGP)" : "Budget Range (EGP)")}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[{ label: ar ? "الحد الأدنى" : "Min", val: minBudget, set: onMinBudget }, { label: ar ? "الحد الأقصى" : "Max", val: maxBudget, set: onMaxBudget }].map(({ label, val, set }) => (
          <div key={label} style={{ flex: 1 }}>
            <p style={{ color: MUTED, fontSize: 11, margin: "0 0 6px" }}>{label}</p>
            <input type="number" value={val} onChange={e => set(Number(e.target.value))} min={0}
              style={{ width: "100%", padding: "8px 10px", backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 13, fontFamily: "'Cairo',sans-serif", outline: "none", boxSizing: "border-box" as const }} />
          </div>
        ))}
      </div>
      <input type="range" min={0} max={100000} step={1000} value={maxBudget} onChange={e => onMaxBudget(Number(e.target.value))}
        style={{ width: "100%", accentColor: GREEN }} />
      <p style={{ color: MUTED, fontSize: 11, textAlign: "center", margin: "4px 0 0" }}>0 — {maxBudget.toLocaleString()} EGP</p>
    </aside>
  );
}
