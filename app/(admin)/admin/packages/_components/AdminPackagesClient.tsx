"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import type { MarketplacePackage, TalentType } from "@/features/packages/types";
import styles from "./AdminPackages.module.css";

type PlanDraft = {
  duration_months: number;
  price: number;
  currency: string;
  is_active: boolean;
};

type FeatureDraft = {
  feature_key: string;
  feature_value: string;
};

type FormState = {
  name: string;
  description: string;
  is_active: boolean;
  target_ids: string[];
  plans: PlanDraft[];
  features: FeatureDraft[];
};

type TargetOption = Pick<TalentType, "id" | "label_ar" | "label_en">;

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  is_active: true,
  target_ids: ["all_talents"],
  plans: [
    { duration_months: 1, price: 0, currency: "EGP", is_active: true },
    { duration_months: 3, price: 0, currency: "EGP", is_active: true },
    { duration_months: 6, price: 0, currency: "EGP", is_active: true },
    { duration_months: 12, price: 0, currency: "EGP", is_active: true },
  ],
  features: [
    { feature_key: "max_campaign_requests", feature_value: "50" },
    { feature_key: "portfolio_limit", feature_value: "50" },
    { feature_key: "featured_profile", feature_value: "true" },
  ],
};

function toForm(pkg: MarketplacePackage): FormState {
  return {
    name: pkg.name,
    description: pkg.description ?? "",
    is_active: pkg.is_active,
    target_ids: pkg.targets.map(targetValue),
    plans: pkg.plans.map((plan) => ({
      duration_months: plan.duration_months,
      price: plan.price,
      currency: plan.currency,
      is_active: plan.is_active,
    })),
    features: pkg.features.map((feature) => ({
      feature_key: feature.feature_key,
      feature_value: feature.feature_value,
    })),
  };
}

function targetValue(target: MarketplacePackage["targets"][number]) {
  if (target.target_type === "all_talents") return "all_talents";
  if (target.target_type === "role" && target.target_id === "brand") return "brand";
  return target.target_id;
}

const allTalentsTarget: TargetOption = {
  id: "all_talents",
  label_ar: "كل أنواع المواهب",
  label_en: "All talent types",
};

const brandTarget: TargetOption = {
  id: "brand",
  label_ar: "البراندات",
  label_en: "Brands",
};

function labelFor(type: TargetOption, lang: "ar" | "en") {
  return lang === "ar" ? type.label_ar : type.label_en;
}

export default function AdminPackagesClient({
  initialPackages,
  talentTypes,
}: {
  initialPackages: MarketplacePackage[];
  talentTypes: TalentType[];
}) {
  const { lang } = useSite();
  const [packages, setPackages] = useState(initialPackages);
  const [selectedId, setSelectedId] = useState<string | null>(initialPackages[0]?.id ?? null);
  const [form, setForm] = useState<FormState>(initialPackages[0] ? toForm(initialPackages[0]) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => packages.find((pkg) => pkg.id === selectedId) ?? null,
    [packages, selectedId],
  );
  const targetOptions = useMemo<TargetOption[]>(
    () => [allTalentsTarget, ...talentTypes, brandTarget],
    [talentTypes],
  );

  const tx = {
    title: lang === "ar" ? "إدارة الباقات" : "Packages Management",
    newPackage: lang === "ar" ? "باقة جديدة" : "New package",
    list: lang === "ar" ? "الباقات" : "Packages",
    editor: lang === "ar" ? "تفاصيل الباقة" : "Package details",
    name: lang === "ar" ? "اسم الباقة" : "Package name",
    description: lang === "ar" ? "الوصف" : "Description",
    active: lang === "ar" ? "فعالة" : "Active",
    inactive: lang === "ar" ? "غير فعالة" : "Inactive",
    targets: lang === "ar" ? "أنواع المواهب المستهدفة" : "Target talent types",
    plans: lang === "ar" ? "مدد وأسعار الاشتراك" : "Billing durations and prices",
    features: lang === "ar" ? "المميزات" : "Features",
    duration: lang === "ar" ? "المدة بالشهور" : "Months",
    price: lang === "ar" ? "السعر" : "Price",
    currency: lang === "ar" ? "العملة" : "Currency",
    key: lang === "ar" ? "مفتاح الميزة" : "Feature key",
    value: lang === "ar" ? "القيمة" : "Value",
    save: lang === "ar" ? "حفظ الباقة" : "Save package",
    addPlan: lang === "ar" ? "إضافة مدة" : "Add plan",
    addFeature: lang === "ar" ? "إضافة ميزة" : "Add feature",
    remove: lang === "ar" ? "حذف" : "Remove",
    deactivate: lang === "ar" ? "تعطيل" : "Deactivate",
    activate: lang === "ar" ? "تفعيل" : "Activate",
    empty: lang === "ar" ? "لا توجد باقات بعد" : "No packages yet",
  };

  function startNew() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setMessage(null);
  }

  function selectPackage(pkg: MarketplacePackage) {
    setSelectedId(pkg.id);
    setForm(toForm(pkg));
    setMessage(null);
  }

  function toggleTarget(id: string) {
    setForm((current) => {
      const exists = current.target_ids.includes(id);
      const target_ids = exists
        ? current.target_ids.filter((target) => target !== id)
        : [...current.target_ids, id];
      return { ...current, target_ids };
    });
  }

  function updatePlan(index: number, patch: Partial<PlanDraft>) {
    setForm((current) => ({
      ...current,
      plans: current.plans.map((plan, i) => i === index ? { ...plan, ...patch } : plan),
    }));
  }

  function updateFeature(index: number, patch: Partial<FeatureDraft>) {
    setForm((current) => ({
      ...current,
      features: current.features.map((feature, i) => i === index ? { ...feature, ...patch } : feature),
    }));
  }

  async function savePackage() {
    setSaving(true);
    setMessage(null);
    try {
      const url = selectedId ? `/api/admin/packages/${selectedId}` : "/api/admin/packages";
      const res = await fetch(url, {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      const saved = data.package as MarketplacePackage;
      setPackages((current) => {
        const exists = current.some((pkg) => pkg.id === saved.id);
        return exists ? current.map((pkg) => pkg.id === saved.id ? saved : pkg) : [saved, ...current];
      });
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage({ type: "success", text: lang === "ar" ? "تم حفظ الباقة." : "Package saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : lang === "ar" ? "تعذر الحفظ" : "Could not save",
      });
    } finally {
      setSaving(false);
    }
  }

  async function setActive(pkg: MarketplacePackage, isActive: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_active", is_active: isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      setPackages((current) => current.map((item) => item.id === pkg.id ? { ...item, is_active: isActive } : item));
      if (selectedId === pkg.id) setForm((current) => ({ ...current, is_active: isActive }));
      setMessage({ type: "success", text: isActive ? tx.activate : tx.deactivate });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : lang === "ar" ? "تعذر تحديث الحالة" : "Could not update status",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title={tx.title}>
      <div className={styles.layout} dir={lang === "ar" ? "rtl" : "ltr"}>
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>{tx.list}</h2>
              <p className={styles.muted}>{packages.length} {tx.list}</p>
            </div>
            <button className={styles.secondaryButton} type="button" onClick={startNew}>
              {tx.newPackage}
            </button>
          </div>

          <div className={styles.list}>
            {packages.length === 0 ? <p className={styles.muted}>{tx.empty}</p> : null}
            {packages.map((pkg) => (
              <button
                className={`${styles.packageButton} ${selectedId === pkg.id ? styles.packageButtonActive : ""}`}
                key={pkg.id}
                type="button"
                onClick={() => selectPackage(pkg)}
              >
                <strong>{pkg.name}</strong>
                <span className={styles.metaRow}>
                  <span className={`${styles.pill} ${pkg.is_active ? styles.pillActive : ""}`}>
                    {pkg.is_active ? tx.active : tx.inactive}
                  </span>
                  <span>{pkg.targets.length} targets</span>
                  <span>{pkg.plans.length} plans</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{tx.editor}</h3>
              <p className={styles.muted}>{selected ? selected.name : tx.newPackage}</p>
            </div>
            {selected ? (
              <button
                className={selected.is_active ? styles.dangerButton : styles.secondaryButton}
                disabled={saving}
                type="button"
                onClick={() => setActive(selected, !selected.is_active)}
              >
                {selected.is_active ? tx.deactivate : tx.activate}
              </button>
            ) : null}
          </div>

          <div className={styles.form}>
            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label htmlFor="package-name">{tx.name}</label>
                <input
                  id="package-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  checked={form.is_active}
                  type="checkbox"
                  onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                {tx.active}
              </label>
            </div>

            <div className={styles.field}>
              <label htmlFor="package-description">{tx.description}</label>
              <textarea
                id="package-description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>

            <div>
              <p className={styles.groupTitle}>{tx.targets}</p>
              <div className={styles.checkboxGrid}>
                {targetOptions.map((type) => (
                  <label className={styles.checkboxLabel} key={type.id}>
                    <input
                      checked={form.target_ids.includes(type.id)}
                      type="checkbox"
                      onChange={() => toggleTarget(type.id)}
                    />
                    {labelFor(type, lang)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.panelHeader}>
                <div>
                  <h3>{tx.plans}</h3>
                </div>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setForm((current) => ({
                    ...current,
                    plans: [...current.plans, { duration_months: 1, price: 0, currency: "EGP", is_active: true }],
                  }))}
                >
                  {tx.addPlan}
                </button>
              </div>
              <div className={styles.rowList}>
                {form.plans.map((plan, index) => (
                  <div className={styles.draftRow} key={index}>
                    <div className={styles.field}>
                      <label>{tx.duration}</label>
                      <input
                        min={1}
                        type="number"
                        value={plan.duration_months}
                        onChange={(event) => updatePlan(index, { duration_months: Number(event.target.value) })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>{tx.price}</label>
                      <input
                        min={0}
                        type="number"
                        value={plan.price}
                        onChange={(event) => updatePlan(index, { price: Number(event.target.value) })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>{tx.currency}</label>
                      <input
                        value={plan.currency}
                        onChange={(event) => updatePlan(index, { currency: event.target.value })}
                      />
                    </div>
                    <label className={styles.checkboxLabel}>
                      <input
                        checked={plan.is_active}
                        type="checkbox"
                        onChange={(event) => updatePlan(index, { is_active: event.target.checked })}
                      />
                      {tx.active}
                    </label>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, plans: current.plans.filter((_, i) => i !== index) }))}
                    >
                      {tx.remove}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className={styles.panelHeader}>
                <div>
                  <h3>{tx.features}</h3>
                </div>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => setForm((current) => ({
                    ...current,
                    features: [...current.features, { feature_key: "", feature_value: "" }],
                  }))}
                >
                  {tx.addFeature}
                </button>
              </div>
              <div className={styles.rowList}>
                {form.features.map((feature, index) => (
                  <div className={`${styles.draftRow} ${styles.featureRow}`} key={index}>
                    <div className={styles.field}>
                      <label>{tx.key}</label>
                      <input
                        value={feature.feature_key}
                        onChange={(event) => updateFeature(index, { feature_key: event.target.value })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>{tx.value}</label>
                      <input
                        value={feature.feature_value}
                        onChange={(event) => updateFeature(index, { feature_value: event.target.value })}
                      />
                    </div>
                    <button
                      className={styles.iconButton}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, features: current.features.filter((_, i) => i !== index) }))}
                    >
                      {tx.remove}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {message ? (
              <div className={`${styles.status} ${message.type === "success" ? styles.success : styles.error}`} role="status">
                {message.text}
              </div>
            ) : null}

            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={saving} type="button" onClick={savePackage}>
                {saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : tx.save}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={startNew}>
                {tx.newPackage}
              </button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
