"use client";
import { SlidersHorizontal, BadgeCheck, X } from "lucide-react";
import type { SortOption } from "./ExploreClient";
import styles from "./ExplorePage.module.css";

interface TypeTab { key: string; label_ar: string; label_en: string }

interface Props {
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
  open: boolean;
  onClose: () => void;
}

const SORT_OPTIONS: { key: SortOption; label_ar: string; label_en: string }[] = [
  { key: "rating",     label_ar: "الأعلى تقييماً", label_en: "Top rated" },
  { key: "price_asc",  label_ar: "الأرخص أولاً",   label_en: "Price: low to high" },
  { key: "price_desc", label_ar: "الأعلى سعراً",   label_en: "Price: high to low" },
  { key: "newest",     label_ar: "الأحدث",          label_en: "Newest" },
];

export default function ExploreFilters({
  lang, sort, onSort,
  minPrice, maxPrice, onMinPrice, onMaxPrice,
  verified, onVerified,
  sex, onSexChange,
  types, activeType, onTypeChange,
  open, onClose,
}: Props) {
  const ar = lang === "ar";
  const t = {
    filters:  ar ? "التصفية"      : "Filters",
    reset:    ar ? "إعادة ضبط"    : "Reset",
    sort_by:  ar ? "الترتيب"      : "Sort by",
    type:     ar ? "نوع الموهبة"  : "Talent type",
    price:    ar ? "نطاق السعر"   : "Price range",
    min:      ar ? "الحد الأدنى"  : "Min",
    max:      ar ? "الحد الأقصى"  : "Max",
    verified: ar ? "موثّق فقط"    : "Verified only",
    sex:      ar ? "الجنس"        : "Gender",
    male:     ar ? "ذكر"          : "Male",
    female:   ar ? "أنثى"         : "Female",
    all:      ar ? "الكل"         : "All",
    currency: ar ? "ج.م"         : "EGP",
  };

  const handleReset = () => {
    onSort("rating");
    onMinPrice(0);
    onMaxPrice(10000);
    onVerified(false);
    onSexChange("all");
    onTypeChange("all");
  };

  return (
    <aside className={`${styles.filters} ${open ? styles.filtersOpen : ""}`}>
      <div className={styles.filtersHeader}>
        <span className={styles.filtersTitle}>
          <SlidersHorizontal size={16} />
          {t.filters}
        </span>
        <button type="button" className={styles.filtersReset} onClick={handleReset}>{t.reset}</button>
        <button
          type="button"
          className={styles.mobileFilterBtn}
          style={{ padding: 6, border: "none", background: "transparent" }}
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
        {types.map((tab) => {
          const active = activeType === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              className={`${styles.filterOption} ${active ? styles.filterOptionActive : ""}`}
              onClick={() => onTypeChange(tab.key)}
            >
              {ar ? tab.label_ar : tab.label_en}
            </button>
          );
        })}
      </div>

      {/* Price */}
      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>{t.price}</p>
        <div className={styles.priceInputs}>
          <label className={styles.priceField}>
            <span>{t.min}</span>
            <input type="number" min={0} value={minPrice} onChange={(e) => onMinPrice(Number(e.target.value))} />
          </label>
          <label className={styles.priceField}>
            <span>{t.max}</span>
            <input type="number" min={0} value={maxPrice} onChange={(e) => onMaxPrice(Number(e.target.value))} />
          </label>
        </div>
        <input
          className={styles.range}
          type="range" min={0} max={10000} step={500} value={maxPrice}
          onChange={(e) => onMaxPrice(Number(e.target.value))}
        />
        <p className={styles.rangeValue}>0 — {maxPrice.toLocaleString()} {t.currency}</p>
      </div>

      {/* Gender */}
      <div className={styles.filterGroup}>
        <p className={styles.filterLabel}>{t.sex}</p>
        <div className={styles.chipRow}>
          {[
            { key: "all", label: t.all },
            { key: "male", label: t.male },
            { key: "female", label: t.female },
          ].map(({ key, label }) => {
            const active = sex === key;
            return (
              <button
                key={key}
                type="button"
                className={`${styles.filterOption} ${active ? styles.filterOptionActive : ""}`}
                onClick={() => onSexChange(key)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified toggle */}
      <div className={styles.filterGroup}>
        <button
          type="button"
          className={`${styles.toggle} ${verified ? styles.toggleActive : ""}`}
          onClick={() => onVerified(!verified)}
        >
          <BadgeCheck size={17} />
          {t.verified}
          <span className={`${styles.toggleTrack} ${verified ? styles.toggleTrackOn : ""}`}>
            <span className={`${styles.toggleKnob} ${verified ? styles.toggleKnobOn : ""}`} />
          </span>
        </button>
      </div>
    </aside>
  );
}
