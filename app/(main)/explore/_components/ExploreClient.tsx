"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  SlidersHorizontal, Camera, UsersRound, Mic2, Sparkles, Clapperboard, LayoutGrid,
  ShieldCheck, Wallet, MessagesSquare, Star, type LucideIcon,
} from "lucide-react";

import type { TalentCard } from "../page";
import ExploreHero from "./ExploreHero";
import ExploreFilters from "./ExploreFilters";
import ExploreGrid from "./ExploreGrid";
import { useSite } from "@/contexts/SiteContext";
import { createClient } from "@/lib/supabase/client";
import DirectBriefModal from "@/components/DirectBriefModal";
import styles from "./ExplorePage.module.css";

const PAGE_SIZE = 12;

export type SortOption = "price_asc" | "price_desc" | "rating" | "newest";

const TALENT_TYPES = [
  { key: "all",        label_ar: "الكل",           label_en: "All",              icon: LayoutGrid },
  { key: "ugc",        label_ar: "مبدع محتوى UGC", label_en: "UGC Creator",      icon: Camera },
  { key: "influencer", label_ar: "مؤثر",           label_en: "Influencer",       icon: UsersRound },
  { key: "host",       label_ar: "مذيع / مقدم",    label_en: "Host / Presenter", icon: Mic2 },
  { key: "model",      label_ar: "موديل",           label_en: "Model",            icon: Sparkles },
  { key: "actor",      label_ar: "ممثل",            label_en: "Actor",            icon: Clapperboard },
];

function matchesType(talent: TalentCard, type: string): boolean {
  if (type === "all") return true;
  const specialties = (talent.specialties ?? []).join(" ").toLowerCase();
  const category = (talent.category ?? "").toLowerCase();
  const map: Record<string, { specs: string[]; cats: string[] }> = {
    ugc:        { specs: ["ugc", "content creator", "محتوى", "مبدع", "كونتنت"], cats: ["ugc"] },
    influencer: { specs: ["مؤثر", "مؤثرة", "influencer", "تأثير"],              cats: [] },
    host:       { specs: ["مذيع", "مقدم", "مقدمة", "host", "presenter"],        cats: [] },
    model:      { specs: ["موديل", "model", "أزياء", "فاشن"],                   cats: [] },
    actor:      { specs: ["ممثل", "ممثلة", "actor", "acting", "تمثيل"],         cats: [] },
  };
  const rule = map[type];
  if (!rule) return false;
  if (rule.specs.some((kw) => specialties.includes(kw))) return true;
  if (rule.cats.length && rule.cats.includes(category)) return true;
  return false;
}

interface Props { talents: TalentCard[] }

export default function ExploreClient({ talents }: Props) {
  const { lang, dark } = useSite();
  const ar = lang === "ar";

  const [search,   setSearch]   = useState("");
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
  const [briefTarget, setBriefTarget] = useState<TalentCard | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await createClient().auth.getUser();
      if (!data.user) return;
      setMyId(data.user.id);
      const res = await fetch("/api/me/role");
      if (res.ok) { const d = await res.json(); setMyRole(d.role); }
    })();
  }, []);

  useEffect(() => { setPage(1); }, [search, type, sort, minPrice, maxPrice, verified, sex]);

  const filtered = useMemo(() => {
    let list = talents.filter((t) => {
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
      if (sort === "price_asc")  return (a.starting_price ?? 99999) - (b.starting_price ?? 99999);
      if (sort === "price_desc") return (b.starting_price ?? 0)     - (a.starting_price ?? 0);
      if (sort === "rating")     return b.rating - a.rating;
      return 0;
    });

    return list;
  }, [talents, search, type, sort, minPrice, maxPrice, verified, sex]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Derived stats for the hero strip ──────────────────
  const heroStats = useMemo(() => {
    const verifiedCount = talents.filter((t) => t.verified).length;
    const categoryCount = new Set(talents.map((t) => t.category).filter(Boolean)).size;
    const rated = talents.filter((t) => t.rating > 0);
    const avg = rated.length ? (rated.reduce((s, t) => s + t.rating, 0) / rated.length) : 0;
    return [
      { value: `${talents.length.toLocaleString()}`, label: ar ? "موهبة متاحة" : "Talents listed" },
      { value: `${verifiedCount.toLocaleString()}`,   label: ar ? "موهبة موثّقة" : "Verified" },
      { value: `${categoryCount || TALENT_TYPES.length - 1}+`, label: ar ? "فئة إبداعية" : "Categories" },
      { value: avg ? avg.toFixed(1) : "4.9", label: ar ? "متوسط التقييم" : "Avg. rating" },
    ];
  }, [talents, ar]);

  // ── Category shortcut counts ──────────────────────────
  const categoryCards = useMemo(
    () => TALENT_TYPES.filter((c) => c.key !== "all").map((c) => ({
      ...c,
      count: talents.filter((t) => matchesType(t, c.key)).length,
    })),
    [talents],
  );

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectCategory = (key: string) => {
    setType(key);
    setTimeout(scrollToResults, 60);
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
        types={TALENT_TYPES}
        activeType={type} onTypeChange={setType}
        resultCount={filtered.length}
        stats={heroStats}
      />

      {/* ── Category shortcuts ─────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderText}>
              <p className={styles.sectionKicker}>{ar ? "تصفّح بسرعة" : "Browse fast"}</p>
              <h2 className={styles.sectionTitle}>{ar ? "اختر فئة الموهبة" : "Pick a talent category"}</h2>
              <p className={styles.sectionDescription}>
                {ar
                  ? "اختصارات سريعة لأكثر الفئات طلبًا — اضغط لعرض المواهب المطابقة فورًا."
                  : "Quick shortcuts to the most requested categories — tap one to jump straight to matching talent."}
              </p>
            </div>
          </div>

          <div className={styles.categoryScroll}>
            {categoryCards.map((c) => {
              const Icon = c.icon;
              const active = type === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`${styles.categoryCard} ${active ? styles.categoryCardActive : ""}`}
                  onClick={() => selectCategory(c.key)}
                >
                  <span className={styles.categoryIcon}><Icon size={20} /></span>
                  <p className={styles.categoryName}>{ar ? c.label_ar : c.label_en}</p>
                  <p className={styles.categoryCount}>
                    {c.count} {ar ? "موهبة" : "talents"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Results: filters + grid ────────────────────── */}
      <section className={styles.section} style={{ paddingTop: 0 }} ref={resultsRef}>
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
