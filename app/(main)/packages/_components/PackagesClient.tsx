"use client";

import { useMemo, useState } from "react";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { MarketplacePackage, PackagePlan, TalentType } from "@/features/packages/types";
import type { MarketplaceCategory } from "@/features/categories/types";
import PackageCard from "@/components/packages/PackageCard";
import BillingDurationSelector from "@/components/packages/BillingDurationSelector";
import FeatureComparison from "@/components/packages/FeatureComparison";
import PackageSkeleton from "@/components/packages/PackageSkeleton";
import packageStyles from "@/components/packages/PackagePricing.module.css";
import styles from "./PackagesPage.module.css";

type PackageAudienceOption = Pick<TalentType, "id" | "label_ar" | "label_en">;

function labelFor(type: PackageAudienceOption, lang: "ar" | "en") {
  return lang === "ar" ? type.label_ar : type.label_en;
}

function choosePlan(pkg: MarketplacePackage, duration: number) {
  return pkg.plans.find((plan) => plan.is_active && plan.duration_months === duration)
    ?? pkg.plans.find((plan) => plan.is_active)
    ?? null;
}

export default function PackagesClient({
  talentTypes,
  categories,
  initialTalentType,
  initialPackages,
}: {
  talentTypes: TalentType[];
  categories: MarketplaceCategory[];
  initialTalentType: string;
  initialPackages: MarketplacePackage[];
}) {
  const { lang } = useSite();
  const [activeType, setActiveType] = useState(initialTalentType);
  const [packages, setPackages] = useState(initialPackages);
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const audienceOptions = useMemo<PackageAudienceOption[]>(
    () => categories.length
      ? categories.map((category) => ({
        id: category.id,
        label_ar: category.label_ar,
        label_en: category.role_type === "brand" ? `${category.label_en} - Brand` : category.label_en,
      }))
      : talentTypes,
    [categories, talentTypes],
  );
  const activeLabel = audienceOptions.find((type) => type.id === activeType);
  const availableDurations = useMemo(
    () => [...new Set(packages.flatMap((pkg) => pkg.plans.filter((plan) => plan.is_active).map((plan) => plan.duration_months)))].sort((a, b) => a - b),
    [packages],
  );

  async function loadPackages(type: string) {
    setActiveType(type);
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/packages?categoryId=${encodeURIComponent(type)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load packages");
      setPackages(data.packages ?? []);
      const nextDurations = [
        ...new Set((data.packages ?? []).flatMap((pkg: MarketplacePackage) => pkg.plans.map((plan) => plan.duration_months))),
      ].sort((a, b) => Number(a) - Number(b));
      setDuration(Number(nextDurations[0] ?? 1));
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : lang === "ar" ? "تعذر تحميل الباقات" : "Could not load packages",
      });
    } finally {
      setLoading(false);
    }
  }

  async function subscribe(plan: PackagePlan) {
    setSubmittingPlan(plan.id);
    setMessage(null);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          talentType: activeType,
          audience: categories.find((category) => category.id === activeType)?.role_type ?? "talent",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      setMessage({
        type: "success",
        text: lang === "ar" ? "تم تفعيل اشتراكك بنجاح." : "Your subscription is now active.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : lang === "ar" ? "تعذر إنشاء الاشتراك" : "Could not create subscription",
      });
    } finally {
      setSubmittingPlan(null);
    }
  }

  return (
    <div className={styles.page} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className={styles.container}>
        <section className={styles.hero} aria-labelledby="packages-title">
          <div className={styles.heroCopy}>
            <span className={styles.badge}>
              <Sparkles size={16} />
              {lang === "ar" ? "باقات موجهة حسب نوع الموهبة" : "Targeted talent packages"}
            </span>
            <h1 id="packages-title">
              {lang === "ar" ? (
                <>اختر الباقة المناسبة <em>لنمو حسابك</em></>
              ) : (
                <>Choose the package that fits <em>your account type</em></>
              )}
            </h1>
            <p>
              {lang === "ar"
                ? "كل باقة تظهر فقط للمواهب المناسبة لها، مع مدد اشتراك واضحة ومميزات قابلة للتوسع."
                : "Every package is shown only to matching account types, with clear billing durations and scalable feature limits."}
            </p>
          </div>

          <aside className={styles.summaryPanel} aria-label={lang === "ar" ? "ملخص الاختيار" : "Selection summary"}>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "نوع الحساب" : "Account type"}</span>
              <strong>{activeLabel ? labelFor(activeLabel, lang) : activeType}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "الباقات المتاحة" : "Available packages"}</span>
              <strong>{packages.length}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "التفعيل" : "Activation"}</span>
              <strong>{lang === "ar" ? "فوري" : "Immediate"}</strong>
            </div>
          </aside>
        </section>

        <section className={styles.controls} aria-label={lang === "ar" ? "اختيارات الباقات" : "Package controls"}>
          <p className={styles.controlLabel}>{lang === "ar" ? "اختر نوع الحساب" : "Choose account type"}</p>
          <div className={packageStyles.typeTabs} role="tablist">
            {audienceOptions.map((type) => (
              <button
                className={`${packageStyles.typeTab} ${activeType === type.id ? packageStyles.tabActive : ""}`}
                key={type.id}
                type="button"
                role="tab"
                aria-selected={activeType === type.id}
                onClick={() => loadPackages(type.id)}
              >
                {labelFor(type, lang)}
              </button>
            ))}
          </div>

          {availableDurations.length ? (
            <>
              <p className={styles.controlLabel}>{lang === "ar" ? "اختر مدة الاشتراك" : "Choose billing duration"}</p>
              <BillingDurationSelector
                lang={lang}
                value={duration}
                availableDurations={availableDurations}
                onChange={setDuration}
              />
            </>
          ) : null}

          {message ? (
            <div className={`${styles.status} ${message.type === "success" ? styles.success : styles.error}`} role="status">
              {message.text}
            </div>
          ) : null}
        </section>

        <section className={styles.section} aria-labelledby="available-packages">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="available-packages">{lang === "ar" ? "الباقات المتاحة" : "Available packages"}</h2>
              <p>
                {lang === "ar"
                  ? "اختر الخطة، راجع المميزات، ثم فعّل الاشتراك."
                  : "Choose a plan, compare features, then activate your subscription."}
              </p>
            </div>
          </div>

          {loading ? (
            <PackageSkeleton />
          ) : packages.length ? (
            <div className={packageStyles.packageGrid}>
              {packages.map((pkg) => {
                const selectedPlan = choosePlan(pkg, duration);
                return (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    lang={lang}
                    selectedPlanId={selectedPlan?.id}
                    onSubscribe={subscribe}
                    subscribing={submittingPlan === selectedPlan?.id}
                  />
                );
              })}
            </div>
          ) : (
            <div className={packageStyles.emptyState}>
              <CreditCard size={28} />
              <h3>{lang === "ar" ? "لا توجد باقات لهذا النوع" : "No packages for this type yet"}</h3>
              <p>{lang === "ar" ? "جرّب نوع حساب آخر أو راجع الإدارة لاحقًا." : "Try another account type or check back later."}</p>
            </div>
          )}
        </section>

        {packages.length ? (
          <section className={styles.section} aria-labelledby="feature-comparison">
            <div className={styles.sectionHeader}>
              <div>
                <h2 id="feature-comparison">{lang === "ar" ? "مقارنة المميزات" : "Feature comparison"}</h2>
                <p>{lang === "ar" ? "راجع حدود كل باقة قبل الاشتراك." : "Review each package limit before subscribing."}</p>
              </div>
              <span className={styles.badge}>
                <ShieldCheck size={15} />
                {lang === "ar" ? "اشتراك آمن" : "Safe subscription"}
              </span>
            </div>
            <FeatureComparison packages={packages} lang={lang} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
