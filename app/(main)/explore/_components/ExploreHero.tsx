"use client";
import { Search, Sparkles } from "lucide-react";
import styles from "./ExplorePage.module.css";

interface TypeTab { key: string; label_ar: string; label_en: string }

interface Props {
  lang: "ar" | "en";
  search: string;
  onSearch: (v: string) => void;
  types: TypeTab[];
  activeType: string;
  onTypeChange: (t: string) => void;
  resultCount: number;
  stats: { value: string; label: string }[];
}

export default function ExploreHero({
  lang, search, onSearch,
  types, activeType, onTypeChange, resultCount, stats,
}: Props) {
  const ar = lang === "ar";
  const ph = ar ? "ابحث عن موهبة، تخصص، أو اسم..." : "Search by name, specialty, category...";

  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />

      <div className={styles.heroContent}>
        <span className={styles.badge}>
          <Sparkles size={14} />
          {ar ? `${resultCount.toLocaleString()} موهبة متاحة الآن` : `${resultCount.toLocaleString()} talents available now`}
        </span>

        <h1 className={styles.heroTitle}>
          {ar ? <>استكشف <em>أفضل المواهب</em> في العالم العربي</>
              : <>Discover the <em>best talent</em> in the Arab world</>}
        </h1>

        <p className={styles.heroSubtitle}>
          {ar
            ? "مؤثرون، صنّاع محتوى، موديلز ومصورون موثّقون — كل ما تحتاجه حملتك في مكان واحد."
            : "Verified influencers, UGC creators, models and photographers — everything your campaign needs, in one place."}
        </p>

        {/* Search */}
        <div className={styles.searchBar}>
          <Search size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={ph}
          />
          {search && (
            <button type="button" className={styles.searchClear} onClick={() => onSearch("")} aria-label="clear">×</button>
          )}
          <button type="button" className={styles.searchSubmit}>
            <Search size={15} />
            {ar ? "بحث" : "Search"}
          </button>
        </div>

        {/* Quick type pills */}
        <div className={styles.heroPills}>
          {types.map((tab) => {
            const active = tab.key === activeType;
            return (
              <button
                key={tab.key}
                type="button"
                className={`${styles.heroPill} ${active ? styles.heroPillActive : ""}`}
                onClick={() => onTypeChange(tab.key)}
              >
                {ar ? tab.label_ar : tab.label_en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats strip */}
      <div className={styles.statsStrip}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <div className={styles.statValue}>{s.value}</div>
            <div className={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
