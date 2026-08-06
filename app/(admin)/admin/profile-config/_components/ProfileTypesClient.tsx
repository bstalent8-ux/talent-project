"use client";

// ─── Profile Types management ─────────────────────────────────────────────────
// Master–detail two-panel screen, matching AdminCategoriesClient exactly:
// same CSS module, same optimistic-state pattern, same status banner.
//
// slug / core_table / provider_key are shown read-only. They are code-owned and
// the API rejects them regardless of what this form sends.

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import type { ProfileTypeSummary } from "@/features/profiles/services/profile-config.service";
import styles from "../../packages/_components/AdminPackages.module.css";
import { requestJson } from "./config-api";

type FormState = {
  name:         string;
  name_ar:      string;
  name_en:      string;
  description:  string;
  route_prefix: string;
  is_active:    boolean;
  is_bookable:  boolean;
  sort_order:   number;
};

function toForm(type: ProfileTypeSummary): FormState {
  return {
    name:         type.name ?? "",
    name_ar:      type.name_ar ?? "",
    name_en:      type.name_en ?? "",
    description:  type.description ?? "",
    route_prefix: type.route_prefix ?? "",
    is_active:    type.is_active,
    is_bookable:  type.is_bookable,
    sort_order:   type.sort_order ?? 0,
  };
}

export default function ProfileTypesClient({ initialTypes }: { initialTypes: ProfileTypeSummary[] }) {
  const { lang } = useSite();
  const ar = lang === "ar";

  const [types, setTypes]           = useState(initialTypes);
  const [selectedId, setSelectedId] = useState<string | null>(initialTypes[0]?.id ?? null);
  const [form, setForm]             = useState<FormState>(
    initialTypes[0] ? toForm(initialTypes[0]) : {
      name: "", name_ar: "", name_en: "", description: "",
      route_prefix: "", is_active: false, is_bookable: false, sort_order: 0,
    },
  );
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => types.find((type) => type.id === selectedId) ?? null,
    [types, selectedId],
  );

  const tx = {
    title:        ar ? "إعدادات الملفات" : "Profile Configuration",
    list:         ar ? "أنواع الملفات" : "Profile types",
    editor:       ar ? "تفاصيل النوع" : "Type details",
    slug:         ar ? "المعرّف البرمجي" : "Slug",
    name:         ar ? "الاسم الداخلي" : "Internal name",
    nameAr:       ar ? "الاسم العربي" : "Arabic name",
    nameEn:       ar ? "الاسم الإنجليزي" : "English name",
    description:  ar ? "الوصف" : "Description",
    routePrefix:  ar ? "بادئة الرابط" : "Route prefix",
    sort:         ar ? "الترتيب" : "Sort order",
    active:       ar ? "مفعّل" : "Active",
    inactive:     ar ? "غير مفعّل" : "Inactive",
    bookable:     ar ? "قابل للحجز" : "Bookable",
    activate:     ar ? "تفعيل" : "Activate",
    deactivate:   ar ? "تعطيل" : "Deactivate",
    save:         ar ? "حفظ النوع" : "Save type",
    saving:       ar ? "جاري الحفظ..." : "Saving...",
    sections:     ar ? "الأقسام ←" : "Sections →",
    coreTable:    ar ? "الجدول الأساسي" : "Core table",
    providerKey:  ar ? "مفتاح المزوّد" : "Provider key",
    readOnly:     ar ? "للقراءة فقط — يُدار من الكود" : "Read-only — owned by application code",
    profiles:     ar ? "ملف" : "profiles",
    providerOk:   ar ? "المزوّد مسجّل" : "Provider registered",
    providerNone: ar ? "لا يوجد مزوّد — لا يمكن التفعيل" : "No provider — cannot be activated",
    cacheNote:    ar
      ? "تظهر التغييرات لجميع المستخدمين خلال 5 دقائق."
      : "Changes appear for all users within 5 minutes.",
    saved:        ar ? "تم حفظ النوع." : "Type saved.",
    noTypes:      ar ? "لا توجد أنواع ملفات." : "No profile types.",
  };

  function select(type: ProfileTypeSummary) {
    setSelectedId(type.id);
    setForm(toForm(type));
    setMessage(null);
  }

  function applyUpdate(updated: ProfileTypeSummary | Record<string, unknown>) {
    const next = updated as ProfileTypeSummary;
    setTypes((current) =>
      current.map((type) => (type.id === next.id ? { ...type, ...next } : type)),
    );
  }

  async function saveType() {
    if (!selectedId) return;
    setSaving(true);
    setMessage(null);
    try {
      const data = await requestJson<{ type: ProfileTypeSummary }>(
        `/api/admin/profile-config/types/${selectedId}`,
        {
          method: "PATCH",
          body: {
            name:         form.name,
            name_ar:      form.name_ar || null,
            name_en:      form.name_en || null,
            description:  form.description || null,
            route_prefix: form.route_prefix || null,
            is_active:    form.is_active,
            is_bookable:  form.is_bookable,
            sort_order:   form.sort_order,
          },
        },
        ar ? "تعذّر الحفظ" : "Save failed",
      );

      applyUpdate(data.type);
      setForm(toForm({ ...(selected as ProfileTypeSummary), ...data.type }));
      setMessage({ type: "success", text: tx.saved });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function setActive(type: ProfileTypeSummary, isActive: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const data = await requestJson<{ type: ProfileTypeSummary }>(
        `/api/admin/profile-config/types/${type.id}`,
        { method: "PATCH", body: { action: "set_active", is_active: isActive } },
        ar ? "تعذّر تحديث الحالة" : "Status update failed",
      );

      applyUpdate(data.type);
      if (selectedId === type.id) setForm((current) => ({ ...current, is_active: isActive }));
      setMessage({ type: "success", text: isActive ? tx.activate : tx.deactivate });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title={tx.title}>
      <div className={styles.layout} dir={ar ? "rtl" : "ltr"}>
        {/* ── List ─────────────────────────────────────────────────────── */}
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>{tx.list}</h2>
              <p className={styles.muted}>{types.length} {tx.list}</p>
            </div>
          </div>

          <div className={styles.list}>
            {types.length === 0 ? (
              <p className={styles.muted}>{tx.noTypes}</p>
            ) : types.map((type) => (
              <button
                className={`${styles.packageButton} ${selectedId === type.id ? styles.packageButtonActive : ""}`}
                key={type.id}
                type="button"
                onClick={() => select(type)}
              >
                <strong>{ar ? (type.name_ar ?? type.name) : (type.name_en ?? type.name)}</strong>
                <span className={styles.metaRow}>
                  <span className={`${styles.pill} ${type.is_active ? styles.pillActive : ""}`}>
                    {type.is_active ? tx.active : tx.inactive}
                  </span>
                  {type.is_bookable ? <span className={styles.pill}>{tx.bookable}</span> : null}
                  <span>{type.slug}</span>
                  <span>/{type.route_prefix ?? type.slug}</span>
                  <span>{type.profileCount} {tx.profiles}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Editor ───────────────────────────────────────────────────── */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{tx.editor}</h3>
              <p className={styles.muted}>{selected ? selected.slug : "—"}</p>
            </div>
            {selected ? (
              <div className={styles.actions}>
                <Link
                  className={styles.secondaryButton}
                  href={`/admin/profile-config/types/${selected.id}`}
                  style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                >
                  {tx.sections}
                </Link>
                <button
                  className={selected.is_active ? styles.dangerButton : styles.secondaryButton}
                  disabled={saving || (!selected.is_active && !selected.providerRegistered)}
                  type="button"
                  onClick={() => setActive(selected, !selected.is_active)}
                >
                  {selected.is_active ? tx.deactivate : tx.activate}
                </button>
              </div>
            ) : null}
          </div>

          {selected ? (
            <div className={styles.form}>
              {/* Code-owned, read-only. */}
              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.slug}</label>
                  <input disabled value={selected.slug} readOnly />
                </div>
                <div className={styles.field}>
                  <label>{tx.coreTable}</label>
                  <input disabled value={selected.core_table ?? "—"} readOnly />
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.providerKey}</label>
                  <input disabled value={selected.provider_key ?? "—"} readOnly />
                </div>
                <div className={styles.field}>
                  <label>&nbsp;</label>
                  <span className={`${styles.pill} ${selected.providerRegistered ? styles.pillActive : ""}`}>
                    {selected.providerRegistered ? tx.providerOk : tx.providerNone}
                  </span>
                </div>
              </div>

              <p className={styles.muted}>{tx.readOnly}</p>

              {/* Editable. */}
              <div className={styles.field}>
                <label>{tx.name}</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.nameAr}</label>
                  <input
                    value={form.name_ar}
                    onChange={(event) => setForm((current) => ({ ...current, name_ar: event.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>{tx.nameEn}</label>
                  <input
                    value={form.name_en}
                    onChange={(event) => setForm((current) => ({ ...current, name_en: event.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>{tx.description}</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.routePrefix}</label>
                  <input
                    value={form.route_prefix}
                    onChange={(event) => setForm((current) => ({ ...current, route_prefix: event.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>{tx.sort}</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className={styles.checkboxGrid}>
                <label className={styles.checkboxLabel}>
                  <input
                    checked={form.is_active}
                    disabled={!selected.providerRegistered}
                    type="checkbox"
                    onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                  />
                  {tx.active}
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    checked={form.is_bookable}
                    disabled={!selected.providerBookable}
                    type="checkbox"
                    onChange={(event) => setForm((current) => ({ ...current, is_bookable: event.target.checked }))}
                  />
                  {tx.bookable}
                </label>
              </div>

              {!selected.providerRegistered ? (
                <div className={`${styles.status} ${styles.error}`} role="status">
                  {tx.providerNone}
                </div>
              ) : null}

              {message ? (
                <div
                  className={`${styles.status} ${message.type === "success" ? styles.success : styles.error}`}
                  role="status"
                >
                  {message.text}
                </div>
              ) : null}

              <p className={styles.muted}>{tx.cacheNote}</p>

              <div className={styles.actions}>
                <button className={styles.primaryButton} disabled={saving} type="button" onClick={saveType}>
                  {saving ? tx.saving : tx.save}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.form}>
              <p className={styles.muted}>{tx.noTypes}</p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
