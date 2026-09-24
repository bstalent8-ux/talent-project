"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Languages,
  Moon,
  ShieldCheck,
  Sun,
  User,
  Users,
} from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import styles from "../auth.module.css";
import { useLangSwitch } from "./useLangSwitch";

export type AuthVariant = "register" | "login" | "plain";

const TX = {
  ar: {
    back: "العودة للرئيسية",
    lang: "تغيير اللغة",
    theme: "تغيير الوضع",
    eyebrow: "أشخاص × فرص × إبداع",
    headRegister: ["ابدأ رحلتك مع", "Talents"],
    headLogin: ["أهلاً بيك تاني في", "Talents"],
    subRegister:
      "انضم لمجتمع نابض يجمع المواهب والبراندات والمنظّمين ليتواصلوا ويتعاونوا ويصنعوا فرصاً جديدة معاً.",
    subLogin: "سجّل دخولك وكمّل من حيث وقفت. مجتمعك وفرصك في انتظارك.",
    f1: ["مجتمع نابض", "مواهب وبراندات ومنظّمون في مكان واحد."],
    f2: ["فرص حقيقية", "اكتشف تعاونات ومشاريع وفعاليات."],
    f3: ["نمّي حضورك", "ابنِ ملفك وافتح إمكانيات جديدة."],
    tagline: "موهبتك ليها مكان.",
    cVerified: ["ملفات موثّقة", "قابل مواهب وشركاء حقيقيين."],
    cTalents: ["للمواهب", "اعرض أعمالك وخلّي البراندات تلاقيك."],
    cBrands: ["للبراندات / المنظّمين", "لاقي مواهب مميزة وتعاون معاها."],
    cOpps: ["فرص حقيقية", "اكتشف مشاريع وفعاليات وأكتر."],
  },
  en: {
    back: "Back to Home",
    lang: "Toggle language",
    theme: "Toggle theme",
    eyebrow: "PEOPLE × OPPORTUNITIES × CREATIVITY",
    headRegister: ["Start your journey with", "Talents"],
    headLogin: ["Welcome back to", "Talents"],
    subRegister:
      "Join a thriving community where talent, brands, and organizers connect, collaborate, and create new opportunities together.",
    subLogin: "Sign in and continue where you left off. Your community and opportunities are waiting.",
    f1: ["A Thriving Community", "Talents, brands, and organizers coming together."],
    f2: ["Real Opportunities", "Discover collaborations, projects, and events."],
    f3: ["Grow Your Presence", "Build your profile and unlock new possibilities."],
    tagline: "Your talent has a place.",
    cVerified: ["Verified Profiles", "Meet authentic talents and partners."],
    cTalents: ["For Talents", "Showcase your work, get discovered."],
    cBrands: ["For Brands / Organizers", "Find and collaborate with amazing talent."],
    cOpps: ["Real Opportunities", "Discover projects, events, and more."],
  },
} as const;

interface Props {
  variant: AuthVariant;
  /** True while the form is sliding out ahead of a route change. */
  leaving?: boolean;
  /** True while the left showcase should play its exit (a different variant is next). */
  showcaseLeaving?: boolean;
  /** Changes per route, so the incoming form remounts and plays its entrance. */
  pageKey?: string;
  children: ReactNode;
}

/**
 * The one frame every auth page renders inside: top bar (logo, back-to-home,
 * language + theme), an optional showcase card, and the form card that holds
 * the page's own form. Pages own their form logic; this owns the chrome.
 */
export default function AuthFrame({ variant, leaving = false, showcaseLeaving = false, pageKey, children }: Props) {
  const { lang, dark, toggleMode } = useSite();
  const t = TX[lang];
  const ar = lang === "ar";
  const Chevron = ar ? ChevronRight : ChevronLeft;
  const logoSrc = dark ? "/assets/talents-logo-dark.png" : "/assets/talents-logo-light.png";
  const showcase = variant !== "plain";

  // Wipe-out / type-in language switch (shared with the onboarding page).
  const { phase, switchLang } = useLangSwitch();
  const [headA, headB] = variant === "login" ? t.headLogin : t.headRegister;

  return (
    <div className={styles.authPage} data-lang-phase={phase}>
      <header className={styles.topBar}>
        <Link href="/home" aria-label="Talents" className={styles.topLogo}>
          <Image src={logoSrc} alt="Talents" width={150} height={47} priority style={{ width: "auto", height: 38 }} />
        </Link>
        <div className={styles.topActions}>
          <button type="button" className={styles.controlButton} onClick={switchLang} disabled={phase !== "idle"} aria-label={t.lang}>
            <Languages size={14} aria-hidden="true" />
            {ar ? "EN" : "ع"}
          </button>
          <button type="button" className={styles.controlButton} onClick={toggleMode} aria-label={t.theme}>
            {dark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
          </button>
          <Link href="/home" className={styles.backLink}>
            <Chevron size={16} aria-hidden="true" />
            {t.back}
          </Link>
        </div>
      </header>

      <main className={showcase ? `${styles.split} ${variant === "register" ? styles.splitWide : ""}` : styles.splitSingle}>
        {showcase && (
          <section
            className={`${styles.showcase} ${showcaseLeaving ? styles.showLeaving : styles.showEntering}`}
            aria-label="Talents"
          >
            <div key={variant} className={styles.showcaseText}>
              <p className={styles.showcaseEyebrow}>{t.eyebrow}</p>
              <h2 className={styles.showcaseHeading}>
                {headA} <span className={styles.showcaseHighlight}>{headB}</span>
              </h2>
              <p className={styles.showcaseSub}>{variant === "login" ? t.subLogin : t.subRegister}</p>

              <ul className={styles.featureList}>
                <li className={styles.feature}>
                  <span className={`${styles.featureIcon} ${styles.featureTeal}`}><Users size={22} aria-hidden="true" /></span>
                  <span>
                    <strong>{t.f1[0]}</strong>
                    <small>{t.f1[1]}</small>
                  </span>
                </li>
                <li className={styles.feature}>
                  <span className={`${styles.featureIcon} ${styles.featurePeach}`}><Briefcase size={22} aria-hidden="true" /></span>
                  <span>
                    <strong>{t.f2[0]}</strong>
                    <small>{t.f2[1]}</small>
                  </span>
                </li>
                <li className={styles.feature}>
                  <span className={`${styles.featureIcon} ${styles.featureTeal}`}><BarChart3 size={22} aria-hidden="true" /></span>
                  <span>
                    <strong>{t.f3[0]}</strong>
                    <small>{t.f3[1]}</small>
                  </span>
                </li>
              </ul>

              <p className={styles.tagline}>
                {t.tagline}
                <svg className={styles.taglineStroke} viewBox="0 0 220 14" aria-hidden="true" focusable="false">
                  <path d="M3 9 C 50 2, 120 2, 217 8" />
                </svg>
              </p>
            </div>

            <div className={styles.showcaseArt} aria-hidden="true">
              <svg className={`${styles.shapes} ${variant === "login" ? styles.shapesLogin : ""}`} viewBox="0 0 420 640" preserveAspectRatio="xMidYMax meet" focusable="false">
                <defs>
                  <mask id="auth-crescent">
                    <rect width="420" height="640" fill="#fff" />
                    <circle cx="292" cy="238" r="176" fill="#000" />
                  </mask>
                </defs>
                <circle className={styles.shapeTeal} cx="248" cy="280" r="196" mask="url(#auth-crescent)" />
                <path className={styles.shapePeach} d="M338 30 C 386 66 396 124 362 176 C 330 128 318 74 338 30 Z" />
                <path className={styles.shapePeach} d="M6 392 C 44 336 112 322 176 350 C 122 352 62 372 6 392 Z" />
                <circle className={styles.shapeTeal} cx="52" cy="238" r="12" />
                <circle className={styles.shapeTeal} cx="382" cy="520" r="20" />
                <circle className={styles.shapePeach} cx="396" cy="222" r="9" />
                <circle className={styles.shapePeach} cx="96" cy="560" r="8" />
              </svg>

              <Image
                className={styles.heroPhoto}
                src="/assets/auth-hero-talent.webp"
                alt=""
                width={900}
                height={1350}
                priority
                sizes="(max-width: 1180px) 0px, 480px"
              />

              <div key={variant} className={styles.floatLayer}>
              <div className={`${styles.floatCard} ${styles.floatVerified}`}>
                <span className={`${styles.floatIcon} ${styles.featureTeal}`}><ShieldCheck size={20} /></span>
                <span><strong>{t.cVerified[0]}</strong><small>{t.cVerified[1]}</small></span>
              </div>
              <div className={`${styles.floatCard} ${styles.floatTalents}`}>
                <span className={`${styles.floatIcon} ${styles.featurePeach}`}><User size={20} /></span>
                <span><strong>{t.cTalents[0]}</strong><small>{t.cTalents[1]}</small></span>
              </div>
              <div className={`${styles.floatCard} ${styles.floatBrands}`}>
                <span className={`${styles.floatIcon} ${styles.featureTeal}`}><Users size={20} /></span>
                <span><strong>{t.cBrands[0]}</strong><small>{t.cBrands[1]}</small></span>
              </div>
              <div className={`${styles.floatCard} ${styles.floatOpps}`}>
                <span className={`${styles.floatIcon} ${styles.featurePeach}`}><CalendarDays size={20} /></span>
                <span><strong>{t.cOpps[0]}</strong><small>{t.cOpps[1]}</small></span>
              </div>
              </div>
            </div>
          </section>
        )}

        <section className={styles.formCard}>
          <div className={styles.langWipe}>
            <div key={pageKey} className={`${styles.formCardInner} ${leaving ? styles.formLeaving : styles.formEntering}`}>
              {children}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
