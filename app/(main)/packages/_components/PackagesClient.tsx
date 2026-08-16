"use client";

import { useMemo, useState } from "react";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { MarketplacePackage } from "@/features/packages/types";
import { FREE_PACKAGE_ID } from "@/features/packages/services/package.service";
import PackageCard from "@/components/packages/PackageCard";
import BillingDurationSelector from "@/components/packages/BillingDurationSelector";
import packageStyles from "@/components/packages/PackagePricing.module.css";
import styles from "./PackagesPage.module.css";

const BILLING_DURATIONS = [1, 12];

function choosePlan(pkg: MarketplacePackage, duration: number) {
  return pkg.plans.find((plan) => plan.is_active && plan.duration_months === duration)
    ?? pkg.plans.find((plan) => plan.is_active)
    ?? null;
}

export default function PackagesClient({
  initialPackages,
  freePackage,
}: {
  initialPackages: MarketplacePackage[];
  freePackage: MarketplacePackage | null;
}) {
  const { lang } = useSite();
  const [duration, setDuration] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState(
    freePackage?.id ?? initialPackages[0]?.id ?? null,
  );

  const visiblePackages = useMemo(() => initialPackages.slice(0, 3), [initialPackages]);
  const cards = useMemo(
    () => [
      ...(freePackage ? [{ pkg: freePackage, locked: false, isFree: true }] : []),
      ...visiblePackages.map((pkg) => ({ pkg, locked: pkg.id !== FREE_PACKAGE_ID, isFree: false })),
    ],
    [freePackage, visiblePackages],
  );

  const availableDurations = useMemo(
    () => [
      ...new Set(
        cards.flatMap(({ pkg }) => (
          pkg.plans
            .filter((plan) => plan.is_active && BILLING_DURATIONS.includes(plan.duration_months))
            .map((plan) => plan.duration_months)
        )),
      ),
    ].sort((a, b) => a - b),
    [cards],
  );
  const selectedDuration = availableDurations.includes(duration) ? duration : availableDurations[0] ?? 1;

  return (
    <div className={styles.page} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className={styles.container}>
        <section className={styles.hero} aria-labelledby="packages-title">
          <div className={styles.heroCopy}>
            <span className={styles.badge}>
              <Sparkles size={16} />
              {lang === "ar" ? "Plans & Pricing" : "Plans & Pricing"}
            </span>
            <h1 id="packages-title">
              {lang === "ar" ? (
                <>اختر الخطة المناسبة <em>لنمو حسابك</em></>
              ) : (
                <>Choose the plan that fits <em>your next stage</em></>
              )}
            </h1>
            <p>
              {lang === "ar"
                ? "الباقة المجانية متاحة الآن. باقي الباقات قيد التجهيز وستتوفر قريبًا."
                : "The Free plan is available now. The other plans are being finalized and will open up soon."}
            </p>
          </div>

          <aside className={styles.summaryPanel} aria-label={lang === "ar" ? "ملخص الباقات" : "Pricing summary"}>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "عدد الخطط" : "Plans"}</span>
              <strong>{cards.length}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "الدفع" : "Billing"}</span>
              <strong>{selectedDuration === 12 ? (lang === "ar" ? "سنوي" : "Yearly") : (lang === "ar" ? "شهري" : "Monthly")}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "المتاح الآن" : "Available now"}</span>
              <strong>{lang === "ar" ? "المجانية فقط" : "Free only"}</strong>
            </div>
          </aside>
        </section>

        <section className={styles.section} aria-labelledby="available-packages">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="available-packages">{lang === "ar" ? "الباقات المتاحة" : "Available packages"}</h2>
              <p>
                {lang === "ar"
                  ? "الباقة المجانية هي باقتك الحالية. الباقات المدفوعة معروضة للاطلاع فقط حتى إطلاقها."
                  : "The Free plan is your current plan. Paid plans are shown for preview only until launch."}
              </p>
            </div>
            <div className={styles.headerControls}>
              {availableDurations.length ? (
                <div
                  className={styles.billingControl}
                  aria-label={lang === "ar" ? "مدة الاشتراك" : "Billing period"}
                >
                  <span className={styles.controlLabel}>
                    {lang === "ar" ? "اختر مدة الاشتراك" : "Choose billing period"}
                  </span>
                  <BillingDurationSelector
                    lang={lang}
                    value={selectedDuration}
                    availableDurations={availableDurations}
                    onChange={setDuration}
                  />
                </div>
              ) : null}
              <span className={styles.badge}>
                <ShieldCheck size={15} />
                {lang === "ar" ? "بياناتك بأمان" : "Your data stays safe"}
              </span>
            </div>
          </div>

          {cards.length ? (
            <div className={packageStyles.packageGrid}>
              {cards.map(({ pkg, locked, isFree }) => {
                const selectedPlan = choosePlan(pkg, selectedDuration);
                const selected = selectedPackageId === pkg.id;
                return (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    lang={lang}
                    selected={selected}
                    onSelectPackage={locked ? undefined : (item) => setSelectedPackageId(item.id)}
                    selectedPlanId={selectedPlan?.id}
                    showPlanSelector={false}
                    locked={locked}
                    isFree={isFree}
                  />
                );
              })}
            </div>
          ) : (
            <div className={packageStyles.emptyState}>
              <CreditCard size={28} />
              <h3>{lang === "ar" ? "لا توجد باقات منشورة بعد" : "No published packages yet"}</h3>
              <p>{lang === "ar" ? "أنشئ 3 باقات من لوحة التحكم لتظهر هنا." : "Create 3 packages from admin to show them here."}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
