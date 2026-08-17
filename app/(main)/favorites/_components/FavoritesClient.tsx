"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star, MapPin, BadgeCheck, Heart, Search, Sparkles } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import { cdnImage } from "@/lib/images";
import type { FavoriteTalentCard } from "@/features/favorites/service";
import styles from "./FavoritesPage.module.css";

const TX = {
  ar: {
    title: "المفضلة",
    subtitle: "المواهب التي أضفتها إلى المفضلة للرجوع إليها لاحقًا.",
    all: "الكل",
    ugc: "مبدعو UGC",
    model: "الموديلز",
    search: "ابحث في المفضلة...",
    startingAt: "يبدأ من",
    getQuote: "اطلب عرض سعر",
    view: "عرض الملف",
    available: "متاح",
    unavailable: "غير متاح",
    ugcBadge: "مبدع UGC",
    modelBadge: "موديل",
    emptyTitle: "لا توجد مواهب في المفضلة حتى الآن",
    emptyText: "أضف المواهب التي تعجبك للمفضلة وستظهر هنا.",
    emptyCta: "استكشف المواهب",
    favoriteError: "تعذر تحديث المفضلة، حاول مرة أخرى",
  },
  en: {
    title: "Favorites",
    subtitle: "Talents you've added to your favorites for later.",
    all: "All",
    ugc: "UGC Creators",
    model: "Models",
    search: "Search favorites",
    startingAt: "Starting at",
    getQuote: "Get quote",
    view: "View Profile",
    available: "Available",
    unavailable: "Unavailable",
    ugcBadge: "UGC Creator",
    modelBadge: "Model",
    emptyTitle: "No favorites yet",
    emptyText: "Favorite talents you like and they will appear here.",
    emptyCta: "Explore Talents",
    favoriteError: "Couldn't update favorites, try again",
  },
};

type FilterKey = "all" | "ugc" | "model";

function isModelCategory(category: string | null) {
  return category === "model" || category === "fashion";
}

function categoryBadgeLabel(category: string | null, t: typeof TX["en"]) {
  if (category === "ugc") return t.ugcBadge;
  if (isModelCategory(category)) return t.modelBadge;
  return null;
}

export default function FavoritesClient({ initialFavorites }: { initialFavorites: FavoriteTalentCard[] }) {
  const { lang } = useSite();
  const ar = lang === "ar";
  const t = TX[lang];

  const [items, setItems] = useState(initialFavorites);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState(false);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filter === "ugc" && it.category !== "ugc") return false;
      if (filter === "model" && !isModelCategory(it.category)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!it.name.toLowerCase().includes(q) && !(it.category ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, filter, search]);

  async function removeFavorite(id: string) {
    if (removingId) return;
    setRemovingId(id);
    setRemoveError(false);
    const prev = items;
    setItems((list) => list.filter((it) => it.id !== id));
    try {
      const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setItems(prev);
        setRemoveError(true);
        console.error("[favorites] remove failed", { id, status: res.status });
      }
    } catch (e) {
      setItems(prev);
      setRemoveError(true);
      console.error("[favorites] remove network error", { id, error: e });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
      <div className="site-container">
        <div className={styles.header}>
          <h1 className={styles.title}>{t.title}</h1>
          <p className={styles.subtitle}>{t.subtitle}</p>
          {removeError && <p className={styles.errorText}>{t.favoriteError}</p>}
        </div>

        <div className={styles.controls}>
          <div className={styles.chips}>
            {(["all", "ugc", "model"] as FilterKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`${styles.chip} ${filter === key ? styles.chipActive : ""}`}
                onClick={() => setFilter(key)}
              >
                {t[key]}
              </button>
            ))}
          </div>

          <div className={styles.searchWrap}>
            <Search size={15} />
            <input
              className={styles.searchInput}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.search}
              aria-label={t.search}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          items.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><Heart size={26} /></span>
              <p className={styles.emptyTitle}>{t.emptyTitle}</p>
              <p className={styles.emptyText}>{t.emptyText}</p>
              <Link href="/explore" className={styles.emptyCta}>{t.emptyCta}</Link>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><Sparkles size={26} /></span>
              <p className={styles.emptyTitle}>{ar ? "لا نتائج مطابقة" : "No matches"}</p>
              <p className={styles.emptyText}>{ar ? "جرّب فلترًا أو بحثًا مختلفًا." : "Try a different filter or search."}</p>
            </div>
          )
        ) : (
          <div className={styles.grid}>
            {filtered.map((talent) => {
              const initial = talent.name.charAt(0).toUpperCase();
              const badge = categoryBadgeLabel(talent.category, t);
              return (
                <Link key={talent.id} href={`/talent/${talent.handle}`} className={styles.card}>
                  <div className={styles.media}>
                    {talent.avatar_url ? (
                      <img src={cdnImage(talent.avatar_url, 400)} alt={talent.name} loading="lazy" />
                    ) : (
                      <div className={styles.initial}>{initial}</div>
                    )}

                    {badge && <span className={styles.categoryBadge}>{badge}</span>}

                    <button
                      type="button"
                      className={styles.heartBtn}
                      disabled={removingId === talent.id}
                      aria-label={ar ? "إزالة من المفضلة" : "Remove from favorites"}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFavorite(talent.id); }}
                    >
                      <Heart size={16} fill="currentColor" />
                    </button>

                    {talent.rating > 0 && (
                      <span className={styles.ratingChip}>
                        <Star size={11} fill="currentColor" />
                        {talent.rating.toFixed(1)}
                        <span className={styles.ratingCount}>({talent.review_count})</span>
                      </span>
                    )}
                  </div>

                  <div className={styles.body}>
                    <h3 className={styles.name}>
                      <span>{talent.name}</span>
                      {talent.verified && <BadgeCheck size={15} />}
                    </h3>

                    {talent.location && (
                      <span className={styles.location}>
                        <MapPin size={11} />
                        {talent.location}
                      </span>
                    )}

                    {talent.specialties.length > 0 && (
                      <div className={styles.specialtyRow}>
                        {talent.specialties.slice(0, 2).map((s) => (
                          <span key={s} className={styles.specialtyTag}>{s}</span>
                        ))}
                      </div>
                    )}

                    {talent.availability && (
                      <span className={`${styles.availability} ${talent.availability === "available" ? styles.availAvailable : styles.availOther}`}>
                        {talent.availability === "available" ? t.available : t.unavailable}
                      </span>
                    )}

                    <div className={styles.footer}>
                      <div>
                        <p className={styles.priceLabel}>{t.startingAt}</p>
                        <p className={styles.priceValue}>
                          {talent.starting_price
                            ? `${talent.starting_price.toLocaleString()} ${ar ? "ج.م" : "EGP"}`
                            : t.getQuote}
                        </p>
                      </div>
                      <span className={styles.viewBtn}>{t.view}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
