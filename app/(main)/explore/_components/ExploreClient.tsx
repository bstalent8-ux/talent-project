"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal, ShieldCheck, Wallet, MessagesSquare, Star, type LucideIcon,
} from "lucide-react";

import type { TalentCard } from "../page";
import ExploreHero from "./ExploreHero";
import ExploreFilters from "./ExploreFilters";
import ExploreGrid from "./ExploreGrid";
import { useSite } from "@/contexts/SiteContext";
import { categoryMatchRank, MATCH_RANK_NONE } from "@/features/categories/matching";
import DirectBriefModal from "@/components/DirectBriefModal";
import styles from "./ExplorePage.module.css";

// 8 = ~2 rows at the grid's primary 4-column desktop width (see
// .talentGrid's minmax(188px)), matching the now-compact filter sidebar's
// height instead of running several rows past it.
const PAGE_SIZE = 8;

export type SortOption = "price_asc" | "price_desc" | "rating" | "newest";

// Platform restricted to UGC + Model talents only (matches
// app/(auth)/register/page.tsx's TALENT_TYPES and
// CompleteProfileShell.tsx's CATEGORIES). Influencer/host/actor were UI-only
// filter buckets that matched on specialty keywords, not the real
// `category` column — dropped along with every other legacy category.
const TALENT_TYPES = [
  { key: "all",   label_ar: "الكل",           label_en: "All" },
  { key: "ugc",   label_ar: "مبدع محتوى UGC", label_en: "UGC Creator" },
  { key: "model", label_ar: "موديل",          label_en: "Model" },
];

function matchesType(talent: TalentCard, type: string): boolean {
  if (type === "all") return true;
  return (talent.category ?? "").toLowerCase() === type;
}

interface Props {
  talents: TalentCard[];
  /** Category of the viewing brand, or null (guest / talent / no category set). */
  viewerBrandCategory?: string | null;
}

export default function ExploreClient({ talents, viewerBrandCategory = null }: Props) {
  const { lang, dark } = useSite();
  const ar = lang === "ar";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search,   setSearch]   = useState(() => searchParams.get("q") ?? "");
  const [type,     setType]     = useState("all");
  const [sort,     setSort]     = useState<SortOption>("rating");
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(10000);
  const [verified, setVerified] = useState(false);
  const [sex,      setSex]      = useState("all");
  const [page,     setPage]     = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [myRole, setMyRole] = useState<string | null>(null);
  const [myId,   setMyId]   = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteError, setFavoriteError] = useState(false);
  const [briefTarget, setBriefTarget] = useState<TalentCard | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      // /api/me/role returns both id and role, so this is one request instead of
      // an auth.getUser() round trip followed by the role lookup.
      const res = await fetch("/api/me/role");
      if (!res.ok) return;
      const d = await res.json();
      setMyId(d.id ?? null);
      setMyRole(d.role);
    })();
  }, []);

  // One list fetch for the whole grid's favorited state, instead of a GET
  // per card — same canonical /api/favorites source /favorites (the page)
  // and the talent profile shells read, so a favorite toggled anywhere
  // shows up here on next load.
  useEffect(() => {
    if (!myId) return;
    (async () => {
      try {
        const res = await fetch("/api/favorites");
        if (!res.ok) return;
        const { data } = await res.json();
        setFavoriteIds(new Set((data ?? []).map((f: { id: string }) => f.id)));
      } catch {
        // Non-fatal — cards just render unfavorited.
      }
    })();
  }, [myId]);

  async function toggleFavorite(talentId: string) {
    const wasFavorited = favoriteIds.has(talentId);
    setFavoriteError(false);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) next.delete(talentId); else next.add(talentId);
      return next;
    });
    try {
      const res = await fetch(`/api/favorites/${talentId}`, { method: wasFavorited ? "DELETE" : "PUT" });
      if (!res.ok) throw new Error(`favorite toggle failed: ${res.status}`);
    } catch (e) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) next.add(talentId); else next.delete(talentId);
        return next;
      });
      setFavoriteError(true);
      console.error("[favorites] toggle failed", { talentId, error: e });
    }
  }

  useEffect(() => { setPage(1); }, [search, type, sort, minPrice, maxPrice, verified, sex]);

  // ── URL "q" sync ───────────────────────────────────────
  // Browser back/forward and hard refresh change the URL under us; mirror
  // "q" into local state so the existing filter logic below picks it up.
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setSearch((prev) => (prev === q ? prev : q));
  }, [searchParams]);

  // Typing updates local state first (for instant filtering); reflect it
  // back into the URL so refresh/back-forward/copy-paste stay correct.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (current === search) return;
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("q", search); else params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ── Personalized ranking key ──────────────────────────
  // A brand sees talents in its own category first. This is a ranking bucket
  // only — nobody is filtered out, and a null category leaves every talent at
  // the same rank, which makes the sort below collapse to its previous form.
  const matchRankById = useMemo(() => {
    if (!viewerBrandCategory) return null;
    return new Map(talents.map((t) => [t.id, categoryMatchRank(viewerBrandCategory, t.category)]));
  }, [talents, viewerBrandCategory]);

  const filtered = useMemo(() => {
    let list = talents.filter((t) => {
      // Platform restriction, independent of the Type dropdown: Explore
      // only ever surfaces ugc/model talents, even when "All" is selected.
      const category = (t.category ?? "").toLowerCase();
      if (category !== "ugc" && category !== "model") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !(t.category ?? "").toLowerCase().includes(q)) return false;
      }
      if (!matchesType(t, type)) return false;
      if (sex !== "all" && t.gender !== sex) return false;
      if (verified && !t.verified) return false;
      if (t.starting_price !== null) {
        if (t.starting_price < minPrice || t.starting_price > maxPrice) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      // Category affinity is the primary key; the chosen sort breaks ties.
      if (matchRankById) {
        const rankDiff = (matchRankById.get(a.id) ?? MATCH_RANK_NONE) - (matchRankById.get(b.id) ?? MATCH_RANK_NONE);
        if (rankDiff !== 0) return rankDiff;
      }
      if (sort === "price_asc")  return (a.starting_price ?? 99999) - (b.starting_price ?? 99999);
      if (sort === "price_desc") return (b.starting_price ?? 0)     - (a.starting_price ?? 0);
      if (sort === "rating")     return b.rating - a.rating;
      return 0;
    });

    return list;
  }, [talents, search, type, sort, minPrice, maxPrice, verified, sex, matchRankById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Featured talents for the hero marquee ─────────────
  // Top-rated first (verified as a tiebreaker), avatar required — a blank
  // initial-letter tile in a fast-moving strip reads as a loading glitch.
  const featuredTalents = useMemo(() => {
    return [...talents]
      .filter((t) => t.avatar_url)
      .sort((a, b) => (b.rating - a.rating) || (Number(b.verified) - Number(a.verified)))
      .slice(0, 10);
  }, [talents]);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const features: { icon: LucideIcon; title: string; text: string }[] = [
    { icon: ShieldCheck, title: ar ? "مواهب موثّقة" : "Verified talent",
      text: ar ? "نراجع كل ملف يدويًا لضمان الجودة والمصداقية قبل ظهوره." : "Every profile is manually reviewed for quality and authenticity." },
    { icon: Wallet, title: ar ? "دفع آمن" : "Secure payments",
      text: ar ? "ادفع بثقة عبر النظام، ولا يتم التحويل إلا بعد الاتفاق." : "Pay with confidence through the platform, released on agreement." },
    { icon: MessagesSquare, title: ar ? "تواصل مباشر" : "Direct chat",
      text: ar ? "ناقش التفاصيل وأرسل البريف وتابع التسليم في مكان واحد." : "Discuss details, send briefs and track delivery in one place." },
    { icon: Star, title: ar ? "تقييمات حقيقية" : "Real reviews",
      text: ar ? "قرارات مبنية على تقييمات موثّقة من عملاء حقيقيين." : "Decide based on verified reviews from real brands." },
  ];

  return (
    <div className={styles.page}>
      <ExploreHero
        lang={lang}
        search={search} onSearch={setSearch}
        resultCount={filtered.length}
        featured={featuredTalents}
      />

      {/* ── Results: filters + grid — right below the hero, on request
          (was preceded by the category-shortcuts section, pushing filters
          past the fold). That section still exists, just moved after. ── */}
      <section className={styles.section} style={{ paddingTop: "clamp(1.25rem, 3vw, 2rem)" }} ref={resultsRef}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderText}>
              <p className={styles.sectionKicker}>{ar ? "كل المواهب" : "All talent"}</p>
              <h2 className={styles.sectionTitle}>{ar ? "الموهبة المتاحة الآن" : "Available talent"}</h2>
            </div>
          </div>

          <div className={styles.layout}>
            <ExploreFilters
              lang={lang}
              sort={sort} onSort={setSort}
              minPrice={minPrice} maxPrice={maxPrice}
              onMinPrice={setMinPrice} onMaxPrice={setMaxPrice}
              verified={verified} onVerified={setVerified}
              sex={sex} onSexChange={setSex}
              types={TALENT_TYPES} activeType={type} onTypeChange={setType}
              open={filtersOpen} onClose={() => setFiltersOpen(false)}
            />

            <div>
              {favoriteError && (
                <p style={{ margin: "0 0 0.75rem", color: "var(--color-error)", fontSize: "var(--text-sm)", fontWeight: 700 }}>
                  {ar ? "تعذر تحديث المفضلة، حاول مرة أخرى" : "Couldn't update favorites, try again"}
                </p>
              )}
              <div className={styles.resultsBar}>
                <span className={styles.resultsCount}>
                  {ar ? <><strong>{filtered.length}</strong> نتيجة</> : <><strong>{filtered.length}</strong> results</>}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    type="button"
                    className={styles.mobileFilterBtn}
                    onClick={() => setFiltersOpen(true)}
                  >
                    <SlidersHorizontal size={15} />
                    {ar ? "تصفية" : "Filters"}
                  </button>
                  <div className={styles.sortWrap}>
                    <label htmlFor="explore-sort">{ar ? "ترتيب" : "Sort"}</label>
                    <select
                      id="explore-sort"
                      className={styles.sortSelect}
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                    >
                      <option value="rating">{ar ? "الأعلى تقييماً" : "Top rated"}</option>
                      <option value="price_asc">{ar ? "الأرخص أولاً" : "Price: low to high"}</option>
                      <option value="price_desc">{ar ? "الأعلى سعراً" : "Price: high to low"}</option>
                      <option value="newest">{ar ? "الأحدث" : "Newest"}</option>
                    </select>
                  </div>
                </div>
              </div>

              <ExploreGrid
                lang={lang} talents={paginated}
                myRole={myRole} myId={myId}
                favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite}
                onSendBrief={(t) => setBriefTarget(t)}
              />

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

      {/* ── Trust / features band ──────────────────────── */}
      <section className={`${styles.section} ${styles.featureBand}`}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderText}>
              <p className={styles.sectionKicker}>{ar ? "لماذا Talents" : "Why Talents"}</p>
              <h2 className={styles.sectionTitle}>{ar ? "احجز بثقة من أول رسالة" : "Book with confidence, start to finish"}</h2>
            </div>
          </div>
          <div className={styles.featureGrid}>
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={styles.featureCard}>
                  <span className={styles.featureIcon}><Icon size={22} /></span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────── */}
      <section className={styles.finalCta}>
        <div className={styles.finalCtaInner}>
          <h2>{ar ? "جاهز لإطلاق حملتك القادمة؟" : "Ready to launch your next campaign?"}</h2>
          <p>
            {ar
              ? "انضم كبراند وابدأ بالتواصل مع المواهب، أو سجّل كموهبة واعرض أعمالك أمام آلاف البراندات."
              : "Join as a brand and start reaching talent, or sign up as talent and put your work in front of thousands of brands."}
          </p>
          <div className={styles.ctaActions}>
            <Link href="/register" className={`${styles.button} ${styles.buttonPrimary}`}>
              {ar ? "ابدأ كبراند" : "Get started as a brand"}
            </Link>
            <Link href="/become-talent" className={`${styles.button} ${styles.buttonGhost}`}>
              {ar ? "انضم كموهبة" : "Join as talent"}
            </Link>
          </div>
        </div>
      </section>

      {briefTarget && (
        <DirectBriefModal
          talentUserId={briefTarget.id}
          talentName={briefTarget.name}
          talentAvatar={briefTarget.avatar_url}
          talentCategory={briefTarget.category}
          dark={dark} lang={lang}
          onClose={() => setBriefTarget(null)}
          onSuccess={() => { setBriefTarget(null); }}
        />
      )}
    </div>
  );
}
