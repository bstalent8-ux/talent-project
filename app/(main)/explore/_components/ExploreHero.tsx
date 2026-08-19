"use client";
import { Search, Sparkles, Star, BadgeCheck } from "lucide-react";
import Link from "next/link";
import type { TalentCard } from "../page";
import { cdnImage } from "@/lib/images";
import { canonicalTalentPath } from "@/lib/talent-profile-route";
import styles from "./ExplorePage.module.css";

// Compact hero — was a ~700px-tall stack (badge + title + subtitle + search
// + quick-type pills + a 4-stat strip), pushing filters/results below the
// fold. Trimmed to badge + one-line title + search only; the quick-type
// pills were a duplicate of ExploreFilters' own "Talent type" group (same
// activeType/onTypeChange), so dropping them here loses no functionality.
// The real background image (was a CSS gradient only) + featured-talent
// marquee replace the height that used to come from the stats strip.
const HERO_BG = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=70";

interface Props {
  lang: "ar" | "en";
  search: string;
  onSearch: (v: string) => void;
  resultCount: number;
  featured: TalentCard[];
}

export default function ExploreHero({ lang, search, onSearch, resultCount, featured }: Props) {
  const ar = lang === "ar";
  const ph = ar ? "ابحث عن موهبة، تخصص، أو اسم..." : "Search by name, specialty, category...";
  // Duplicated once so the CSS marquee (translateX 0 -> -50%) loops seamlessly.
  const marqueeItems = featured.length > 0 ? [...featured, ...featured] : [];

  return (
    <section className={styles.hero}>
      <img className={styles.heroImage} src={HERO_BG} alt="" aria-hidden="true" loading="eager" />
      <div className={styles.heroOverlay} aria-hidden="true" />

      <div className={styles.heroContent}>
        <span className={styles.badge}>
          <Sparkles size={13} />
          {ar ? `${resultCount.toLocaleString()} موهبة متاحة الآن` : `${resultCount.toLocaleString()} talents available now`}
        </span>

        <h1 className={styles.heroTitle}>
          {ar ? <>استكشف <em>أفضل المواهب</em> في العالم العربي</>
              : <>Discover the <em>best talent</em> in the Arab world</>}
        </h1>

        <div className={styles.searchBar}>
          <Search size={17} />
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
            <Search size={14} />
            {ar ? "بحث" : "Search"}
          </button>
        </div>
      </div>

      {marqueeItems.length > 0 && (
        <div className={styles.heroCarousel} aria-hidden="true">
          <div className={styles.heroCarouselTrack}>
            {marqueeItems.map((t, i) => (
              <Link
                key={`${t.id}-${i}`}
                href={canonicalTalentPath(t.category, t.handle)}
                className={styles.heroCarouselCard}
                tabIndex={-1}
              >
                <span className={styles.heroCarouselAvatar}>
                  {t.avatar_url ? (
                    <img src={cdnImage(t.avatar_url, 120)} alt="" loading="lazy" />
                  ) : (
                    <span className={styles.heroCarouselInitial}>{t.name.charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <span className={styles.heroCarouselMeta}>
                  <span className={styles.heroCarouselName}>
                    {t.name}
                    {t.verified && <BadgeCheck size={11} />}
                  </span>
                  {t.rating > 0 && (
                    <span className={styles.heroCarouselRating}>
                      <Star size={10} fill="currentColor" />
                      {t.rating.toFixed(1)}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
