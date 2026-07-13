"use client";
import { useState, useMemo, useEffect } from "react";
import { useSite } from "@/contexts/SiteContext";
import Link from "next/link";

const PAGE_SIZE = 12;
import type { JobPost } from "../page";
import JobsGrid from "./JobsGrid";
import JobsFilters from "./JobsFilters";

const CATEGORIES = [
  { key: "all",        label_ar: "الكل",           label_en: "All" },
  { key: "ugc",        label_ar: "مبدع محتوى UGC", label_en: "UGC Creator" },
  { key: "influencer", label_ar: "مؤثر",           label_en: "Influencer" },
  { key: "model",      label_ar: "موديل",           label_en: "Model" },
  { key: "actor",      label_ar: "ممثل",            label_en: "Actor" },
  { key: "host",       label_ar: "مذيع / مقدم",    label_en: "Host" },
  { key: "photographer", label_ar: "مصور",          label_en: "Photographer" },
];

export type SortOption = "newest" | "budget_desc" | "budget_asc" | "slots_desc";

interface Props { jobs: JobPost[] }

export default function JobsClient({ jobs }: Props) {
  const { lang, dark } = useSite();
  const ar = lang === "ar";

  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [sort,     setSort]     = useState<SortOption>("newest");
  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(100000);
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, category, sort, minBudget, maxBudget]);

  const filtered = useMemo(() => {
    let list = jobs.filter((j) => {
      if (search) {
        const q = search.toLowerCase();
        if (!j.title.toLowerCase().includes(q)
          && !(j.description ?? "").toLowerCase().includes(q)
          && !(j.brand?.full_name ?? "").toLowerCase().includes(q)) return false;
      }
      if (category !== "all" && j.category !== category) return false;
      const mid = ((j.budget_min ?? 0) + (j.budget_max ?? j.budget_min ?? 0)) / 2;
      if (j.budget_min !== null && mid < minBudget) return false;
      if (j.budget_max !== null && mid > maxBudget) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sort === "newest")      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "budget_desc") return (b.budget_max ?? b.budget_min ?? 0) - (a.budget_max ?? a.budget_min ?? 0);
      if (sort === "budget_asc")  return (a.budget_min ?? a.budget_max ?? 0) - (b.budget_min ?? b.budget_max ?? 0);
      if (sort === "slots_desc")  return b.slots - a.slots;
      return 0;
    });
  }, [jobs, search, category, sort, minBudget, maxBudget]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const GREEN  = "#00D26A";
  const GOLD   = "#FFB800";
  const BG     = dark ? "#050B12" : "#F1F5F9";
  const BORDER = dark ? "rgba(0,255,163,0.1)" : "#e2e8f0";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: BG, fontFamily: "'Cairo',sans-serif", direction: ar ? "rtl" : "ltr" }}>

      {/* Hero */}
      <div style={{
        background: dark ? "linear-gradient(135deg,#0D1623 0%,#060d18 100%)" : "linear-gradient(135deg,#f0fdf4 0%,#fffbeb 100%)",
        borderBottom: `1px solid ${BORDER}`,
        padding: "40px 24px 28px",
      }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              <h1 style={{ color: dark ? "#fff" : "#0f172a", fontSize: 28, fontWeight: 900, margin: "0 0 4px" }}>
                {ar ? "الوظائف والفرص 💼" : "Jobs & Opportunities 💼"}
              </h1>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                {ar ? `${jobs.length} فرصة متاحة للمواهب` : `${jobs.length} opportunities available for talents`}
              </p>
            </div>
            {/* Post a job CTA — visible to brands */}
            <Link href="/jobs/create" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              backgroundColor: GOLD, color: "#000",
              padding: "10px 20px", borderRadius: 12,
              fontWeight: 800, fontSize: 14,
              textDecoration: "none", fontFamily: "'Cairo',sans-serif",
              boxShadow: "0 4px 16px rgba(255,184,0,0.35)",
            }}>
              + {ar ? "نشر وظيفة" : "Post a Job"}
            </Link>
          </div>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 480, marginBottom: 16 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "ابحث باسم الوظيفة أو البراند…" : "Search by job title or brand…"}
              style={{
                width: "100%", padding: "12px 16px 12px 44px",
                backgroundColor: dark ? "#0D1623" : "#fff",
                border: `1px solid ${dark ? "rgba(0,255,163,0.2)" : "#e2e8f0"}`,
                borderRadius: 12, color: dark ? "#f1f5f9" : "#0f172a",
                fontSize: 14, outline: "none", fontFamily: "'Cairo',sans-serif",
                boxSizing: "border-box", direction: ar ? "rtl" : "ltr",
              }}
            />
            <span style={{
              position: "absolute", top: "50%", transform: "translateY(-50%)",
              ...(ar ? { right: 14 } : { left: 14 }),
              color: "#64748b", pointerEvents: "none",
            }}>🔍</span>
          </div>

          {/* Category tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.key;
              return (
                <button key={cat.key} onClick={() => setCategory(cat.key)} style={{
                  padding: "6px 16px", borderRadius: 20,
                  border: `1px solid ${active ? GREEN : (dark ? "rgba(255,255,255,0.1)" : "#e2e8f0")}`,
                  backgroundColor: active ? "rgba(0,210,106,0.12)" : "transparent",
                  color: active ? GREEN : (dark ? "#94a3b8" : "#64748b"),
                  fontSize: 13, fontWeight: active ? 700 : 400,
                  cursor: "pointer", fontFamily: "'Cairo',sans-serif", transition: "all 0.15s",
                }}>
                  {ar ? cat.label_ar : cat.label_en}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div style={{
        maxWidth: 1440, margin: "0 auto",
        padding: "24px 24px 60px",
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        alignItems: "start",
        gap: 20,
      }}>
        <JobsFilters
          dark={dark} lang={lang}
          sort={sort} onSort={setSort}
          minBudget={minBudget} maxBudget={maxBudget}
          onMinBudget={setMinBudget} onMaxBudget={setMaxBudget}
          category={category} onCategory={setCategory}
          categories={CATEGORIES}
          resultCount={filtered.length}
          onReset={() => { setSort("newest"); setCategory("all"); setMinBudget(0); setMaxBudget(100000); setSearch(""); }}
        />
        <div>
          <JobsGrid dark={dark} lang={lang} jobs={paginated} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 32, flexWrap: "wrap",
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: "8px 18px", borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  backgroundColor: page === 1 ? "transparent" : (dark ? "#0D1623" : "#fff"),
                  color: page === 1 ? "#64748b" : (dark ? "#fff" : "#0f172a"),
                  fontSize: 13, fontWeight: 700, cursor: page === 1 ? "default" : "pointer",
                  fontFamily: "'Cairo',sans-serif", opacity: page === 1 ? 0.4 : 1,
                }}
              >
                {ar ? "→ السابق" : "← Prev"}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    border: `1px solid ${p === page ? GREEN : BORDER}`,
                    backgroundColor: p === page ? GREEN : "transparent",
                    color: p === page ? "#000" : (dark ? "#94a3b8" : "#64748b"),
                    fontSize: 13, fontWeight: p === page ? 900 : 400,
                    cursor: "pointer", fontFamily: "'Cairo',sans-serif",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: "8px 18px", borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  backgroundColor: page === totalPages ? "transparent" : (dark ? "#0D1623" : "#fff"),
                  color: page === totalPages ? "#64748b" : (dark ? "#fff" : "#0f172a"),
                  fontSize: 13, fontWeight: 700, cursor: page === totalPages ? "default" : "pointer",
                  fontFamily: "'Cairo',sans-serif", opacity: page === totalPages ? 0.4 : 1,
                }}
              >
                {ar ? "← التالي" : "Next →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
