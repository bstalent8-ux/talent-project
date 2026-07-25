"use client";

import { useMemo, useState } from "react";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { useSite } from "@/contexts/SiteContext";
import type { MarketplacePackage, PackagePlan } from "@/features/packages/types";
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

function packageAudience(pkg: MarketplacePackage) {
  const categoryTarget = pkg.categories.find((item) => item.category?.role_type) ?? pkg.categories[0];
  return {
    talentType: categoryTarget?.category_id ?? null,
    audience: categoryTarget?.category?.role_type ?? "talent",
  };
}

export default function PackagesClient({
  initialPackages,
}: {
  initialPackages: MarketplacePackage[];
}) {
  const { lang } = useSite();
  const [duration, setDuration] = useState(1);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState(initialPackages[0]?.id ?? null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const visiblePackages = useMemo(() => initialPackages.slice(0, 3), [initialPackages]);
  const availableDurations = useMemo(
    () => [
      ...new Set(
        visiblePackages.flatMap((pkg) => (
          pkg.plans
            .filter((plan) => plan.is_active && BILLING_DURATIONS.includes(plan.duration_months))
            .map((plan) => plan.duration_months)
        )),
      ),
    ].sort((a, b) => a - b),
    [visiblePackages],
  );
  const selectedDuration = availableDurations.includes(duration) ? duration : availableDurations[0] ?? 1;

  async function subscribe(plan: PackagePlan, pkg: MarketplacePackage) {
    setSubmittingPlan(plan.id);
    setMessage(null);
    const audience = packageAudience(pkg);

    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          talentType: audience.talentType,
          audience: audience.audience,
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
                ? "ثلاث خطط واضحة للمقارنة السريعة، مع تبديل مباشر بين الدفع الشهري والسنوي."
                : "Three clear plans for quick comparison, with a simple monthly or yearly billing switch."}
            </p>
          </div>

          <aside className={styles.summaryPanel} aria-label={lang === "ar" ? "ملخص الباقات" : "Pricing summary"}>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "عدد الخطط" : "Plans"}</span>
              <strong>{visiblePackages.length}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "الدفع" : "Billing"}</span>
              <strong>{selectedDuration === 12 ? (lang === "ar" ? "سنوي" : "Yearly") : (lang === "ar" ? "شهري" : "Monthly")}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>{lang === "ar" ? "التفعيل" : "Activation"}</span>
              <strong>{lang === "ar" ? "فوري" : "Immediate"}</strong>
            </div>
          </aside>
        </section>

        <section className={styles.section} aria-labelledby="available-packages">
          <div className={styles.sectionHeader}>
            <div>
              <h2 id="available-packages">{lang === "ar" ? "الباقات المتاحة" : "Available packages"}</h2>
              <p>
                {lang === "ar"
                  ? "اضغط على أي كارت لاختياره؛ الكارت المختار يظهر أكبر وبألوان البراند."
                  : "Select any card to highlight it with the brand colors and a slightly larger size."}
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
                {lang === "ar" ? "اشتراك آمن" : "Safe subscription"}
              </span>
            </div>
          </div>

          {message ? (
            <div className={`${styles.status} ${message.type === "success" ? styles.success : styles.error}`} role="status">
              {message.text}
            </div>
          ) : null}

          {visiblePackages.length ? (
            <div className={packageStyles.packageGrid}>
              {visiblePackages.map((pkg) => {
                const selectedPlan = choosePlan(pkg, selectedDuration);
                const selected = selectedPackageId === pkg.id;
                return (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    lang={lang}
                    selected={selected}
                    onSelectPackage={(item) => setSelectedPackageId(item.id)}
                    selectedPlanId={selectedPlan?.id}
                    onSubscribe={subscribe}
                    showPlanSelector={false}
                    subscribing={submittingPlan === selectedPlan?.id}
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
