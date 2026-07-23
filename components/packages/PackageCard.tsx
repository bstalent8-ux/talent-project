"use client";

import { Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { LandingLang } from "@/app/(main)/home/_components/landing/content";
import type { MarketplacePackage, PackagePlan } from "@/features/packages/types";
import styles from "./PackagePricing.module.css";

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
  onSelectPlan,
  onSubscribe,
  subscribing,
  compact = false,
}: {
  pkg: MarketplacePackage;
  lang: LandingLang;
  selectedPlanId?: string | null;
  onSelectPlan?: (plan: PackagePlan) => void;
  onSubscribe?: (plan: PackagePlan, pkg: MarketplacePackage) => void;
  subscribing?: boolean;
  compact?: boolean;
}) {
  const plans = pkg.plans.filter((plan) => plan.is_active);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null;

  return (
    <motion.article
      className={styles.packageCard}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26 }}
    >
      <div className={styles.packageHeader}>
        <span className={styles.packageEyebrow}>
          <Sparkles size={14} />
          {audienceLabel(pkg, lang)}
        </span>
        <h3 className={styles.packageTitle}>{pkg.name}</h3>
        {pkg.description ? <p className={styles.packageDescription}>{pkg.description}</p> : null}
      </div>

      {selectedPlan ? (
        <div className={styles.priceLine}>
          <span className={styles.price}>{formatPrice(selectedPlan, lang)}</span>
          <span className={styles.currency}>
            {selectedPlan.currency} / {formatDuration(selectedPlan.duration_months, lang)}
          </span>
        </div>
      ) : null}

      {!compact && plans.length > 1 ? (
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
                onClick={() => onSelectPlan?.(plan)}
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

      <div className={styles.cardFooter}>
        {onSubscribe && selectedPlan ? (
          <button
            className={styles.primaryButton}
            type="button"
            disabled={subscribing}
            onClick={() => onSubscribe(selectedPlan, pkg)}
          >
            {subscribing ? (lang === "ar" ? "جاري الاشتراك..." : "Subscribing...") : (lang === "ar" ? "اشترك الآن" : "Subscribe now")}
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}
