"use client";

// ─── OnboardingTour ───────────────────────────────────────────────────────────
// The one-time orientation after signup, shared by talents (/onboarding) and
// brands (/onboarding/brand). Explanatory only — no data is collected here;
// Skip and the last step both go to `finishHref` (the role's profile wizard).
// Same chrome as the rest of the (auth) group: top bar, brand tokens, hero
// cut-out on wide screens, steps sliding in the direction you move.

import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Languages, Moon, Sun } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import authStyles from "../auth.module.css";
import styles from "./onboarding.module.css";
import { useLangSwitch } from "@/hooks/useLangSwitch";

type TourStep = {
  icon: LucideIcon;
  heading: string;
  sub: string;
  list?: Array<{ icon: LucideIcon; title: string; text: string }>;
};

type TourLang = {
  skip: string; lang: string; theme: string; back: string; next: string; done: string;
  stepOf: (n: number, total: number) => string;
  steps: TourStep[];
};

export type TourCopy = { ar: TourLang; en: TourLang };

export default function OnboardingTour({ tx, finishHref }: { tx: TourCopy; finishHref: string }) {
  const router = useRouter();
  const { lang, dark, toggleMode } = useSite();
  const { phase, switchLang } = useLangSwitch();
  const t = tx[lang];
  const ar = lang === "ar";
  const [stepIndex, setStepIndex] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");

  const step = t.steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === t.steps.length - 1;
  const Icon = step.icon;
  const Back = ar ? ChevronRight : ChevronLeft;
  const logoSrc = dark ? "/assets/talents-logo-dark.webp" : "/assets/talents-logo-light.webp";

  function go(delta: 1 | -1) {
    setDir(delta > 0 ? "next" : "prev");
    setStepIndex((i) => Math.min(t.steps.length - 1, Math.max(0, i + delta)));
  }

  function finish() {
    router.push(finishHref);
  }

  return (
    <div className={styles.page} data-lang-phase={phase}>
      <header className={authStyles.topBar}>
        <Link href="/home" aria-label="Talents" className={authStyles.topLogo}>
          <Image src={logoSrc} alt="Talents" width={150} height={47} priority unoptimized style={{ width: "auto", height: 38 }} />
        </Link>
        <div className={authStyles.topActions}>
          <button type="button" className={authStyles.controlButton} onClick={switchLang} disabled={phase !== "idle"} aria-label={t.lang}>
            <Languages size={14} aria-hidden="true" />
            {ar ? "EN" : "ع"}
          </button>
          <button type="button" className={authStyles.controlButton} onClick={toggleMode} aria-label={t.theme}>
            {dark ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main className={styles.stage}>
        <section className={styles.card} aria-labelledby="onboarding-heading">
          <div className={styles.cardContent}>
          <div className={styles.cardTop}>
            <p className={styles.counter}>{t.stepOf(stepIndex + 1, t.steps.length)}</p>
            <button type="button" className={styles.skip} onClick={finish}>
              {t.skip}
            </button>
          </div>

          <div className={styles.progress} role="progressbar" aria-valuemin={1} aria-valuemax={t.steps.length} aria-valuenow={stepIndex + 1}>
            {t.steps.map((_, i) => (
              <div key={i} className={`${styles.progressDot} ${i <= stepIndex ? styles.progressDotActive : ""}`} />
            ))}
          </div>

          <div key={stepIndex} className={`${styles.stepBody} ${dir === "next" ? styles.slideNext : styles.slidePrev}`}>
            <div className={styles.iconWrap}>
              <Icon size={26} aria-hidden="true" />
            </div>

            <h1 id="onboarding-heading" className={styles.heading}>{step.heading}</h1>
            <p className={styles.sub}>{step.sub}</p>

            {step.list && (
              <div className={styles.list}>
                {step.list.map((item, i) => {
                  const ItemIcon = item.icon;
                  return (
                    <div className={styles.listItem} key={item.title} style={{ animationDelay: `${120 + i * 70}ms` }}>
                      <div className={`${styles.listIcon} ${i % 2 ? styles.listIconPeach : ""}`}>
                        <ItemIcon size={16} aria-hidden="true" />
                      </div>
                      <div>
                        <p className={styles.listTitle}>{item.title}</p>
                        <p className={styles.listText}>{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={`${styles.back} ${isFirst ? styles.backHidden : ""}`}
              onClick={() => go(-1)}
              tabIndex={isFirst ? -1 : 0}
            >
              <Back size={16} aria-hidden="true" />
              {t.back}
            </button>
            <button type="button" className={styles.next} onClick={() => (isLast ? finish() : go(1))}>
              {isLast ? t.done : t.next}
            </button>
          </div>
          </div>
        </section>

        <aside className={styles.art} aria-hidden="true">
          <svg className={styles.artShapes} viewBox="0 0 420 640" preserveAspectRatio="xMidYMax meet" focusable="false">
            <defs>
              <mask id="onb-crescent">
                <rect width="420" height="640" fill="#fff" />
                <circle cx="292" cy="238" r="176" fill="#000" />
              </mask>
            </defs>
            <circle className={styles.shapeTeal} cx="248" cy="280" r="196" mask="url(#onb-crescent)" />
            <path className={styles.shapePeach} d="M338 30 C 386 66 396 124 362 176 C 330 128 318 74 338 30 Z" />
            <path className={styles.shapePeach} d="M6 392 C 44 336 112 322 176 350 C 122 352 62 372 6 392 Z" />
            <circle className={styles.shapeTeal} cx="52" cy="238" r="12" />
            <circle className={styles.shapeTeal} cx="382" cy="520" r="20" />
          </svg>
          <Image
            className={styles.artPhoto}
            src="/assets/auth-hero-talent.webp"
            alt=""
            width={900}
            height={1350}
            sizes="(max-width: 1100px) 0px, 420px"
          />
          <div key={stepIndex} className={styles.artChip}>
            <span className={styles.artChipIcon}><Icon size={18} /></span>
            <span>{step.heading}</span>
          </div>
        </aside>
      </main>
    </div>
  );
}
