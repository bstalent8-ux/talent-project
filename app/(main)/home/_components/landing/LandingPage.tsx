"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ChevronDown,
  MapPin,
  Play,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import type { TalentCard as ServerTalentCard } from "../../../explore/page";
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
  pricingPackages,
  quoteIcon,
  stats,
  talentSteps,
  testimonials,
  trustedBrands,
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

function formatRealTalents(talents: ServerTalentCard[], lang: LandingLang): DisplayTalent[] {
  return talents.slice(0, 4).map((talent, index) => {
    const demo = demoTalents[index % demoTalents.length];
    return {
      name: talent.name || localize(demo.name, lang),
      profession: talent.category || localize(demo.profession, lang),
      city: talent.location || localize(demo.city, lang),
      rating: (talent.rating || Number(demo.rating)).toFixed(1),
      price: talent.starting_price
        ? `${lang === "ar" ? "Ù…Ù†" : "From"} ${talent.starting_price.toLocaleString()} EGP`
        : localize(demo.price, lang),
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
  const t = pageCopy[lang];
  const localizedStats = stats.map((item, index) => ({
    ...item,
    value: index === 0 && totalTalents > 0 ? `+${Math.max(totalTalents, 30)}` : item.value,
  }));

  return (
    <section className={styles.hero} aria-labelledby="landing-hero-title">
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
                Ø§Ø­Ø¬Ø² Ø§Ù„Ù…ÙˆØ§Ù‡Ø¨ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø© <em>Ù„Ø­Ù…Ù„ØªÙƒ ÙÙŠ Ø¯Ù‚Ø§Ø¦Ù‚</em>
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

          <form className={styles.heroSearch} action="/explore" role="search">
            <label className={styles.searchField}>
              <Search size={18} aria-hidden="true" />
              <input name="q" type="search" placeholder={t.searchPlaceholder} aria-label={t.searchPlaceholder} />
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
        </div>

        <div className={styles.statsStrip} aria-label={lang === "ar" ? "Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª Ø§Ù„Ù…Ù†ØµØ©" : "Platform statistics"}>
          {localizedStats.map((item) => (
            <div className={styles.stat} key={item.label.en}>
              <div className={styles.statValue}>{item.value}</div>
              <div className={styles.statLabel}>{localize(item.label, lang)}</div>
            </div>
          ))}
        </div>

        <div className={styles.trusted}>
          <span>{t.trustedBy}</span>
          <div className={styles.brandList} aria-label={lang === "ar" ? "Ø¨Ø±Ø§Ù†Ø¯Ø§Øª Ù…Ù…ÙŠØ²Ø©" : "Featured brands"}>
            {trustedBrands.map((brand) => (
              <span className={styles.brandPill} key={brand}>
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoriesSection({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="landing-categories">
      <div className={styles.container}>
        <SectionHeader
          id="landing-categories"
          kicker={t.categories}
          title={lang === "ar" ? "ÙƒÙ„ ÙØ¦Ø© Ù„Ù‡Ø§ Ø·Ø±ÙŠÙ‚Ø© Ø¹Ø±Ø¶ ØªÙ†Ø§Ø³Ø¨ Ø·Ø¨ÙŠØ¹ØªÙ‡Ø§" : "Every category gets the right kind of evidence"}
          description={
            lang === "ar"
              ? "ØµÙˆØ±ØŒ ÙÙŠØ¯ÙŠÙˆØŒ ØªÙ‚ÙŠÙŠÙ…Ø§Øª ÙˆØ¨Ø§Ù‚Ø§Øª ØªØ¸Ù‡Ø± Ø§Ù„ÙØ§Ø±Ù‚ Ø¨ÙŠÙ† Ù…ÙˆÙ‡Ø¨Ø© ÙˆØ£Ø®Ø±Ù‰ Ø¨Ø¯ÙˆÙ† Ø¥Ø±Ø¨Ø§Ùƒ."
              : "Photos, video, ratings and packages make talent comparison clearer without visual clutter."
          }
        />

        <div className={styles.categoryGrid}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link className={styles.categoryCard} href="/explore" key={category.title.en}>
                <img src={category.image} alt="" loading="lazy" />
                <div className={styles.categoryContent}>
                  <span className={styles.iconBubble}>
                    <Icon size={20} />
                  </span>
                  <h3 className={styles.categoryTitle}>{localize(category.title, lang)}</h3>
                  <p className={styles.categoryMeta}>{localize(category.description, lang)}</p>
                  <p className={styles.categoryMeta}>{category.count} {lang === "ar" ? "Ù…ÙˆÙ‡Ø¨Ø©" : "talents"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TalentCard({ talent, lang }: { talent: DisplayTalent; lang: LandingLang }) {
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
        <p className={styles.talentMeta}>{talent.profession} Â· {talent.city}</p>
        <div className={styles.portfolioStrip}>
          {talent.portfolio.map((image) => (
            <img src={image} alt="" loading="lazy" key={image} />
          ))}
        </div>
        <div className={styles.talentFooter}>
          <span>{talent.price}</span>
          <Link href={talent.href}>
            {lang === "ar" ? "Ø¹Ø±Ø¶ Ø§Ù„Ù…Ù„Ù" : "View profile"}
          </Link>
        </div>
      </div>
    </article>
  );
}

function FeaturedTalentsSection({ lang, talents }: { lang: LandingLang; talents: DisplayTalent[] }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="featured-talents">
      <div className={styles.container}>
        <SectionHeader
          id="featured-talents"
          kicker={t.featuredTalents}
          title={lang === "ar" ? "ÙƒØ±ÙˆØª Ù…ÙˆØ§Ù‡Ø¨ Ù…ØµÙ…Ù…Ø© Ù„Ù„Ø­Ø¬Ø² ÙˆÙ„ÙŠØ³ Ù„Ù„Ø¹Ø±Ø¶ ÙÙ‚Ø·" : "Talent cards built for booking, not just browsing"}
          description={
            lang === "ar"
              ? "ÙƒÙ„ ÙƒØ§Ø±Øª ÙŠÙˆØ¶Ø­ Ø§Ù„ØµÙˆØ±Ø©ØŒ Ø§Ù„ØªØ®ØµØµØŒ Ø§Ù„ØªÙ‚ÙŠÙŠÙ…ØŒ Ø§Ù„Ø³Ø¹Ø±ØŒ ÙˆÙ„Ù…Ø­Ø© Ù…Ù† Ø§Ù„Ø¨ÙˆØ±ØªÙÙˆÙ„ÙŠÙˆ."
              : "Each card surfaces portrait, specialty, rating, price and portfolio evidence."
          }
          action={
            <ButtonLink href="/explore" variant="quiet">
              {lang === "ar" ? "Ø¹Ø±Ø¶ ÙƒÙ„ Ø§Ù„Ù…ÙˆØ§Ù‡Ø¨" : "View all talents"}
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
    <section className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="landing-workflow">
      <div className={styles.container}>
        <SectionHeader
          id="landing-workflow"
          kicker={t.howItWorks}
          title={lang === "ar" ? "Ù…Ø³Ø§Ø±ÙŠÙ† ÙˆØ§Ø¶Ø­ÙŠÙ†: Ø¨Ø±Ø§Ù†Ø¯ ÙŠØ­Ø¬Ø²ØŒ ÙˆÙ…ÙˆÙ‡Ø¨Ø© ØªØ¨Ù†ÙŠ Ø³Ù…Ø¹ØªÙ‡Ø§" : "Two clear paths: brands book, talents grow"}
          description={
            lang === "ar"
              ? "Ø§Ù„Ù…Ù†ØµØ© ØªÙ‚Ù„Ù„ Ø§Ù„Ø§Ø­ØªÙƒØ§Ùƒ Ù…Ù† Ø£ÙˆÙ„ Ø¨Ø­Ø« Ø­ØªÙ‰ Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„ØªØ¹Ø§ÙˆÙ†."
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
      <div className={styles.stepList}>
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div className={styles.stepItem} key={step.title.en}>
              <span className={styles.iconBubble}>
                <Icon size={19} />
              </span>
              <div>
                <h4>{localize(step.title, lang)}</h4>
                <p>{localize(step.description, lang)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const CheckIcon = checkIcon;
const QuoteIcon = quoteIcon;

function CampaignSection({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="landing-campaigns">
      <div className={styles.container}>
        <SectionHeader
          id="landing-campaigns"
          kicker={t.featuredBrands}
          title={lang === "ar" ? "Ø§Ù„ØµÙØ­Ø© ØªØ¹Ø±Ø¶ Ù†ØªØ§Ø¦Ø¬ Ù…Ù„Ù…ÙˆØ³Ø© ÙˆÙ„ÙŠØ³ ÙˆØ¹ÙˆØ¯ Ø¹Ø§Ù…Ø©" : "Show real campaign moments, not generic promises"}
          description={
            lang === "ar"
              ? "Ø§Ø³ØªØ®Ø¯Ù… ØµÙˆØ± Ø­Ù…Ù„Ø§ØªØŒ shootsØŒ ÙˆÙÙŠØ¯ÙŠÙˆÙ‡Ø§Øª Ù‚ØµÙŠØ±Ø© Ø¹Ø´Ø§Ù† Ø§Ù„Ø²Ø§Ø¦Ø± ÙŠØ­Ø³ Ø¥Ù† Ø§Ù„Ù…Ù†ØµØ© Ù†Ø´Ø·Ø© ÙˆÙ…ÙˆØ«ÙˆÙ‚Ø©."
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
              {lang === "ar" ? "Ø§Ù†Ø´Ø± ÙØ±ØµØ© Ø¹Ù…Ù„ ÙˆØ§Ø¬Ø°Ø¨ Ø§Ù„Ù…ÙˆØ§Ù‡Ø¨ Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø©" : "Post a job and attract matching talent"}
            </h3>
            <p className={styles.heroSubtitle}>
              {lang === "ar"
                ? "Ø§Ù„Ù€ landing ÙŠÙˆØ¬Ù‡ Ø§Ù„Ø¨Ø±Ø§Ù†Ø¯Ø§Øª Ù…Ù† Ø§Ù„Ø¥Ù„Ù‡Ø§Ù… Ø¥Ù„Ù‰ Ø£ÙˆÙ„ Ø®Ø·ÙˆØ© Ø¹Ù…Ù„ÙŠØ©: Ù†Ø´Ø± brief ÙˆØ§Ø¶Ø­."
                : "The landing page moves brands from inspiration to the first concrete action: a clear brief."}
            </p>
            <ButtonLink href="/jobs/create">
              {lang === "ar" ? "Ø§Ù†Ø´Ø± ÙØ±ØµØ© Ø¹Ù…Ù„" : "Post a job"}
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
    <section className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="landing-features">
      <div className={styles.container}>
        <SectionHeader
          id="landing-features"
          kicker={t.features}
          title={lang === "ar" ? "Ù†Ø¸Ø§Ù… Marketplace Ø¬Ø§Ù‡Ø² Ù„Ù„Ù†Ù…Ùˆ" : "A marketplace system ready to scale"}
          description={
            lang === "ar"
              ? "Ù…ÙƒÙˆÙ†Ø§Øª ÙˆØ§Ø¶Ø­Ø© ØªØ®Ø¯Ù… discoveryØŒ Ø§Ù„Ø«Ù‚Ø©ØŒ Ø§Ù„ØªÙˆØ§ØµÙ„ØŒ ÙˆØ§Ù„Ø­Ø¬Ø²."
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
    <section className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="landing-testimonials">
      <div className={styles.container}>
        <SectionHeader
          id="landing-testimonials"
          kicker={t.testimonials}
          title={lang === "ar" ? "Ø«Ù‚Ø© Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ ØªØ¬Ø±Ø¨Ø© ÙˆØ§Ø¶Ø­Ø©" : "Trust built from clear client experience"}
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

function PricingPreview({ lang }: { lang: LandingLang }) {
  const t = pageCopy[lang];

  return (
    <section className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="landing-pricing">
      <div className={styles.container}>
        <SectionHeader
          id="landing-pricing"
          kicker={t.pricing}
          title={lang === "ar" ? "Preview Ù„Ù„Ø¨Ø§Ù‚Ø§Øª Ø¨Ø¯ÙˆÙ† ØªØºÙŠÙŠØ± Ù†Ø¸Ø§Ù… Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø­Ø§Ù„ÙŠ" : "A pricing preview without changing payment flows"}
          description={
            lang === "ar"
              ? "Ø§Ù„Ù‡Ø¯Ù Ù‡Ù†Ø§ ØªØ­Ø³ÙŠÙ† Ø§Ù„ØªØ­ÙˆÙŠÙ„ ÙˆØ´Ø±Ø­ Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ù†ØµØ©ØŒ ÙˆÙ„ÙŠØ³ Ø¨Ù†Ø§Ø¡ billing ÙƒØ§Ù…Ù„."
              : "This improves conversion and explains value without implementing full billing."
          }
        />
        <div className={styles.pricingGrid}>
          {pricingPackages.map((item) => (
            <article className={styles.pricingCard} key={item.name.en}>
              <h3>{localize(item.name, lang)}</h3>
              <p className={styles.price}>{localize(item.price, lang)}</p>
              <p>{localize(item.description, lang)}</p>
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
    <section className={`${styles.section} ${styles.sectionLight}`} aria-labelledby="landing-faq">
      <div className={styles.container}>
        <SectionHeader
          id="landing-faq"
          kicker={t.faq}
          title={lang === "ar" ? "Ø¥Ø¬Ø§Ø¨Ø§Øª Ù‚ØµÙŠØ±Ø© Ù‚Ø¨Ù„ Ø§Ù„ØªØ³Ø¬ÙŠÙ„" : "Short answers before signup"}
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
            <ButtonLink href="/explore" variant="secondary">
              {t.finalCtaSecondary}
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage({ lang, talents, totalTalents }: Props) {
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
      <PricingPreview lang={lang} />
      <FAQSection lang={lang} />
      <FinalCTA lang={lang} />
    </div>
  );
}

