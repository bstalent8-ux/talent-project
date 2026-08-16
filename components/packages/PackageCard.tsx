"use client";

import { Check, Lock, Sparkles, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { LandingLang } from "@/app/(main)/home/_components/landing/content";
import type { MarketplacePackage, PackagePlan } from "@/features/packages/types";
import { useIsMobile } from "@/hooks/useIsMobile";
import styles from "./PackagePricing.module.css";

// Premium ease-out-quint, mirrored from --ease-out-quint in globals.css.
const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
// How much a selected card grows in both width and height.
const SELECTED_SCALE = 1.08;
// Hover lift for a non-selected card (grow) and vertical offset (both states).
const HOVER_SCALE = 1.04;
const HOVER_LIFT = -6;

function formatDuration(months: number, lang: LandingLang) {
  const labels: Record<number, { ar: string; en: string }> = {
    1: { ar: "شهري", en: "Monthly" },
    3: { ar: "3 شهور", en: "3 months" },
    6: { ar: "6 شهور", en: "6 months" },
    12: { ar: "سنوي", en: "Yearly" },
  };
  return labels[months]?.[lang] ?? (lang === "ar" ? `${months} شهر` : `${months} months`);
}

function formatFeature(key: string, value: string) {
  const label = key.replace(/_/g, " ");
  if (value === "true") return label;
  if (value === "false") return `${label}: no`;
  return `${label}: ${value}`;
}

function formatPrice(plan: PackagePlan, lang: LandingLang) {
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(plan.price);
}

function audienceLabel(pkg: MarketplacePackage, lang: LandingLang) {
  if (pkg.targets.some((target) => target.target_type === "all_roles")) {
    return lang === "ar" ? "باقة لكل الحسابات" : "All roles package";
  }
  if (pkg.targets.some((target) => target.target_type === "role" && target.target_id === "brand")) {
    return lang === "ar" ? "باقة براند" : "Brand package";
  }
  if (pkg.targets.some((target) => target.target_type === "all_talents")) {
    return lang === "ar" ? "باقة لكل المواهب" : "All talents package";
  }
  return lang === "ar" ? "باقة موهبة" : "Talent package";
}

export default function PackageCard({
  pkg,
  lang,
  selectedPlanId,
  selected = false,
  onSelectPackage,
  onSelectPlan,
  onSubscribe,
  subscribing,
  showPlanSelector = true,
  compact = false,
  locked = false,
  isFree = false,
}: {
  pkg: MarketplacePackage;
  lang: LandingLang;
  selectedPlanId?: string | null;
  selected?: boolean;
  onSelectPackage?: (pkg: MarketplacePackage) => void;
  onSelectPlan?: (plan: PackagePlan) => void;
  onSubscribe?: (plan: PackagePlan, pkg: MarketplacePackage) => void;
  subscribing?: boolean;
  showPlanSelector?: boolean;
  compact?: boolean;
  /** Package isn't launched yet: content is blurred, "Coming Soon" badge shows, actions are disabled. */
  locked?: boolean;
  /** The always-on free tier: shown normally with a "current plan" indicator instead of a subscribe button. */
  isFree?: boolean;
}) {
  const plans = pkg.plans.filter((plan) => plan.is_active);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null;

  const reduce = useReducedMotion();
  const isMobile = useIsMobile(680); // matches the single-column grid breakpoint
  // Grow the selected card in both width and height. Skip on mobile — the grid is
  // single-column there, so a scaled card would overflow the viewport horizontally.
  const grow = selected && !isMobile ? SELECTED_SCALE : 1;

  return (
    <motion.article
      className={`${styles.packageCard} ${selected ? styles.packageCardSelected : ""} ${locked ? styles.packageCardLocked : ""}`}
      onClick={locked ? undefined : () => onSelectPackage?.(pkg)}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, scale: grow }}
      // Hover is independent of selection: a selected card keeps its larger size and
      // only lifts; a non-selected card grows to 1.04 and lifts. Colour/shadow are in CSS.
      whileHover={
        reduce || isMobile || locked
          ? undefined
          : { y: HOVER_LIFT, scale: selected ? SELECTED_SCALE : HOVER_SCALE }
      }
      transition={
        reduce
          ? { duration: 0 }
          : {
              scale: { duration: 0.4, ease: EASE_OUT_QUINT },
              y: { duration: 0.4, ease: EASE_OUT_QUINT },
              opacity: { duration: 0.3, ease: EASE_OUT_QUINT },
            }
      }
      style={{ transformOrigin: "center", zIndex: selected ? 3 : 1 }}
    >
      {locked ? (
        <span className={styles.comingSoonBadge}>
          <Lock size={13} />
          {lang === "ar" ? "قريبًا" : "Coming Soon"}
        </span>
      ) : null}

      <div className={locked ? styles.blurredContent : undefined} aria-hidden={locked || undefined}>
        <div className={styles.packageHeader}>
          <span className={styles.packageEyebrow}>
            <Sparkles size={14} />
            {audienceLabel(pkg, lang)}
          </span>
          <h3 className={styles.packageTitle}>{pkg.name}</h3>
          {pkg.description ? <p className={styles.packageDescription}>{pkg.description}</p> : null}
          {pkg.subscribers_count > 0 ? (
            <span className={styles.subscribers}>
              <Users size={13} />
              {lang === "ar"
                ? `${pkg.subscribers_count.toLocaleString("ar-EG")} مشترك في هذه الباقة`
                : `${pkg.subscribers_count.toLocaleString("en-US")} ${pkg.subscribers_count === 1 ? "user" : "users"} on this plan`}
            </span>
          ) : null}
        </div>

        {selectedPlan ? (
          <div className={styles.priceLine}>
            <span className={styles.price}>{formatPrice(selectedPlan, lang)}</span>
            <span className={styles.currency}>
              {selectedPlan.currency} / {formatDuration(selectedPlan.duration_months, lang)}
            </span>
          </div>
        ) : null}

        {showPlanSelector && !compact && plans.length > 1 ? (
          <div className={styles.durationTabs} role="radiogroup" aria-label={lang === "ar" ? "مدة الفوترة" : "Billing duration"}>
            {plans.map((plan) => {
              const active = selectedPlan?.id === plan.id;
              return (
                <button
                  className={`${styles.durationTab} ${active ? styles.tabActive : ""}`}
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={locked}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectPackage?.(pkg);
                    onSelectPlan?.(plan);
                  }}
                >
                  {formatDuration(plan.duration_months, lang)}
                </button>
              );
            })}
          </div>
        ) : null}

        <ul className={styles.features}>
          {pkg.features.slice(0, compact ? 4 : 8).map((feature) => (
            <li className={styles.feature} key={feature.id}>
              <Check size={16} />
              <span>{formatFeature(feature.feature_key, feature.feature_value)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.cardFooter}>
        {locked ? (
          <button className={styles.secondaryButton} type="button" disabled aria-disabled="true">
            <Lock size={14} />
            {lang === "ar" ? "قريبًا" : "Coming Soon"}
          </button>
        ) : isFree ? (
          <button className={styles.secondaryButton} type="button" disabled aria-disabled="true">
            {lang === "ar" ? "خطتك الحالية" : "Current plan"}
          </button>
        ) : onSubscribe && selectedPlan ? (
          <button
            className={styles.primaryButton}
            type="button"
            disabled={subscribing}
            onClick={(event) => {
              event.stopPropagation();
              onSelectPackage?.(pkg);
              onSubscribe(selectedPlan, pkg);
            }}
          >
            {subscribing ? (lang === "ar" ? "جاري الاشتراك..." : "Subscribing...") : (lang === "ar" ? "اشترك الآن" : "Subscribe now")}
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}
