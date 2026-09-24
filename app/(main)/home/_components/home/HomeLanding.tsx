"use client";

// ─── Home page (2026-09 redesign) ────────────────────────────────────────────
// Six sections, top to bottom: hero collage · what Talents does for you ·
// discover talents · Talents in numbers · community · talent packages.
//
// Everything that looks like data is real: the counts come from the database,
// the community cards are real posts, and the package cards are real talents'
// packages. Where a section has nothing to show yet (e.g. no community posts)
// it falls back to an invitation card — no invented numbers, names or prices.
//
// Styling is a CSS module on the site's tokens (light/dark and RTL come for
// free); copy is inline and bilingual, like every other component (CLAUDE.md §11).

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  Camera,
  Eye,
  Handshake,
  Heart,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  PackageOpen,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  Video,
  Sparkles,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { useGuestGuard } from "@/contexts/GuestGuard";
import { cdnImage } from "@/lib/images";
import type { HomeCommunityHighlights, HomeFeaturedPackage } from "@/features/landing/services/landing-content.service";
import styles from "./home.module.css";

type Lang = "ar" | "en";

export interface HomeLandingProps {
  lang: Lang;
  totalTalents: number;
  brandCount: number;
  completedProjects: number;
  avgRating: number;
  categoryCounts: Record<"ugc" | "model", number>;
  community: HomeCommunityHighlights;
  packages: HomeFeaturedPackage[];
}

// Curated stock photography (Unsplash — already allowed by the CSP and
// next.config images). Decorative only: nothing on the page claims these are
// platform members. Real talent avatars were tried for the collage but their
// quality is too uneven for the first screen of the site.
const unsplash = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=72`;
const STOCK = {
  hero: [
    { src: unsplash("1494790108377-be9c29b29330", 640, 800), alt: "" },
    { src: unsplash("1542038784456-1ea8e935640e", 520, 520), alt: "" },
    { src: unsplash("1544005313-94ddf0286df2", 560, 700), alt: "" },
    { src: unsplash("1476703993599-0035a21b17a9", 520, 480), alt: "" },
  ],
  brandCard: unsplash("1492562080023-ab3db95bfbce", 720, 900),
  ugc: unsplash("1517841905240-472988babdf9", 560, 480),
  models: unsplash("1531746020798-e6953c6e8e04", 560, 480),
  influencers: unsplash("1502685104226-ee32379fefbe", 560, 480),
  family: unsplash("1476703993599-0035a21b17a9", 560, 480),
  photographers: unsplash("1495745966610-2a67f2297e5e", 560, 480),
};

const TX = {
  ar: {
    heroEyebrow: "أشخاص × إبداع × فرص",
    heroTitleA: "المكان اللي البراندات بتلاقي فيه المواهب،",
    heroTitleB: "والمواهب بتلاقي فيه الفرص",
    heroSub: "Talents بتربط البراندات والمنظّمين بالموديلز وصنّاع محتوى الـ UGC وباقي المواهب الإبداعية، في مكان واحد.",
    findTalents: "ابحث عن المواهب",
    joinTalent: "انضم كموهبة",
    myProfile: "ملفي الشخصي",
    trust: ["ملفات موثّقة", "فرص حقيقية", "تعاون سهل", "مجتمع نشط"],
    tagline: ["اصنع", "تعاون", "انمو"],
    cardBrandTitle: "للبراندات والمنظّمين",
    cardBrandText: "لاقي الموهبة المناسبة لحملاتك وفعالياتك ومشاريعك.",
    cardTalentTitle: "للمواهب",
    cardTalentText: "اعرض شغلك، اتكشف، وقابل فرص جديدة.",

    doesEyebrow: "لكل العاملين في الصناعة الإبداعية",
    doesTitle: "إيه اللي Talents بتعمله ليك",
    talentTitleA: "لو أنت ",
    talentTitleB: "موهبة",
    talentText: "ابنِ حضورك، اتكشف، وحوّل شغفك لفرص حقيقية.",
    talentItems: ["اعمل بروفايلك", "اتكشف", "قدّم على الفرص", "شارك شغلك", "اعمل باقاتك", "كبّر سمعتك"],
    brandTitleA: "لو أنت ",
    brandTitleB: "براند / منظّم",
    brandText: "اكتشف وتعاون مع المواهب المناسبة لحملاتك وفعالياتك ومشاريعك.",
    brandItems: ["اكتشف مواهب موثّقة", "تصفّح التصنيفات", "احجز الشخص المناسب", "انشر حملاتك", "دير تعاوناتك", "لاقي المبدعين الموثوقين أسرع"],

    discoverEyebrow: "استكشف مواهب إبداعية متنوعة",
    discoverTitle: "اكتشف المواهب",
    viewAll: "عرض كل التصنيفات",
    soon: "قريباً",
    cats: {
      ugc: ["صنّاع UGC", "محتوى أصيل من صنّاع محتوى لبراندك."],
      model: ["موديلز", "موضة وتجاري ولايف ستايل وأكتر."],
      influencers: ["إنفلونسرز", "مبدعين بمتابعين متفاعلين ومجتمعات وفية."],
      family: ["مواهب عائلية", "عائلات وأطفال وناس حقيقية لحملاتك."],
      photographers: ["مصوّرين / صنّاع محتوى", "حكّائين بصريين للبراندات والفعاليات."],
    },

    numbersEyebrow: "مجتمع بينمو من ناس رائعة",
    numbersTitle: "Talents بالأرقام",
    numbersAside: "أرقام حقيقية من المنصة، بتتحدّث مع كل موهبة وبراند جديد.",
    stats: {
      talents: "موهبة",
      brands: "براند",
      ugc: "صنّاع UGC",
      models: "موديلز",
      projects: "مشروع اتنفّذ",
      rating: "متوسط التقييم",
    },

    communityEyebrow: "تواصل × شارك × انمو مع بعض",
    communityTitle: "شارك موهبتك مع الناس",
    communityText: "انشر شغلك، شارك رحلتك، واسأل واتلهم من مجتمع بيدعم المواهب الإبداعية.",
    storiesTitle: "ستوريز من المجتمع",
    join: "انضم للنقاش",
    inviteTitle: "جاهز تتكشف؟",
    inviteText: "انضم كموهبة وابدأ تظهر للبراندات.",
    offer: "عرض",
    story: "ستوري",
    ago: "منذ",
    emptyPosts: "لسه مفيش منشورات — كن أول من يشارك.",
    firstPost: "اعمل أول منشور",
    egp: "EGP",

    pkgEyebrow: "حوّل موهبتك لفرص",
    pkgTitle: "باقات المواهب",
    pkgText: "اعمل باقات خدماتك واعرضها للبراندات — يسهّل عليهم يشتغلوا معاك.",
    from: "بداية من",
    createPackages: "اعمل باقاتك",
    browsePackages: "تصفّح الباقات",
  },
  en: {
    heroEyebrow: "PEOPLE × CREATIVITY × OPPORTUNITY",
    heroTitleA: "Where brands find talent,",
    heroTitleB: "and talents find opportunity.",
    heroSub: "Talents connects brands and organizers with models, UGC creators and other creative talents — all in one place.",
    findTalents: "Find Talents",
    joinTalent: "Join as Talent",
    myProfile: "My profile",
    trust: ["Verified Profiles", "Real Opportunities", "Easy Collaboration", "Community Driven"],
    tagline: ["Create", "Collaborate", "Grow"],
    cardBrandTitle: "For Brands / Organizers",
    cardBrandText: "Find the right talent for your campaigns, events and projects.",
    cardTalentTitle: "For Talents",
    cardTalentText: "Showcase your work, get discovered and find amazing opportunities.",

    doesEyebrow: "FOR EVERYONE IN THE CREATIVE INDUSTRY",
    doesTitle: "What Talents does for you",
    talentTitleA: "If you're a ",
    talentTitleB: "Talent",
    talentText: "Build your presence, get discovered and turn your passion into opportunities.",
    talentItems: ["Build your profile", "Get discovered", "Apply to opportunities", "Share your work", "Create packages", "Grow your reputation"],
    brandTitleA: "If you're a ",
    brandTitleB: "Brand / Organizer",
    brandText: "Discover and collaborate with the right talents for your campaigns, events and projects.",
    brandItems: ["Discover vetted talents", "Browse categories", "Book the right people", "Post campaigns", "Manage collaborations", "Find reliable creators faster"],

    discoverEyebrow: "EXPLORE DIVERSE CREATIVE TALENTS",
    discoverTitle: "Discover Talents",
    viewAll: "View all categories",
    soon: "Soon",
    cats: {
      ugc: ["UGC Creators", "Authentic content creators for your brand."],
      model: ["Models", "Fashion, commercial, lifestyle and more."],
      influencers: ["Influencers", "Creators with engaged and loyal communities."],
      family: ["Family Talents", "Families, kids and real people for your campaigns."],
      photographers: ["Photographers / Creators", "Visual storytellers for brands and events."],
    },

    numbersEyebrow: "A GROWING COMMUNITY OF AMAZING PEOPLE",
    numbersTitle: "Talents in numbers",
    numbersAside: "Real numbers from the platform — updated with every new talent and brand.",
    stats: {
      talents: "Talents",
      brands: "Brands",
      ugc: "UGC Creators",
      models: "Models",
      projects: "Projects completed",
      rating: "Average rating",
    },

    communityEyebrow: "CONNECT × SHARE × GROW TOGETHER",
    communityTitle: "Share your talent with others",
    communityText: "Post your work, share your journey, ask questions and get inspired by a community that supports creative talents.",
    storiesTitle: "Stories from our community",
    join: "Join the conversation",
    inviteTitle: "Ready to be discovered?",
    inviteText: "Join as a talent and start showing up for brands.",
    offer: "Offer",
    story: "Story",
    ago: "",
    emptyPosts: "No posts yet — be the first to share.",
    firstPost: "Share the first post",
    egp: "EGP",

    pkgEyebrow: "TURN YOUR TALENT INTO OPPORTUNITIES",
    pkgTitle: "Talent Packages",
    pkgText: "Create and offer service packages to showcase your skills and make it easy for brands to work with you.",
    from: "From",
    createPackages: "Create your packages",
    browsePackages: "Browse packages",
  },
} as const;

const TALENT_ICONS: LucideIcon[] = [UserRound, Eye, Send, ImageIcon, PackageOpen, BarChart3];
const BRAND_ICONS: LucideIcon[] = [Search, LayoutGrid, CalendarCheck, Megaphone, Users, ShieldCheck];
const TRUST_ICONS: LucideIcon[] = [ShieldCheck, Users, Handshake, Heart];

const isVideo = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url) || url.includes("/video/upload/");

function timeAgo(iso: string, lang: Lang): string {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === "ar" ? "ar-EG" : "en", { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, secs] of steps) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return rtf.format(0, "second");
}

export default function HomeLanding(props: HomeLandingProps) {
  const { lang } = props;
  const t = TX[lang];
  const ar = lang === "ar";
  const Arrow = ar ? ArrowLeft : ArrowRight;
  const { user } = useGuestGuard();
  const isTalent = user?.role === "talent";
  // Western digits in both languages, like the rest of the site (bookings, community, admin).
  const num = new Intl.NumberFormat("en");

  const heroSrc = STOCK.hero;

  const categories: { key: keyof typeof t.cats; image: string; live: boolean }[] = [
    { key: "ugc", image: STOCK.ugc, live: true },
    { key: "model", image: STOCK.models, live: true },
    { key: "influencers", image: STOCK.influencers, live: false },
    { key: "family", image: STOCK.family, live: false },
    { key: "photographers", image: STOCK.photographers, live: false },
  ];

  // Only real, non-zero figures. The first tile (talents) is the highlighted one.
  const stats: { label: string; value: string; icon: LucideIcon }[] = [
    { label: t.stats.talents, value: num.format(props.totalTalents), icon: Users },
    props.brandCount > 0 && { label: t.stats.brands, value: num.format(props.brandCount), icon: Building2 },
    props.categoryCounts.ugc > 0 && { label: t.stats.ugc, value: num.format(props.categoryCounts.ugc), icon: Video },
    props.categoryCounts.model > 0 && { label: t.stats.models, value: num.format(props.categoryCounts.model), icon: Camera },
    props.completedProjects > 0 && { label: t.stats.projects, value: num.format(props.completedProjects), icon: BadgeCheck },
    props.avgRating > 0 && { label: t.stats.rating, value: num.format(Number(props.avgRating.toFixed(1))), icon: Star },
  ].filter(Boolean) as { label: string; value: string; icon: LucideIcon }[];

  const { stories, posts } = props.community;

  return (
    <div className={styles.page}>
      {/* ── 1 · Hero ─────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>{t.heroEyebrow}</p>
              <h1 className={styles.heroTitle}>
                {t.heroTitleA} <span className={styles.accentText}>{t.heroTitleB}</span>
              </h1>
              <p className={styles.lead}>{t.heroSub}</p>

              <div className={styles.heroActions}>
                <Link href="/explore" className={styles.btnPrimary}>
                  {t.findTalents}
                  <Arrow size={17} aria-hidden="true" />
                </Link>
                <Link href={isTalent ? "/profile/me" : "/become-talent"} className={styles.btnOutline}>
                  {isTalent ? t.myProfile : t.joinTalent}
                </Link>
              </div>

              <ul className={styles.trustRow}>
                {t.trust.map((label, i) => {
                  const Icon = TRUST_ICONS[i];
                  return (
                    <li key={label} className={styles.trustItem}>
                      <Icon size={22} aria-hidden="true" />
                      {label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className={styles.collage} aria-label="Talents">
              <span className={`${styles.blob} ${styles.blobPeach}`} aria-hidden="true" />
              <span className={`${styles.blob} ${styles.blobTeal}`} aria-hidden="true" />
              <span className={`${styles.dot} ${styles.dotOne}`} aria-hidden="true" />
              <span className={`${styles.dot} ${styles.dotTwo}`} aria-hidden="true" />
              <span className={`${styles.dot} ${styles.dotThree}`} aria-hidden="true" />

              <div className={`${styles.shot} ${styles.shotA}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroSrc[0].src} alt={heroSrc[0].alt} fetchPriority="high" />
              </div>
              <div className={`${styles.shot} ${styles.shotB}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroSrc[1].src} alt={heroSrc[1].alt} />
              </div>
              <div className={`${styles.shot} ${styles.shotC}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroSrc[2].src} alt={heroSrc[2].alt} />
              </div>
              <div className={`${styles.shot} ${styles.shotD}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroSrc[3].src} alt={heroSrc[3].alt} />
              </div>

              <Link href="/explore" className={`${styles.floatCard} ${styles.floatBrands}`}>
                <span className={styles.floatIcon}><Building2 size={22} aria-hidden="true" /></span>
                <span className={styles.floatBody}>
                  <strong>{t.cardBrandTitle}</strong>
                  <small>{t.cardBrandText}</small>
                </span>
                <span className={styles.roundArrow}><Arrow size={16} aria-hidden="true" /></span>
              </Link>

              <Link href="/become-talent" className={`${styles.floatCard} ${styles.floatTalents}`}>
                <span className={styles.floatIcon}><UserRound size={22} aria-hidden="true" /></span>
                <span className={styles.floatBody}>
                  <strong>{t.cardTalentTitle}</strong>
                  <small>{t.cardTalentText}</small>
                </span>
                <span className={styles.roundArrow}><Arrow size={16} aria-hidden="true" /></span>
              </Link>

              <p className={styles.script} aria-hidden="true">
                {t.tagline.map((w) => <span key={w}>{w}</span>)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2 · What Talents does for you ───────────────────────────────── */}
      <section className={styles.band}>
        <div className={styles.container}>
          <header className={styles.centerHead}>
            <p className={styles.eyebrow}>{t.doesEyebrow}</p>
            <h2 className={styles.h2}>{t.doesTitle}</h2>
          </header>

          <div className={styles.audienceGrid}>
            <article className={styles.audienceCard}>
              <div className={`${styles.audiencePhoto} ${styles.audiencePhotoPeach}`}>
                <Image src="/assets/auth-hero-talent.webp" alt="" width={900} height={1350} sizes="220px" />
              </div>
              <div className={styles.audienceBody}>
                <h3 className={styles.h3}>{t.talentTitleA}<span className={styles.accentText}>{t.talentTitleB}</span></h3>
                <p className={styles.muted}>{t.talentText}</p>
                <ul className={styles.itemGrid}>
                  {t.talentItems.map((label, i) => {
                    const Icon = TALENT_ICONS[i];
                    return (
                      <li key={label} className={styles.item}>
                        <span className={styles.itemIcon}><Icon size={18} aria-hidden="true" /></span>
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>

            <article className={styles.audienceCard}>
              <div className={styles.audiencePhoto}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={STOCK.brandCard} alt="" loading="lazy" />
              </div>
              <div className={styles.audienceBody}>
                <h3 className={styles.h3}>{t.brandTitleA}<span className={styles.accentText}>{t.brandTitleB}</span></h3>
                <p className={styles.muted}>{t.brandText}</p>
                <ul className={styles.itemGrid}>
                  {t.brandItems.map((label, i) => {
                    const Icon = BRAND_ICONS[i];
                    return (
                      <li key={label} className={styles.item}>
                        <span className={styles.itemIcon}><Icon size={18} aria-hidden="true" /></span>
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── 3 · Discover Talents ────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.splitHead}>
            <div>
              <p className={styles.eyebrow}>{t.discoverEyebrow}</p>
              <h2 className={styles.h2}>{t.discoverTitle}</h2>
            </div>
            <Link href="/explore" className={styles.textLink}>
              {t.viewAll}
              <Arrow size={16} aria-hidden="true" />
            </Link>
          </header>

          <div className={styles.catGrid}>
            {categories.map((c) => {
              const [title, text] = t.cats[c.key];
              const inner = (
                <>
                  <div className={styles.catPhoto}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" loading="lazy" />
                    {!c.live && <span className={styles.ribbon}>{t.soon}</span>}
                  </div>
                  <div className={styles.catBody}>
                    <div>
                      <h3 className={styles.catTitle}>{title}</h3>
                      <p className={styles.catText}>{text}</p>
                    </div>
                    {c.live && <span className={styles.roundArrow}><Arrow size={16} aria-hidden="true" /></span>}
                  </div>
                </>
              );
              return c.live ? (
                <Link key={c.key} href="/explore" className={styles.catCard}>{inner}</Link>
              ) : (
                <div key={c.key} className={`${styles.catCard} ${styles.catCardSoon}`} aria-disabled="true">{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4 · Talents in numbers ──────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.splitHead}>
            <div>
              <p className={styles.eyebrow}>{t.numbersEyebrow}</p>
              <h2 className={styles.h2}>{t.numbersTitle}</h2>
            </div>
            <p className={`${styles.muted} ${styles.headAside}`}>{t.numbersAside}</p>
          </header>

          <ul className={styles.statGrid}>
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.label} className={`${styles.stat} ${i === 0 ? styles.statFeatured : ""}`}>
                  <span className={styles.statIcon}><Icon size={22} aria-hidden="true" /></span>
                  <span className={styles.statText}>
                    <strong>{s.value}</strong>
                    <small>{s.label}</small>
                  </span>
                  {i === 0 && (
                    <Link href="/explore" className={styles.statArrow} aria-label={t.findTalents}>
                      <Arrow size={16} aria-hidden="true" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ── 5 · Community ───────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.communityTop}>
            <div className={styles.communityIntro}>
              <p className={styles.eyebrow}>{t.communityEyebrow}</p>
              <h2 className={styles.h2}>{t.communityTitle}</h2>
              <p className={styles.muted}>{t.communityText}</p>
            </div>

            <div className={styles.storiesBlock}>
              <p className={styles.storiesTitle}>{t.storiesTitle}</p>
              <div className={styles.storiesRow}>
                {stories.map((s) => (
                  <Link key={s.id} href="/community" className={styles.storyAvatar} title={s.authorName}>
                    {s.authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cdnImage(s.authorAvatar, 120)} alt={s.authorName} loading="lazy" />
                    ) : (
                      <UserRound size={22} aria-hidden="true" />
                    )}
                  </Link>
                ))}
                <Link href="/community" className={styles.storyJoin}>
                  <span><Plus size={20} aria-hidden="true" /></span>
                  <small>{t.join}</small>
                </Link>
              </div>
            </div>

            <Link href={isTalent ? "/community" : "/become-talent"} className={styles.invite}>
              <span className={styles.inviteIcon}><Sparkles size={22} aria-hidden="true" /></span>
              <span className={styles.inviteBody}>
                <strong>{t.inviteTitle}</strong>
                <small>{t.inviteText}</small>
              </span>
              <span className={styles.roundArrow}><Arrow size={16} aria-hidden="true" /></span>
            </Link>
          </div>

          <div className={styles.postGrid}>
            {posts.map((p) => (
              <Link key={p.id} href="/community" className={styles.post}>
                <div className={styles.postHead}>
                  <span className={styles.postAvatar}>
                    {p.authorAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cdnImage(p.authorAvatar, 80)} alt="" loading="lazy" />
                    ) : (
                      <UserRound size={16} aria-hidden="true" />
                    )}
                  </span>
                  <span className={styles.postWho}>
                    <strong>{p.authorName}</strong>
                    <small>{timeAgo(p.createdAt, lang)}</small>
                  </span>
                  <span className={styles.postBadge}>{p.type === "offer" ? t.offer : t.story}</span>
                </div>
                {p.mediaUrl ? (
                  <div className={styles.postMedia}>
                    {isVideo(p.mediaUrl) ? (
                      <video src={p.mediaUrl} muted playsInline preload="metadata" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cdnImage(p.mediaUrl, 520)} alt="" loading="lazy" />
                    )}
                  </div>
                ) : (
                  <div className={`${styles.postMedia} ${styles.postMediaText}`}>
                    <MessageCircle size={26} aria-hidden="true" />
                  </div>
                )}
                <p className={styles.postText}>{p.title || p.content}</p>
                {p.price != null && (
                  <p className={styles.postPrice}><bdi>{t.egp} {num.format(p.price)}</bdi></p>
                )}
              </Link>
            ))}

            {posts.length < 4 && (
              <Link href="/community" className={`${styles.post} ${styles.postInvite}`}>
                <MessageCircle size={28} aria-hidden="true" />
                <p>{posts.length === 0 ? t.emptyPosts : t.join}</p>
                <span className={styles.btnOutline}>{t.firstPost}</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── 6 · Talent Packages ─────────────────────────────────────────── */}
      <section className={styles.packagesSection}>
        <div className={styles.container}>
          <div className={styles.packagesBand}>
            <div className={styles.packagesCopy}>
              <p className={styles.eyebrow}>{t.pkgEyebrow}</p>
              <h2 className={styles.h2}>{t.pkgTitle}</h2>
              <p className={styles.muted}>{t.pkgText}</p>
            </div>

            <div className={styles.packageCards}>
              {props.packages.length > 0 ? (
                props.packages.map((p) => (
                  <Link key={p.key} href={`/talent/${p.handle}`} className={styles.pkgCard}>
                    <span className={styles.pkgThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cdnImage(p.avatarUrl, 160)} alt={p.talentName} loading="lazy" />
                    </span>
                    <span className={styles.pkgBody}>
                      <strong>{p.name}</strong>
                      <small>{t.from} <bdi>{t.egp} {num.format(p.price)}</bdi></small>
                      <em>{p.talentName}</em>
                    </span>
                    <span className={`${styles.roundArrow} ${styles.pkgArrow}`}><Arrow size={16} aria-hidden="true" /></span>
                  </Link>
                ))
              ) : (
                <Link href={isTalent ? "/profile/me" : "/become-talent"} className={styles.btnPrimary}>
                  {t.createPackages}
                  <Arrow size={17} aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
