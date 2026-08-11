"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSite } from "@/contexts/SiteContext";
import {
  Search, Sparkles, SlidersHorizontal, Plus,
  Camera, UsersRound, Mic2, Aperture, Clapperboard, LayoutGrid, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import ProtectedAction from "@/components/auth/ProtectedAction";

const PAGE_SIZE = 12;
import type { JobPost } from "../page";
import JobsGrid from "./JobsGrid";
import JobsFilters from "./JobsFilters";
import styles from "./JobsPage.module.css";

const CATEGORIES: { key: string; label_ar: string; label_en: string; icon: LucideIcon }[] = [
  { key: "all",           label_ar: "الكل",           label_en: "All",             icon: LayoutGrid },
  { key: "ugc",           label_ar: "مبدع محتوى UGC", label_en: "UGC Creator",     icon: Camera },
  { key: "influencer",    label_ar: "مؤثر",           label_en: "Influencer",      icon: UsersRound },
  { key: "model",         label_ar: "موديل",           label_en: "Model",           icon: Sparkles },
  { key: "actor",         label_ar: "ممثل",            label_en: "Actor",           icon: Clapperboard },
  { key: "host",          label_ar: "مذيع / مقدم",    label_en: "Host",            icon: Mic2 },
  { key: "photographer",  label_ar: "مصور",            label_en: "Photographer",    icon: Aperture },
];

export type SortOption = "newest" | "budget_desc" | "budget_asc" | "slots_desc";

interface Props { jobs: JobPost[] }

export default function JobsClient({ jobs }: Props) {
  const { lang } = useSite();
  const ar = lang === "ar";

  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [sort,     setSort]     = useState<SortOption>("newest");
  const [minBudget, setMinBudget] = useState(0);
  const [maxBudget, setMaxBudget] = useState(100000);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

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


  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleReset = () => {
    setSort("newest");
    setCategory("all");
    setMinBudget(0);
    setMaxBudget(100000);
    setSearch("");
  };

  return (
    <div className={`${styles.page} ${ar ? styles.rtl : styles.ltr}`}>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />

        <div className={styles.heroContent}>
          <span className={styles.badge}>
            <Sparkles size={14} />
            {ar ? `${jobs.length.toLocaleString()} فرصة متاحة الآن` : `${jobs.length.toLocaleString()} opportunities available now`}
          </span>

          <h1 className={styles.heroTitle}>
            {ar ? <>اعثر على <em>فرصتك القادمة</em> من أفضل البراندات</>
                : <>Find your <em>next opportunity</em> with top brands</>}
          </h1>

          <p className={styles.heroSubtitle}>
            {ar
              ? "تصفّح وظائف حقيقية من براندات موثّقة، وقدّم عرضك مباشرة."
              : "Browse real openings from verified brands and submit your proposal directly."}
          </p>

          {/* Search */}
          <div className={styles.searchBar}>
            <Search size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ar ? "ابحث باسم الوظيفة أو البراند..." : "Search by job title or brand..."}
            />
            {search && (
              <button type="button" className={styles.searchClear} onClick={() => setSearch("")} aria-label="clear">×</button>
            )}
            <button type="button" className={styles.searchSubmit}>
              <Search size={15} />
              {ar ? "بحث" : "Search"}
            </button>
          </div>

          {/* Quick category pills */}
          <div className={styles.heroPills}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.key;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`${styles.heroPill} ${active ? styles.heroPillActive : ""}`}
                  onClick={() => { setCategory(cat.key); setTimeout(scrollToResults, 60); }}
                >
                  <Icon size={13} />
                  {ar ? cat.label_ar : cat.label_en}
                </button>
              );
            })}
          </div>

          {/* Post a job — secondary action, visible to brands */}
          <ProtectedAction action="create_job">
            <div className={styles.heroActions}>
              <Link href="/jobs/create" className={styles.buttonSecondary}>
                <Plus size={15} />
                {ar ? "نشر وظيفة" : "Post a job"}
              </Link>
            </div>
          </ProtectedAction>
        </div>

      </section>

      {/* ── Results: filters + grid ────────────────────── */}
      <section className={styles.section} ref={resultsRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderText}>
              <p className={styles.sectionKicker}>{ar ? "كل الوظائف" : "All jobs"}</p>
              <h2 className={styles.sectionTitle}>{ar ? "الفرص المتاحة الآن" : "Available opportunities"}</h2>
            </div>
          </div>

          <div className={styles.layout}>
            <JobsFilters
              lang={lang}
              sort={sort} onSort={setSort}
              minBudget={minBudget} maxBudget={maxBudget}
              onMinBudget={setMinBudget} onMaxBudget={setMaxBudget}
              category={category} onCategory={setCategory}
              categories={CATEGORIES}
              open={filtersOpen} onClose={() => setFiltersOpen(false)}
              onReset={handleReset}
            />

            <div>
              <div className={styles.resultsBar}>
                <span className={styles.resultsCount}>
                  {ar ? <><strong>{filtered.length}</strong> وظيفة</> : <><strong>{filtered.length}</strong> jobs</>}
                </span>
                <div className={styles.resultsControls}>
                  <button
                    type="button"
                    className={styles.mobileFilterBtn}
                    onClick={() => setFiltersOpen(true)}
                  >
                    <SlidersHorizontal size={15} />
                    {ar ? "تصفية" : "Filters"}
                  </button>
                  <div className={styles.sortWrap}>
                    <label htmlFor="jobs-sort">{ar ? "ترتيب" : "Sort"}</label>
                    <select
                      id="jobs-sort"
                      className={styles.sortSelect}
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                    >
                      <option value="newest">{ar ? "الأحدث" : "Newest"}</option>
                      <option value="budget_desc">{ar ? "الأعلى ميزانية" : "Highest budget"}</option>
                      <option value="budget_asc">{ar ? "الأقل ميزانية" : "Lowest budget"}</option>
                      <option value="slots_desc">{ar ? "أكثر أماكن" : "Most slots"}</option>
                    </select>
                  </div>
                </div>
              </div>

              <JobsGrid lang={lang} jobs={paginated} />

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => { setPage((p) => Math.max(1, p - 1)); scrollToResults(); }}
                    disabled={page === 1}
                  >
                    {ar ? "السابق" : "Prev"}
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`}
                      onClick={() => { setPage(p); scrollToResults(); }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.pageBtn}
                    onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); scrollToResults(); }}
                    disabled={page === totalPages}
                  >
                    {ar ? "التالي" : "Next"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile drawer backdrop */}
      <div
        className={`${styles.drawerBackdrop} ${filtersOpen ? styles.drawerBackdropOpen : ""}`}
        onClick={() => setFiltersOpen(false)}
      />
    </div>
  );
}
