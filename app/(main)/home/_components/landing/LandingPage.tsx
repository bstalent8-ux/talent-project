"use client";

import { type FormEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Camera,
  ChevronDown,
  CircleDollarSign,
  Eye,
  FileText,
  MapPin,
  Play,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { TalentCard as ServerTalentCard } from "../../../explore/page";
import TrustedBrands from "@/components/home/TrustedBrands";
import styles from "./LandingPage.module.css";
import {
  brandMoments,
  brandSteps,
  categories,
  checkIcon,
  demoTalents,
  faqs,
  features,
  floatingChips,
  heroMedia,
  pageCopy,
  quoteIcon,
  stats,
  talentSteps,
  testimonials,
  type LandingLang,
} from "./content";

type Props = {
  lang: LandingLang;
  talents: ServerTalentCard[];
  totalTalents: number;
};

type DesignMedia = {
  type: "image" | "video" | "youtube";
  url: string;
  poster: string;
};

type StoredSystemDesign = {
  theme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    fontSans?: string;
    fontDisplay?: string;
  };
  home?: Partial<DesignMedia>;
};

// Temporary kill switch for the hero search bar. Flip to true to bring it
// back — the markup and handlers stay in place, just gated on this.
const SHOW_HOME_SEARCH = false;

const SYSTEM_DESIGN_KEY = "talents_system_design";
const SYSTEM_DESIGN_DB = "talents-system-design";
const SYSTEM_DESIGN_STORE = "media";
const UPLOADED_HERO_MEDIA = "indexeddb:hero-media";

const defaultDesignMedia: DesignMedia = {
  type: "image",
  url: heroMedia.image,
  poster: heroMedia.poster,
};

function youtubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    let id = "";
    if (parsed.hostname.includes("youtu.be")) id = parsed.pathname.slice(1);
    else if (parsed.pathname.includes("/embed/")) id = parsed.pathname.split("/embed/")[1]?.split("/")[0] ?? "";
    else id = parsed.searchParams.get("v") ?? "";
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1` : url;
  } catch {
    return url;
  }
}

function getStoredDesignMedia(): DesignMedia {
  if (typeof window === "undefined") return defaultDesignMedia;
  try {
    const stored = JSON.parse(localStorage.getItem(SYSTEM_DESIGN_KEY) || "{}") as StoredSystemDesign;
    const home = stored.home || {};
    return {
      type: home.type === "video" || home.type === "youtube" ? home.type : "image",
      url: typeof home.url === "string" && home.url ? home.url : defaultDesignMedia.url,
      poster: typeof home.poster === "string" && home.poster ? home.poster : defaultDesignMedia.poster,
    };
  } catch {
    return defaultDesignMedia;
  }
}

function openMediaDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(SYSTEM_DESIGN_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(SYSTEM_DESIGN_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readUploadedHeroMedia() {
  const db = await openMediaDb();
  return new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(SYSTEM_DESIGN_STORE, "readonly");
    const request = tx.objectStore(SYSTEM_DESIGN_STORE).get("hero-media");
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error);
  });
}

function useDesignMedia() {
  const [media, setMedia] = useState<DesignMedia>(defaultDesignMedia);

  useEffect(() => {
    let objectUrl = "";
    let cancelled = false;

    async function sync() {
      const next = getStoredDesignMedia();
      if (next.url === UPLOADED_HERO_MEDIA) {
        try {
          const blob = await readUploadedHeroMedia();
          if (blob && !cancelled) {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            objectUrl = URL.createObjectURL(blob);
            setMedia({ ...next, url: objectUrl });
          }
        } catch {
          if (!cancelled) setMedia(defaultDesignMedia);
        }
        return;
      }
      if (!cancelled) setMedia(next);
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("talents-system-design-change", sync);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", sync);
      window.removeEventListener("talents-system-design-change", sync);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  return media;
}

type DisplayTalent = {
  name: string;
  profession: string;
  city: string;
  rating: string;
  price: string;
  image: string;
  portfolio: string[];
  href: string;
  verified: boolean;
};

const ArrowIcon = ({ lang }: { lang: LandingLang }) =>
  lang === "ar" ? <ArrowLeft size={18} /> : <ArrowRight size={18} />;

function localize<T>(value: Record<LandingLang, T>, lang: LandingLang): T {
  return value[lang];
}

const CATEGORY_LABELS: Record<string, Record<LandingLang, string>> = {
  ugc: { ar: "UGC Creator", en: "UGC Creator" },
  influencer: { ar: "مؤثر", en: "Influencer" },
  influencers: { ar: "مؤثر", en: "Influencer" },
  model: { ar: "موديل", en: "Model" },
  models: { ar: "موديل", en: "Model" },
  photographer: { ar: "مصور", en: "Photographer" },
  photographers: { ar: "مصور", en: "Photographer" },
  videographer: { ar: "مخرج فيديو", en: "Videographer" },
  videographers: { ar: "مخرج فيديو", en: "Videographer" },
  host: { ar: "مقدم", en: "Host" },
  hosts: { ar: "مقدم", en: "Host" },
  designer: { ar: "مصمم", en: "Designer" },
  designers: { ar: "مصمم", en: "Designer" },
};

function cleanText(value: string | null | undefined) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function formatCategory(value: string | null | undefined, fallback: string, lang: LandingLang) {
  const cleaned = cleanText(value);
  if (!cleaned) return fallback;
  const key = cleaned.toLowerCase().replace(/[\s_-]+/g, "-");
  const readable = cleaned.replace(/[-_]+/g, " ");
  return CATEGORY_LABELS[key]?.[lang] ?? (lang === "en" ? readable.replace(/\b\w/g, (char) => char.toUpperCase()) : readable);
}

function formatPrice(value: number | null | undefined, lang: LandingLang) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const amount = value.toLocaleString("en-US");
    return lang === "ar" ? `من ${amount} ج.م` : `From EGP ${amount}`;
  }

  return lang === "ar" ? "السعر حسب الطلب" : "Price on request";
}

function formatRealTalents(talents: ServerTalentCard[], lang: LandingLang): DisplayTalent[] {
  return talents.slice(0, 4).map((talent, index) => {
    const demo = demoTalents[index % demoTalents.length];
    const fallbackName = localize(demo.name, lang);
    const fallbackProfession = localize(demo.profession, lang);
    const fallbackCity = localize(demo.city, lang);
    return {
      name: cleanText(talent.name) || fallbackName,
      profession: formatCategory(talent.category, fallbackProfession, lang),
      city: cleanText(talent.location) || fallbackCity,
      rating: Number.isFinite(talent.rating) && talent.rating > 0 ? talent.rating.toFixed(1) : (lang === "ar" ? "جديد" : "New"),
      price: formatPrice(talent.starting_price, lang),
      image: talent.avatar_url || demo.image,
      portfolio: demo.portfolio,
      href: talent.handle ? `/talent/${talent.handle}` : "/explore",
      verified: talent.verified,
    };
  });
}

function fallbackTalents(lang: LandingLang): DisplayTalent[] {
  return demoTalents.map((talent) => ({
    name: localize(talent.name, lang),
    profession: localize(talent.profession, lang),
    city: localize(talent.city, lang),
    rating: talent.rating,
    price: localize(talent.price, lang),
    image: talent.image,
    portfolio: talent.portfolio,
    href: "/explore",
    verified: true,
  }));
}

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "quiet";
}) {
  const className =
    variant === "primary"
      ? `${styles.button} ${styles.buttonPrimary}`
      : variant === "secondary"
        ? `${styles.button} ${styles.buttonSecondary}`
        : `${styles.button} ${styles.buttonQuiet}`;

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function SectionHeader({
  id,
  kicker,
  title,
  description,
  action,
}: {
  id?: string;
  kicker?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionHeaderText}>
        {kicker ? <p className={styles.sectionKicker}>{kicker}</p> : null}
        <h2 className={styles.sectionTitle} id={id}>{title}</h2>
        {description ? <p className={styles.sectionDescription}>{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

function HeroSection({ lang, totalTalents, media }: { lang: LandingLang; totalTalents: number; media: DesignMedia }) {
  const heroRef = useRef<HTMLElement | null>(null);
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");
  const t = pageCopy[lang];
  const localizedStats = stats.map((item, index) => ({
    ...item,
    value: index === 0 && totalTalents > 0 ? `+${Math.max(totalTalents, 30)}` : item.value,
  }));

  function handleHeroSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = heroSearch.trim();
    if (!trimmed) return;
    router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    event.currentTarget.style.setProperty("--hero-mx", x.toFixed(3));
    event.currentTarget.style.setProperty("--hero-my", y.toFixed(3));
    event.currentTarget.style.setProperty("--hero-cursor-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--hero-cursor-y", `${event.clientY - bounds.top}px`);
  }

  function handlePointerLeave(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty("--hero-mx", "0");
    event.currentTarget.style.setProperty("--hero-my", "0");
    event.currentTarget.style.setProperty("--hero-cursor-x", "50%");
    event.currentTarget.style.setProperty("--hero-cursor-y", "34%");
  }

  return (
    <section
      ref={heroRef}
      className={styles.hero}
      aria-labelledby="landing-hero-title"
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
    >
      <div className={styles.heroMedia} aria-hidden="true">
        {media.type === "youtube" ? (
          <iframe src={youtubeEmbedUrl(media.url)} title="" allow="autoplay; encrypted-media; picture-in-picture" />
        ) : media.type === "video" ? (
          <video src={media.url} poster={media.poster} autoPlay muted loop playsInline />
        ) : (
          <img src={media.url} alt="" />
        )}
      </div>
      <div className={styles.heroOverlay} aria-hidden="true" />
      <div className={styles.heroCursorGlow} aria-hidden="true" />

      {floatingChips.map((chip, index) => {
        const Icon = chip.icon;
        const positions = [styles.chipOne, styles.chipTwo, styles.chipThree, styles.chipFour];
        return (
          <motion.div
            key={chip.en}
            className={`${styles.floatingChip} ${positions[index]} ${
              index % 2 === 0 ? styles.animatedFloat : styles.animatedFloatAlt
            }`}
            aria-hidden="true"
          >
            <Icon size={15} />
            {chip[lang]}
          </motion.div>
        );
      })}

      <div className={styles.heroShell}>
        <div className={styles.heroContent}>
          <motion.span
            className={styles.badge}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ShieldCheck size={16} />
            {t.heroBadge}
          </motion.span>

          <motion.h1
            id="landing-hero-title"
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            {lang === "ar" ? (
              <>
                احجز المواهب المناسبة <em>لحملتك في دقائق</em>
              </>
            ) : (
              <>
                Book the right talent <em>in minutes</em>
              </>
            )}
          </motion.h1>

          <motion.p
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.16 }}
          >
            {t.subtitle}
          </motion.p>

          <motion.div
            className={styles.heroActions}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
          >
            <ButtonLink href="/explore">
              {t.primaryCta}
              <ArrowIcon lang={lang} />
            </ButtonLink>
            <ButtonLink href="/become-talent" variant="secondary">
              {t.secondaryCta}
            </ButtonLink>
          </motion.div>

          {SHOW_HOME_SEARCH && (
            <form className={styles.heroSearch} action="/explore" role="search" onSubmit={handleHeroSearchSubmit}>
              <label className={styles.searchField}>
                <Search size={18} aria-hidden="true" />
                <input
                  name="q"
                  type="search"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                />
              </label>
              <div className={styles.searchSelect}>
                <span>{t.searchCategory}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
              <div className={styles.searchSelect}>
                <MapPin size={16} aria-hidden="true" />
                <span>{t.searchLocation}</span>
              </div>
              <div className={styles.searchSelect}>
                <span>{t.searchBudget}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </div>
              <button className={styles.searchButton} type="submit">
                {t.searchAction}
              </button>
            </form>
          )}
        </div>

        <div className={styles.statsStrip} aria-label={lang === "ar" ? "إحصائيات المنصة" : "Platform statistics"}>
          {localizedStats.map((item) => (
            <div className={styles.stat} key={item.label.en}>
              <div className={styles.statValue}>{item.value}</div>
              <div className={styles.statLabel}>{localize(item.label, lang)}</div>
            </div>
          ))}
        </div>

        <TrustedBrands
          label={t.trustedBy}
          ariaLabel={lang === "ar" ? "براندات مميزة" : "Featured brands"}
        />
      </div>
    </section>
  );
}

function CategoriesSection({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];
  const ar = lang === "ar";
  const railRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);

  // Auto-loop: the rail's content is rendered twice back-to-back, so
  // "one set" is exactly half of scrollWidth — wrapping scrollLeft across
  // that half-point at the seam is invisible because both halves are
  // identical. Paused on hover/focus (see the .categoryNavBtn reveal) and
  // skipped entirely for prefers-reduced-motion.
  useEffect(() => {
    const el = railRef.current;
    if (!el || hovering) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // RTL scrollLeft direction follows the modern spec (Chrome/Firefox/Safari
    // 15+): it runs 0 → -maxScroll instead of 0 → +maxScroll.
    const dirSign = ar ? -1 : 1;
    let raf = requestAnimationFrame(function tick() {
      const singleSetWidth = el.scrollWidth / 2;
      el.scrollLeft += dirSign * 0.6;
      if (dirSign > 0 && el.scrollLeft >= singleSetWidth) el.scrollLeft -= singleSetWidth;
      else if (dirSign < 0 && el.scrollLeft <= -singleSetWidth) el.scrollLeft += singleSetWidth;
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [ar, hovering]);

  function nudge(px: number) {
    railRef.current?.scrollBy({ left: px, behavior: "smooth" });
  }

  return (
    <section className={`${styles.section} ${styles.sectionMuted}`} aria-labelledby="landing-categories">
      <div className={styles.container}>
        <SectionHeader
          id="landing-categories"
          kicker={t.categories}
          title={lang === "ar" ? "كل فئة لها طريقة عرض تناسب طبيعتها" : "Every category gets the right kind of evidence"}
          description={
            lang === "ar"
              ? "صور، فيديو، تقييمات وباقات تظهر الفارق بين موهبة وأخرى بدون إرباك."
              : "Photos, video, ratings and packages make talent comparison clearer without visual clutter."
          }
        />

        <div
          className={styles.categoryRailWrap}
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocus={() => setHovering(true)}
          onBlur={() => setHovering(false)}
        >
          <div className={styles.categoryGrid} ref={railRef}>
            {[...categories, ...categories].map((category, i) => {
              const Icon = category.icon;
              return (
                <Link className={styles.categoryCard} href="/explore" key={`${category.title.en}-${i}`} tabIndex={i < categories.length ? 0 : -1}>
                  <img src={category.image} alt="" loading="lazy" />
                  <div className={styles.categoryContent}>
                    <span className={styles.iconBubble}>
                      <Icon size={20} />
                    </span>
                    <h3 className={styles.categoryTitle}>{localize(category.title, lang)}</h3>
                    <p className={styles.categoryMeta}>{localize(category.description, lang)}</p>
                    <p className={styles.categoryMeta}>{category.count} {lang === "ar" ? "موهبة" : "talents"}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            aria-label={ar ? "التالي يمين" : "Scroll right"}
            className={`${styles.categoryNavBtn} ${styles.categoryNavBtnRight}`}
            onClick={() => nudge(300)}
          >
            <ArrowRight size={18} />
          </button>
          <button
            type="button"
            aria-label={ar ? "التالي يسار" : "Scroll left"}
            className={`${styles.categoryNavBtn} ${styles.categoryNavBtnLeft}`}
            onClick={() => nudge(-300)}
          >
            <ArrowLeft size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

function TalentCard({ talent, lang }: { talent: DisplayTalent; lang: LandingLang }) {
  const availability = lang === "ar" ? "\u0645\u062a\u0627\u062d \u0627\u0644\u0622\u0646" : "Available now";
  const profileLabel = lang === "ar" ? "\u0639\u0631\u0636 \u0627\u0644\u0645\u0644\u0641" : "View profile";
  const priceLabel = lang === "ar" ? "\u064a\u0628\u062f\u0623 \u0645\u0646" : "Starts at";
  const hasRequestPrice = talent.price === "Price on request" || talent.price === "السعر حسب الطلب";
  const displayPrice = hasRequestPrice
    ? talent.price
    : talent.price.replace(/^From\s+/i, "").replace(/^\u0645\u0646\s+/u, "");

  return (
    <article className={styles.talentCard}>
      <div className={styles.talentMedia}>
        <img src={talent.image} alt={talent.name} loading="lazy" />
        {talent.verified ? (
          <span className={styles.verifiedBadge}>
            <ShieldCheck size={13} />
            {pageCopy[lang].verified}
          </span>
        ) : null}
        <span className={styles.saveBadge} aria-hidden="true">
          <Bookmark size={16} />
        </span>
        <span className={styles.playBadge} aria-hidden="true">
          <Play size={16} fill="currentColor" />
        </span>
      </div>
      <div className={styles.talentBody}>
        <h3 className={styles.talentName}>
          <span>{talent.name}</span>
          <span className={styles.stars}>
            <Star size={15} fill="currentColor" />
            {talent.rating}
          </span>
        </h3>
        <div className={styles.talentMetaRow}>
          <span className={styles.talentCategory}>{talent.profession}</span>
          <span className={styles.talentLocation}>
            <MapPin size={14} aria-hidden="true" />
            {talent.city}
          </span>
        </div>
        <div className={styles.talentPills}>
          <span>{availability}</span>
        </div>
        <div className={styles.portfolioStrip}>
          {talent.portfolio.map((image) => (
            <img src={image} alt="" loading="lazy" key={image} />
          ))}
        </div>
        <div className={styles.talentFooter}>
          <span className={styles.talentPrice}>
            <small>{hasRequestPrice ? (lang === "ar" ? "السعر" : "Price") : priceLabel}</small>
            {displayPrice}
          </span>
          <Link className={styles.talentCta} href={talent.href}>
            {profileLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

function FeaturedTalentsSection({ lang, talents }: { lang: LandingLang; talents: DisplayTalent[] }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionWhite}`} aria-labelledby="featured-talents">
      <div className={styles.container}>
        <SectionHeader
          id="featured-talents"
          kicker={t.featuredTalents}
          title={lang === "ar" ? "كروت مواهب مصممة للحجز وليس للعرض فقط" : "Talent cards built for booking, not just browsing"}
          description={
            lang === "ar"
              ? "كل كارت يوضح الصورة، التخصص، التقييم، السعر، ولمحة من البورتفوليو."
              : "Each card surfaces portrait, specialty, rating, price and portfolio evidence."
          }
          action={
            <ButtonLink href="/explore" variant="quiet">
              {lang === "ar" ? "عرض كل المواهب" : "View all talents"}
              <ArrowIcon lang={lang} />
            </ButtonLink>
          }
        />
        <div className={styles.talentGrid}>
          {talents.map((talent) => (
            <TalentCard key={`${talent.name}-${talent.profession}`} talent={talent} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionMuted} ${styles.workflowSection}`} aria-labelledby="landing-workflow">
      <div className={`${styles.workflowPath} ${styles.workflowPathLeft}`} aria-hidden="true">
        <span><FileText size={18} /></span>
        <span className={styles.cameraCluster}>
          <Camera size={15} />
          <Camera size={15} />
          <Camera size={15} />
        </span>
        <span><Eye size={18} /></span>
      </div>
      <div className={`${styles.workflowPath} ${styles.workflowPathRight}`} aria-hidden="true">
        <span><FileText size={18} /></span>
        <span><Camera size={18} /></span>
        <span><CircleDollarSign size={18} /></span>
      </div>
      <div className={styles.container}>
        <SectionHeader
          id="landing-workflow"
          kicker={t.howItWorks}
          title={lang === "ar" ? "مسارين واضحين: براند يحجز، وموهبة تبني سمعتها" : "Two clear paths: brands book, talents grow"}
          description={
            lang === "ar"
              ? "المنصة تقلل الاحتكاك من أول بحث حتى بداية التعاون."
              : "The platform reduces friction from first search to collaboration kickoff."
          }
        />
        <div className={styles.twoColumn}>
          <WorkflowPanel title={t.forBrands} steps={brandSteps} lang={lang} />
          <WorkflowPanel title={t.forTalents} steps={talentSteps} lang={lang} />
        </div>
      </div>
    </section>
  );
}

function WorkflowPanel({ title, steps, lang }: { title: string; steps: typeof brandSteps; lang: LandingLang }) {
  return (
    <div className={styles.workflowPanel}>
      <h3 className={styles.workflowHeader}>
        <span className={styles.iconBubble}>
          <CheckIcon />
        </span>
        {title}
      </h3>
      <ol className={styles.stepList}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li className={styles.stepItem} key={step.title.en}>
              <span className={styles.stepMarker} aria-hidden="true">
                <span className={styles.stepNumber}>{index + 1}</span>
              </span>
              <div className={styles.stepBody}>
                <h4>
                  <Icon size={15} aria-hidden="true" />
                  {localize(step.title, lang)}
                </h4>
                <p>{localize(step.description, lang)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const CheckIcon = checkIcon;
const QuoteIcon = quoteIcon;

function CampaignSection({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionWhite}`} aria-labelledby="landing-campaigns">
      <div className={styles.container}>
        <SectionHeader
          id="landing-campaigns"
          kicker={t.featuredBrands}
          title={lang === "ar" ? "الصفحة تعرض نتائج ملموسة وليس وعود عامة" : "Show real campaign moments, not generic promises"}
          description={
            lang === "ar"
              ? "استخدم صور حملات، shoots، وفيديوهات قصيرة عشان الزائر يحس إن المنصة نشطة وموثوقة."
              : "Campaign imagery, shoot moments and short video previews create immediate trust."
          }
        />

        <div className={styles.campaignGrid}>
          <div className={styles.campaignCards}>
            {brandMoments.map((moment) => (
              <article className={styles.campaignCard} key={moment.title.en}>
                <img src={moment.image} alt={localize(moment.title, lang)} loading="lazy" />
                <div>
                  <h3>{localize(moment.title, lang)}</h3>
                  <p>{localize(moment.location, lang)}</p>
                </div>
              </article>
            ))}
          </div>

          <aside className={styles.darkCtaPanel}>
            <span className={styles.badge}>{pageCopy[lang].premium}</span>
            <h3 className={styles.sectionTitle}>
              {lang === "ar" ? "انشر فرصة عمل واجذب المواهب المناسبة" : "Post a job and attract matching talent"}
            </h3>
            <p className={styles.heroSubtitle}>
              {lang === "ar"
                ? "الـ landing يوجه البراندات من الإلهام إلى أول خطوة عملية: نشر brief واضح."
                : "The landing page moves brands from inspiration to the first concrete action: a clear brief."}
            </p>
            <ButtonLink href="/jobs/create">
              {lang === "ar" ? "انشر فرصة عمل" : "Post a job"}
              <ArrowIcon lang={lang} />
            </ButtonLink>
          </aside>
        </div>
      </div>
    </section>
  );
}

function FeatureSection({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionMuted}`} aria-labelledby="landing-features">
      <div className={styles.container}>
        <SectionHeader
          id="landing-features"
          kicker={t.features}
          title={lang === "ar" ? "نظام Marketplace جاهز للنمو" : "A marketplace system ready to scale"}
          description={
            lang === "ar"
              ? "مكونات واضحة تخدم discovery، الثقة، التواصل، والحجز."
              : "Clear product pillars support discovery, trust, communication and booking."
          }
        />
        <div className={styles.featureGrid}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article className={styles.featureCard} key={feature.title.en}>
                <span className={styles.iconBubble}>
                  <Icon size={20} />
                </span>
                <h3>{localize(feature.title, lang)}</h3>
                <p>{localize(feature.description, lang)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionWhite}`} aria-labelledby="landing-testimonials">
      <div className={styles.container}>
        <SectionHeader
          id="landing-testimonials"
          kicker={t.testimonials}
          title={lang === "ar" ? "ثقة مبنية على تجربة واضحة" : "Trust built from clear client experience"}
        />
        <div className={styles.testimonialGrid}>
          {testimonials.map((testimonial) => (
            <article className={styles.testimonialCard} key={testimonial.name.en}>
              <QuoteIcon size={24} color="var(--color-secondary)" />
              <p>{localize(testimonial.quote, lang)}</p>
              <div className={styles.testimonialAuthor}>
                <img src={testimonial.image} alt={localize(testimonial.name, lang)} loading="lazy" />
                <div>
                  <h3>{localize(testimonial.name, lang)}</h3>
                  <p>{localize(testimonial.role, lang)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionMuted}`} aria-labelledby="landing-faq">
      <div className={styles.container}>
        <SectionHeader
          id="landing-faq"
          kicker={t.faq}
          title={lang === "ar" ? "إجابات قصيرة قبل التسجيل" : "Short answers before signup"}
        />
        <div className={styles.faqGrid}>
          {faqs.map((faq, index) => (
            <details className={styles.faqItem} key={faq.question.en} open={index === 0}>
              <summary className={styles.faqSummary}>{localize(faq.question, lang)}</summary>
              <p>{localize(faq.answer, lang)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={styles.finalCta} aria-labelledby="landing-final-cta">
      <div className={styles.container}>
        <div className={styles.finalCtaContent}>
          <h2 id="landing-final-cta">{t.finalCtaTitle}</h2>
          <p>{t.finalCtaText}</p>
          <div className={styles.heroActions}>
            <ButtonLink href="/explore">
              {t.finalCtaPrimary}
              <ArrowIcon lang={lang} />
            </ButtonLink>
            <ButtonLink href="/become-talent" variant="secondary">
              {t.finalCtaSecondary}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage({
  lang,
  talents,
  totalTalents,
}: Props) {
  const displayedTalents = formatRealTalents(talents, lang);
  const filledTalents = displayedTalents.length >= 4 ? displayedTalents : fallbackTalents(lang);
  const designMedia = useDesignMedia();

  return (
    <div className={styles.page} dir={lang === "ar" ? "rtl" : "ltr"}>
      <HeroSection lang={lang} totalTalents={totalTalents} media={designMedia} />
      <CategoriesSection lang={lang} />
      <FeaturedTalentsSection lang={lang} talents={filledTalents} />
      <WorkflowSection lang={lang} />
      <CampaignSection lang={lang} />
      <FeatureSection lang={lang} />
      <TestimonialsSection lang={lang} />
      <FAQSection lang={lang} />
      <FinalCTA lang={lang} />
    </div>
  );
}

