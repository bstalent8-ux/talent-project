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

// Feature keys are admin-defined free text (snake_case). Known keys get a proper
// bilingual label; anything else falls back to a Title Case of the key so a new
// admin-created feature never shows as raw `some_key: value`.
const FEATURE_LABELS: Record<string, { ar: string; en: string }> = {
  monthly_actions:        { ar: "إجراءات شهرية", en: "Monthly actions" },
  priority_visibility:    { ar: "أولوية الظهور", en: "Priority visibility" },
  support_level:          { ar: "مستوى الدعم", en: "Support level" },
  featured_profile:       { ar: "بروفايل مميز", en: "Featured profile" },
  priority_discovery:     { ar: "أولوية في الاكتشاف", en: "Priority discovery" },
  marketplace_access:     { ar: "الوصول للسوق", en: "Marketplace access" },
  portfolio_limit:        { ar: "حد المعرض", en: "Portfolio items" },
  review_portfolio_limit: { ar: "حد معرض التقييمات", en: "Review portfolio items" },
  max_campaign_requests:  { ar: "طلبات الحملات", en: "Campaign requests" },
  style_campaign_requests:{ ar: "طلبات حملات الأزياء", en: "Style campaign requests" },
  restaurant_campaign_requests: { ar: "طلبات حملات المطاعم", en: "Restaurant campaign requests" },
  ugc_brief_templates:    { ar: "قوالب بريف UGC", en: "UGC brief templates" },
  shortlist_limit:        { ar: "حد القائمة المختصرة", en: "Shortlist size" },
  lead_access:            { ar: "الوصول للعملاء المحتملين", en: "Lead access" },
  job_posts:              { ar: "إعلانات الوظائف", en: "Job posts" },
  profile_visibility:     { ar: "ظهور البروفايل", en: "Profile visibility" },
  profile_boost:          { ar: "تعزيز البروفايل", en: "Profile boost" },
};

const FEATURE_VALUES: Record<string, { ar: string; en: string }> = {
  basic:     { ar: "أساسي", en: "Basic" },
  standard:  { ar: "قياسي", en: "Standard" },
  high:      { ar: "عالي", en: "High" },
  premium:   { ar: "مميز", en: "Premium" },
  priority:  { ar: "أولوية", en: "Priority" },
  dedicated: { ar: "مخصص", en: "Dedicated" },
  community: { ar: "مجتمعي", en: "Community" },
};

function titleCaseKey(key: string) {
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatFeature(key: string, value: string, lang: LandingLang) {
  const label = FEATURE_LABELS[key]?.[lang] ?? titleCaseKey(key);
  if (value === "true") return label;
  if (value === "false") return lang === "ar" ? `${label}: غير متاح` : `${label}: not included`;
  const known = FEATURE_VALUES[value.toLowerCase()]?.[lang];
  const shown = known ?? (/^\d+$/.test(value) ? Number(value).toLocaleString(lang === "ar" ? "ar-EG" : "en-US") : value);
  return `${label}: ${shown}`;
}

function formatPrice(plan: PackagePlan, lang: LandingLang) {
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(plan.price);
}

// A 0-price plan reads "Free", not "0 EGP / 120 months". Very long durations
// (the hidden Free plan is stored as 120 months) mean "no expiry".
function priceLabel(plan: PackagePlan, lang: LandingLang) {
  if (plan.price === 0) {
    return {
      amount: lang === "ar" ? "مجاني" : "Free",
      suffix: plan.duration_months >= 60 ? (lang === "ar" ? "للأبد" : "Forever") : formatDuration(plan.duration_months, lang),
    };
  }
  return { amount: formatPrice(plan, lang), suffix: `${plan.currency} / ${formatDuration(plan.duration_months, lang)}` };
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
            <span className={styles.price}>{priceLabel(selectedPlan, lang).amount}</span>
            <span className={styles.currency}>{priceLabel(selectedPlan, lang).suffix}</span>
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
              <span>{formatFeature(feature.feature_key, feature.feature_value, lang)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.cardFooter}>
        {locked ? null : isFree ? (
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
