"use client";
import { useState, useMemo } from "react";
import { useSite } from "@/contexts/SiteContext";
import type { BrandCard } from "../page";
import BrandsGrid from "./BrandsGrid";
import BrandsFilters from "./BrandsFilters";

const INDUSTRIES = [
  { key: "all",     label_ar: "الكل",          label_en: "All" },
  { key: "fashion", label_ar: "أزياء وموضة",   label_en: "Fashion" },
  { key: "food",    label_ar: "طعام ومشروبات", label_en: "Food & Drink" },
  { key: "tech",    label_ar: "تكنولوجيا",     label_en: "Tech" },
  { key: "beauty",  label_ar: "جمال وعناية",   label_en: "Beauty" },
  { key: "retail",  label_ar: "تجزئة",          label_en: "Retail" },
  { key: "media",   label_ar: "إعلام",           label_en: "Media" },
];

export type SortOption = "collab_desc" | "name_asc" | "newest";

interface Props { brands: BrandCard[] }

export default function BrandsClient({ brands }: Props) {
  const { lang, dark } = useSite();
  const ar = lang === "ar";

  const [search,   setSearch]   = useState("");
  const [industry, setIndustry] = useState("all");
  const [sort,     setSort]     = useState<SortOption>("collab_desc");
  const [verified, setVerified] = useState(false);

  const filtered = useMemo(() => {
    let list = brands.filter((b) => {
      if (search) {
        const q = search.toLowerCase();
        if (!b.name.toLowerCase().includes(q) && !(b.city ?? "").toLowerCase().includes(q)) return false;
      }
      if (industry !== "all" && b.industry !== industry) return false;
      if (verified && !b.verified) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "collab_desc") return b.collab_count - a.collab_count;
      if (sort === "name_asc")   return a.name.localeCompare(b.name, ar ? "ar" : "en");
      return 0;
    });

    return list;
  }, [brands, search, industry, sort, verified, ar]);

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: dark ? "#050B12" : "#F1F5F9",
      fontFamily: "'Cairo', sans-serif",
      direction: ar ? "rtl" : "ltr",
    }}>
      {/* ── Hero / search bar ── */}
      <div style={{
        background: dark
          ? "linear-gradient(135deg,#0D1623 0%,#060d18 100%)"
          : "linear-gradient(135deg,#f0fdf4 0%,#e0f2fe 100%)",
        borderBottom: `1px solid ${dark ? "rgba(0,255,163,0.1)" : "#e2e8f0"}`,
        padding: "40px 24px 28px",
      }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <h1 style={{
            color: dark ? "#fff" : "#0f172a",
            fontSize: 28, fontWeight: 900, margin: "0 0 4px",
          }}>
            {ar ? "استكشف البراندات 🏢" : "Explore Brands 🏢"}
          </h1>
          <p style={{ color: dark ? "#64748b" : "#64748b", fontSize: 14, margin: "0 0 20px" }}>
            {ar
              ? `${brands.length} براند يبحثون عن مواهب للتعاون`
              : `${brands.length} brands looking for talent collaborations`}
          </p>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 480 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "ابحث باسم البراند أو المدينة…" : "Search by name or city…"}
              style={{
                width: "100%", padding: "12px 16px 12px 44px",
                backgroundColor: dark ? "#0D1623" : "#fff",
                border: `1px solid ${dark ? "rgba(0,255,163,0.2)" : "#e2e8f0"}`,
                borderRadius: 12, color: dark ? "#f1f5f9" : "#0f172a",
                fontSize: 14, outline: "none", fontFamily: "'Cairo',sans-serif",
                boxSizing: "border-box",
                direction: ar ? "rtl" : "ltr",
              }}
            />
            <span style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              ...(ar ? { right: 14 } : { left: 14 }),
              color: "#64748b", pointerEvents: "none", fontSize: 16,
            }}>🔍</span>
          </div>

          {/* Industry quick-tabs */}
          <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            {INDUSTRIES.map((ind) => {
              const active = industry === ind.key;
              return (
                <button
                  key={ind.key}
                  onClick={() => setIndustry(ind.key)}
                  style={{
                    padding: "6px 16px", borderRadius: 20,
                    border: `1px solid ${active ? "#00D26A" : (dark ? "rgba(255,255,255,0.1)" : "#e2e8f0")}`,
                    backgroundColor: active ? "rgba(0,210,106,0.12)" : "transparent",
                    color: active ? "#00D26A" : (dark ? "#94a3b8" : "#64748b"),
                    fontSize: 13, fontWeight: active ? 700 : 400,
                    cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {ar ? ind.label_ar : ind.label_en}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{
        maxWidth: 1440, margin: "0 auto",
        padding: "24px 24px 60px",
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        alignItems: "start",
        gap: 20,
      }}>
        <BrandsFilters
          dark={dark} lang={lang}
          sort={sort} onSort={setSort}
          verified={verified} onVerified={setVerified}
          industry={industry} onIndustry={setIndustry}
          industries={INDUSTRIES}
          resultCount={filtered.length}
          onReset={() => { setSort("collab_desc"); setVerified(false); setIndustry("all"); setSearch(""); }}
        />
        <BrandsGrid dark={dark} lang={lang} brands={filtered} />
      </div>
    </div>
  );
}
