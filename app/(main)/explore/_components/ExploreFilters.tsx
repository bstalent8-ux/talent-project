"use client";
import { SlidersHorizontal, BadgeCheck } from "lucide-react";
import type { SortOption } from "./ExploreClient";

interface TypeTab { key: string; label_ar: string; label_en: string }

interface Props {
  dark: boolean;
  lang: "ar" | "en";
  sort: SortOption;
  onSort: (s: SortOption) => void;
  minPrice: number;
  maxPrice: number;
  onMinPrice: (n: number) => void;
  onMaxPrice: (n: number) => void;
  verified: boolean;
  onVerified: (v: boolean) => void;
  sex: string;
  onSexChange: (s: string) => void;
  types: TypeTab[];
  activeType: string;
  onTypeChange: (t: string) => void;
}

const SORT_OPTIONS: { key: SortOption; label_ar: string; label_en: string }[] = [
  { key: "rating",     label_ar: "الأعلى تقييماً",   label_en: "Top Rated" },
  { key: "price_asc",  label_ar: "الأرخص أولاً",     label_en: "Price: Low to High" },
  { key: "price_desc", label_ar: "الأعلى سعراً",     label_en: "Price: High to Low" },
  { key: "newest",     label_ar: "الأحدث",            label_en: "Newest" },
];

export default function ExploreFilters({
  dark, lang, sort, onSort,
  minPrice, maxPrice, onMinPrice, onMaxPrice,
  verified, onVerified,
  sex, onSexChange,
  types, activeType, onTypeChange,
}: Props) {
  const CARD   = dark ? "#0D1623" : "#FFFFFF";
  const BORDER = dark ? "rgba(0,255,163,0.15)" : "#E2E8F0";
  const TEXT   = dark ? "#FFFFFF" : "#0F172A";
  const MUTED  = dark ? "#A8B3C2" : "#64748B";
  const SURFACE = dark ? "#0A121C" : "#F8FAFC";
  const GREEN  = "#00D26A";
  const GOLD   = "#F4B740";

  const t = {
    filters:   lang === "ar" ? "التصفية"        : "Filters",
    reset:     lang === "ar" ? "إعادة ضبط"      : "Reset",
    sort_by:   lang === "ar" ? "الترتيب"        : "Sort By",
    type:      lang === "ar" ? "نوع الموهبة"    : "Talent Type",
    price:     lang === "ar" ? "نطاق السعر"     : "Price Range",
    min:       lang === "ar" ? "الحد الأدنى"    : "Min",
    max:       lang === "ar" ? "الحد الأقصى"    : "Max",
    verified:  lang === "ar" ? "موثّق فقط"      : "Verified Only",
    sex:       lang === "ar" ? "الجنس"           : "Gender",
    male:      lang === "ar" ? "ذكر"             : "Male",
    female:    lang === "ar" ? "أنثى"            : "Female",
    all:       lang === "ar" ? "الكل"            : "All",
    currency:  lang === "ar" ? "جنيه"           : "EGP",
  };

  const sectionTitle = (label: string) => (
    <p style={{
      color: MUTED, fontSize: 10, fontWeight: 700,
      letterSpacing: 1, marginBottom: 8,
      textTransform: "uppercase",
    }}>{label}</p>
  );

  const divider = (
    <div style={{ height: 1, backgroundColor: BORDER, margin: "12px 0" }} />
  );

  const handleReset = () => {
    onSort("rating");
    onMinPrice(0);
    onMaxPrice(10000);
    onVerified(false);
    onSexChange("all");
    onTypeChange("all");
  };

  return (
    <aside style={{
      backgroundColor: CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 16,
      padding: "14px 16px",
      alignSelf: "start",
      position: "sticky",
      top: 68,
      maxHeight: "calc(100vh - 80px)",
      overflowY: "auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SlidersHorizontal size={16} color={GREEN} />
          <span style={{ color: TEXT, fontSize: 15, fontWeight: 800 }}>{t.filters}</span>
        </div>
        <button onClick={handleReset} style={{
          background: "none", border: "none", cursor: "pointer",
          color: GOLD, fontSize: 12, fontWeight: 600,
          fontFamily: "'Cairo',sans-serif",
        }}>{t.reset}</button>
      </div>

      {/* Sort by */}
      {sectionTitle(t.sort_by)}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {SORT_OPTIONS.map(opt => {
          const active = sort === opt.key;
          const label  = lang === "ar" ? opt.label_ar : opt.label_en;
          return (
            <button
              key={opt.key}
              onClick={() => onSort(opt.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 10px", borderRadius: 8,
                border: `1px solid ${active ? GREEN : "transparent"}`,
                backgroundColor: active ? (dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.06)") : SURFACE,
                color: active ? GREEN : MUTED,
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                textAlign: "start", transition: "all 0.15s",
              }}
            >
              <span style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${active ? GREEN : MUTED}`,
                backgroundColor: active ? GREEN : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {active && <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#000" }} />}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {divider}

      {/* Talent type */}
      {sectionTitle(t.type)}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {types.map(tab => {
          const active = activeType === tab.key;
          const label  = lang === "ar" ? tab.label_ar : tab.label_en;
          return (
            <button
              key={tab.key}
              onClick={() => onTypeChange(tab.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 10px", borderRadius: 8,
                border: `1px solid ${active ? GOLD : "transparent"}`,
                backgroundColor: active ? (dark ? "rgba(244,183,64,0.1)" : "rgba(244,183,64,0.06)") : SURFACE,
                color: active ? GOLD : MUTED,
                fontSize: 13, fontWeight: active ? 700 : 400,
                cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                textAlign: "start", transition: "all 0.15s",
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                backgroundColor: active ? GOLD : MUTED, opacity: active ? 1 : 0.4,
              }} />
              {label}
            </button>
          );
        })}
      </div>

      {divider}

      {/* Price range */}
      {sectionTitle(t.price)}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {[
          { label: t.min, val: minPrice, set: onMinPrice },
          { label: t.max, val: maxPrice, set: onMaxPrice },
        ].map(({ label, val, set }) => (
          <div key={label} style={{ flex: 1 }}>
            <p style={{ color: MUTED, fontSize: 11, margin: "0 0 6px" }}>{label}</p>
            <input
              type="number"
              value={val}
              onChange={e => set(Number(e.target.value))}
              min={0}
              style={{
                width: "100%", padding: "8px 10px",
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                color: TEXT, fontSize: 13,
                fontFamily: "'Cairo',sans-serif", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        ))}
      </div>
      {/* Range slider */}
      <input
        type="range" min={0} max={10000} step={500} value={maxPrice}
        onChange={e => onMaxPrice(Number(e.target.value))}
        style={{ width: "100%", accentColor: GREEN }}
      />
      <p style={{ color: MUTED, fontSize: 11, textAlign: "center", margin: "4px 0 0" }}>
        0 — {maxPrice.toLocaleString()} {t.currency}
      </p>

      {divider}

      {/* Gender filter */}
      {sectionTitle(t.sex)}
      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        {[
          { key: "all",    label: t.all },
          { key: "male",   label: t.male },
          { key: "female", label: t.female },
        ].map(({ key, label }) => {
          const active = sex === key;
          return (
            <button
              key={key}
              onClick={() => onSexChange(key)}
              style={{
                flex: 1,
                padding: "7px 6px", borderRadius: 8,
                border: `1px solid ${active ? GREEN : BORDER}`,
                backgroundColor: active ? (dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.06)") : SURFACE,
                color: active ? GREEN : MUTED,
                fontSize: 12, fontWeight: active ? 700 : 400,
                cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                textAlign: "center", transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {divider}

      {/* Verified toggle */}
      <button
        onClick={() => onVerified(!verified)}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 12px", borderRadius: 8,
          border: `1px solid ${verified ? GREEN : BORDER}`,
          backgroundColor: verified ? (dark ? "rgba(0,210,106,0.1)" : "rgba(0,210,106,0.06)") : "transparent",
          cursor: "pointer", fontFamily: "'Cairo',sans-serif",
        }}
      >
        <BadgeCheck size={18} color={verified ? GREEN : MUTED} />
        <span style={{ color: verified ? GREEN : MUTED, fontSize: 13, fontWeight: verified ? 700 : 400 }}>
          {t.verified}
        </span>
        <div style={{
          marginRight: "auto", marginLeft: "auto",
          width: 36, height: 20, borderRadius: 10,
          backgroundColor: verified ? GREEN : SURFACE,
          border: `1px solid ${verified ? GREEN : BORDER}`,
          position: "relative", transition: "all 0.2s", flexShrink: 0,
          ...(lang === "ar" ? { marginRight: "auto" } : { marginLeft: "auto" }),
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
