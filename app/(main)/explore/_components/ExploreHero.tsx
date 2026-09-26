"use client";
import { Search, Sparkles, Star, BadgeCheck } from "lucide-react";
import Link from "next/link";
import type { TalentCard } from "../page";
import { cdnImage } from "@/lib/images";
import { canonicalTalentPath } from "@/lib/talent-profile-route";
import ProtectedAction from "@/components/auth/ProtectedAction";
import styles from "./ExplorePage.module.css";

// Compact hero — was a ~700px-tall stack (badge + title + subtitle + search
// + quick-type pills + a 4-stat strip), pushing filters/results below the
// fold. Trimmed to badge + one-line title + search only; the quick-type
// pills were a duplicate of ExploreFilters' own "Talent type" group (same
// activeType/onTypeChange), so dropping them here loses no functionality.
// The real background image (was a CSS gradient only) + featured-talent
// marquee replace the height that used to come from the stats strip.
// Sized per viewport (srcSet) — a single 1600px/277 KB image was the LCP on
// phones (8.5 s on Lighthouse mobile). The hero sits under a dark overlay, so
// q=60 is visually identical.
const HERO_SRC = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=60";
const HERO_BG = `${HERO_SRC}&w=1280`;
const HERO_SRCSET = [480, 768, 1024, 1280, 1600].map((w) => `${HERO_SRC}&w=${w} ${w}w`).join(", ");

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
  // The marquee's translateX(0 -> -50%) loop is only seamless if a single
  // "half" of the track is already wider than the viewport — otherwise the
  // short strip visibly runs out and snaps back before it ever fills the
  // screen (looked like it "ends" instead of flowing continuously, e.g.
  // when only a handful of talents have an avatar_url). Repeat the featured
  // set enough times per half to guarantee that, then duplicate the half for
  // the loop itself.
  const copiesPerHalf = featured.length > 0 ? Math.max(2, Math.ceil(14 / featured.length)) : 0;
  const half = Array.from({ length: copiesPerHalf }, () => featured).flat();
  const marqueeItems = half.length > 0 ? [...half, ...half] : [];

  return (
    <section className={styles.hero}>
      <img className={styles.heroImage} src={HERO_BG} srcSet={HERO_SRCSET} sizes="100vw" alt="" aria-hidden="true" loading="eager" fetchPriority="high" decoding="async" />
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
          <div
            className={styles.heroCarouselTrack}
            style={{ animationDuration: `${marqueeItems.length * 3}s` }}
          >
            {marqueeItems.map((t, i) => {
              const profileHref = canonicalTalentPath(t.category, t.handle);
              return (
                <ProtectedAction key={`${t.id}-${i}`} action="view_talent_profile" nextPathOverride={profileHref}>
                  <Link
                    href={profileHref}
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
                </ProtectedAction>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
