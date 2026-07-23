"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import type { CategoryRoleType, MarketplaceCategory } from "@/features/categories/types";
import styles from "../../packages/_components/AdminPackages.module.css";

type FormState = {
  id: string;
  role_type: CategoryRoleType;
  label_ar: string;
  label_en: string;
  description: string;
  is_active: boolean;
  sort_order: number;
};

const EMPTY_FORM: FormState = {
  id: "",
  role_type: "talent",
  label_ar: "",
  label_en: "",
  description: "",
  is_active: true,
  sort_order: 0,
};

function toForm(category: MarketplaceCategory): FormState {
  return {
    id: category.id,
    role_type: category.role_type,
    label_ar: category.label_ar,
    label_en: category.label_en,
    description: category.description ?? "",
    is_active: category.is_active,
    sort_order: category.sort_order,
  };
}

export default function AdminCategoriesClient({ initialCategories }: { initialCategories: MarketplaceCategory[] }) {
  const { lang } = useSite();
  const [categories, setCategories] = useState(initialCategories);
  const [selectedId, setSelectedId] = useState<string | null>(initialCategories[0]?.id ?? null);
  const [form, setForm] = useState<FormState>(initialCategories[0] ? toForm(initialCategories[0]) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => categories.find((category) => category.id === selectedId) ?? null,
    [categories, selectedId],
  );

  const tx = {
    title: lang === "ar" ? "إدارة التصنيفات" : "Categories Management",
    list: lang === "ar" ? "التصنيفات" : "Categories",
    editor: lang === "ar" ? "تفاصيل التصنيف" : "Category details",
    newCategory: lang === "ar" ? "تصنيف جديد" : "New category",
    id: lang === "ar" ? "المفتاح" : "Key",
    role: lang === "ar" ? "نوع الحساب" : "Role type",
    labelAr: lang === "ar" ? "الاسم العربي" : "Arabic label",
    labelEn: lang === "ar" ? "الاسم الإنجليزي" : "English label",
    description: lang === "ar" ? "الوصف" : "Description",
    sort: lang === "ar" ? "الترتيب" : "Sort order",
    active: lang === "ar" ? "فعال" : "Active",
    inactive: lang === "ar" ? "غير فعال" : "Inactive",
    save: lang === "ar" ? "حفظ التصنيف" : "Save category",
    activate: lang === "ar" ? "تفعيل" : "Activate",
    deactivate: lang === "ar" ? "تعطيل" : "Deactivate",
  };

  function startNew() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setMessage(null);
  }

  async function saveCategory() {
    setSaving(true);
    setMessage(null);
    try {
      const url = selectedId ? `/api/admin/categories/${selectedId}` : "/api/admin/categories";
      const res = await fetch(url, {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      const saved = data.category as MarketplaceCategory;
      setCategories((current) => {
        const exists = current.some((category) => category.id === saved.id);
        return exists
          ? current.map((category) => category.id === saved.id ? saved : category)
          : [...current, saved].sort((a, b) => a.sort_order - b.sort_order);
      });
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setMessage({ type: "success", text: lang === "ar" ? "تم حفظ التصنيف." : "Category saved." });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  }

  async function setActive(category: MarketplaceCategory, isActive: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_active", is_active: isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      setCategories((current) => current.map((item) => item.id === category.id ? { ...item, is_active: isActive } : item));
      if (selectedId === category.id) setForm((current) => ({ ...current, is_active: isActive }));
      setMessage({ type: "success", text: isActive ? tx.activate : tx.deactivate });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not update status" });
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
              <p className={styles.muted}>{categories.length} {tx.list}</p>
            </div>
            <button className={styles.secondaryButton} type="button" onClick={startNew}>{tx.newCategory}</button>
          </div>

          <div className={styles.list}>
            {categories.map((category) => (
              <button
                className={`${styles.packageButton} ${selectedId === category.id ? styles.packageButtonActive : ""}`}
                key={category.id}
                type="button"
                onClick={() => {
                  setSelectedId(category.id);
                  setForm(toForm(category));
                  setMessage(null);
                }}
              >
                <strong>{lang === "ar" ? category.label_ar : category.label_en}</strong>
                <span className={styles.metaRow}>
                  <span className={`${styles.pill} ${category.is_active ? styles.pillActive : ""}`}>
                    {category.is_active ? tx.active : tx.inactive}
                  </span>
                  <span>{category.role_type}</span>
                  <span>{category.id}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{tx.editor}</h3>
              <p className={styles.muted}>{selected ? selected.id : tx.newCategory}</p>
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
                <label>{tx.id}</label>
                <input
                  disabled={Boolean(selectedId)}
                  value={form.id}
                  onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>{tx.role}</label>
                <select
                  value={form.role_type}
                  onChange={(event) => setForm((current) => ({ ...current, role_type: event.target.value as CategoryRoleType }))}
                >
                  <option value="talent">Talent</option>
                  <option value="brand">Brand</option>
                </select>
              </div>
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label>{tx.labelAr}</label>
                <input value={form.label_ar} onChange={(event) => setForm((current) => ({ ...current, label_ar: event.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>{tx.labelEn}</label>
                <input value={form.label_en} onChange={(event) => setForm((current) => ({ ...current, label_en: event.target.value }))} />
              </div>
            </div>

            <div className={styles.field}>
              <label>{tx.description}</label>
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.field}>
                <label>{tx.sort}</label>
                <input type="number" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} />
              </div>
              <label className={styles.checkboxLabel}>
                <input checked={form.is_active} type="checkbox" onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
                {tx.active}
              </label>
            </div>

            {message ? (
              <div className={`${styles.status} ${message.type === "success" ? styles.success : styles.error}`} role="status">
                {message.text}
              </div>
            ) : null}

            <div className={styles.actions}>
              <button className={styles.primaryButton} disabled={saving} type="button" onClick={saveCategory}>
                {saving ? (lang === "ar" ? "جاري الحفظ..." : "Saving...") : tx.save}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={startNew}>{tx.newCategory}</button>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
