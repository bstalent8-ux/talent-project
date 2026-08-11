"use client";
import { SlidersHorizontal, X, type LucideIcon } from "lucide-react";
import type { SortOption } from "./JobsClient";
import styles from "./JobsPage.module.css";

interface Cat { key: string; label_ar: string; label_en: string; icon: LucideIcon }

interface Props {
  lang: "ar" | "en";
  sort: SortOption;
  onSort: (s: SortOption) => void;
  minBudget: number;
  maxBudget: number;
  onMinBudget: (n: number) => void;
  onMaxBudget: (n: number) => void;
  category: string;
  onCategory: (c: string) => void;
  categories: Cat[];
  open: boolean;
  onClose: () => void;
  onReset: () => void;
}

const SORT_OPTIONS: { key: SortOption; label_ar: string; label_en: string }[] = [
  { key: "newest",      label_ar: "الأحدث",         label_en: "Newest" },
  { key: "budget_desc", label_ar: "الأعلى ميزانية", label_en: "Highest budget" },
  { key: "budget_asc",  label_ar: "الأقل ميزانية",  label_en: "Lowest budget" },
  { key: "slots_desc",  label_ar: "أكثر أماكن",     label_en: "Most slots" },
];

export default function JobsFilters({
  lang, sort, onSort,
  minBudget, maxBudget, onMinBudget, onMaxBudget,
  category, onCategory, categories,
  open, onClose, onReset,
}: Props) {
  const ar = lang === "ar";
  const t = {
    filters:  ar ? "التصفية"            : "Filters",
    reset:    ar ? "إعادة ضبط"          : "Reset",
    sort_by:  ar ? "الترتيب"            : "Sort by",
    type:     ar ? "نوع الموهبة"        : "Talent type",
    budget:   ar ? "نطاق الميزانية"     : "Budget range",
    min:      ar ? "الحد الأدنى"        : "Min",
    max:      ar ? "الحد الأقصى"        : "Max",
    currency: ar ? "ج.م"                : "EGP",
  };

  return (
    <aside className={`${styles.filters} ${open ? styles.filtersOpen : ""}`}>
      <div className={styles.filtersHeader}>
        <span className={styles.filtersTitle}>
          <SlidersHorizontal size={16} />
          {t.filters}
        </span>
        <button type="button" className={styles.filtersReset} onClick={onReset}>{t.reset}</button>
        <button
          type="button"
          className={`${styles.mobileFilterBtn} ${styles.filterCloseBtn}`}
          onClick={onClose}
          aria-label="close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Sort */}
      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>{t.sort_by}</p>
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              className={`${styles.filterOption} ${active ? styles.filterOptionActive : ""}`}
              onClick={() => onSort(opt.key)}
            >
              <span className={styles.radioDot}>{active && <span />}</span>
              {ar ? opt.label_ar : opt.label_en}
            </button>
          );
        })}
      </div>

      {/* Talent type */}
      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>{t.type}</p>
        {categories.map((cat) => {
          const active = category === cat.key;
          const Icon = cat.icon;
          return (
            <button
              key={cat.key}
              type="button"
              className={`${styles.filterOption} ${active ? styles.filterOptionActive : ""}`}
              onClick={() => onCategory(cat.key)}
            >
              <Icon size={14} />
              {ar ? cat.label_ar : cat.label_en}
            </button>
          );
        })}
      </div>

      {/* Budget */}
      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>{t.budget}</p>
        <div className={styles.priceInputs}>
          <label className={styles.priceField}>
            <span>{t.min}</span>
            <input type="number" min={0} value={minBudget} onChange={(e) => onMinBudget(Number(e.target.value))} />
          </label>
          <label className={styles.priceField}>
            <span>{t.max}</span>
            <input type="number" min={0} value={maxBudget} onChange={(e) => onMaxBudget(Number(e.target.value))} />
          </label>
        </div>
        <input
          className={styles.range}
          type="range" min={0} max={100000} step={1000} value={maxBudget}
          onChange={(e) => onMaxBudget(Number(e.target.value))}
        />
        <p className={styles.rangeValue}>0 — {maxBudget.toLocaleString()} {t.currency}</p>
      </div>
    </aside>
  );
}
