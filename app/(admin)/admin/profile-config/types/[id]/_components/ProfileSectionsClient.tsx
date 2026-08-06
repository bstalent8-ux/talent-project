"use client";

// ─── Profile Sections management ──────────────────────────────────────────────
// Same master–detail shape and CSS module as AdminCategoriesClient.
//
// `key` and `kind` are shown read-only: core sections are matched by key inside
// provider.getCompletion(), so renaming one would silently zero a completion
// section. The API omits both from the update schema regardless.
//
// Reordering is ▲▼ only — no drag-and-drop, which would need a new dependency.
// Vertical arrows also stay correct under RTL without any mirroring.

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import {
  SECTION_RENDERER_KEYS,
  SECTION_VISIBILITY,
} from "@/features/profiles/validation/config-schemas";
import type { ProfileTypeSummary } from "@/features/profiles/services/profile-config.service";
import type { RawProfileSection } from "@/features/profiles/types/raw";
import styles from "../../../../packages/_components/AdminPackages.module.css";
import { requestJson } from "../../../_components/config-api";

type FormState = {
  key:              string;
  title:            string;
  title_ar:         string;
  title_en:         string;
  description:      string;
  weight:           number;
  visibility:       string;
  render_component: string;
  icon:             string;
  display_order:    number;
  is_enabled:       boolean;
};

const EMPTY_FORM: FormState = {
  key: "", title: "", title_ar: "", title_en: "", description: "",
  weight: 0, visibility: "public", render_component: "", icon: "",
  display_order: 0, is_enabled: true,
};

function toForm(section: RawProfileSection): FormState {
  return {
    key:              section.key,
    title:            section.title ?? "",
    title_ar:         section.title_ar ?? "",
    title_en:         section.title_en ?? "",
    description:      section.description ?? "",
    weight:           section.weight ?? 0,
    visibility:       section.visibility ?? "public",
    render_component: section.render_component ?? "",
    icon:             section.icon ?? "",
    display_order:    section.display_order ?? 0,
    is_enabled:       section.is_enabled,
  };
}

function sortByOrder(sections: RawProfileSection[]): RawProfileSection[] {
  return [...sections].sort((a, b) => a.display_order - b.display_order);
}

interface Props {
  profileType:     ProfileTypeSummary;
  initialSections: RawProfileSection[];
}

export default function ProfileSectionsClient({ profileType, initialSections }: Props) {
  const { lang } = useSite();
  const ar = lang === "ar";

  const [sections, setSections]     = useState(sortByOrder(initialSections));
  const [selectedId, setSelectedId] = useState<string | null>(initialSections[0]?.id ?? null);
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState<FormState>(
    initialSections[0] ? toForm(sortByOrder(initialSections)[0]) : EMPTY_FORM,
  );
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => sections.find((section) => section.id === selectedId) ?? null,
    [sections, selectedId],
  );

  const typeLabel = ar
    ? (profileType.name_ar ?? profileType.name)
    : (profileType.name_en ?? profileType.name);

  const tx = {
    title:        `${ar ? "أقسام" : "Sections"} — ${typeLabel}`,
    back:         ar ? "→ أنواع الملفات" : "← Profile types",
    list:         ar ? "الأقسام" : "Sections",
    editor:       ar ? "تفاصيل القسم" : "Section details",
    newSection:   ar ? "قسم جديد" : "New section",
    key:          ar ? "المفتاح" : "Key",
    kind:         ar ? "النوع" : "Kind",
    sectionTitle: ar ? "العنوان الداخلي" : "Internal title",
    titleAr:      ar ? "العنوان العربي" : "Arabic title",
    titleEn:      ar ? "العنوان الإنجليزي" : "English title",
    description:  ar ? "الوصف" : "Description",
    weight:       ar ? "الوزن (اكتمال الملف)" : "Weight (completion)",
    visibility:   ar ? "الظهور" : "Visibility",
    renderer:     ar ? "مكوّن العرض" : "Render component",
    icon:         ar ? "الأيقونة" : "Icon",
    order:        ar ? "الترتيب" : "Display order",
    enabled:      ar ? "مفعّل" : "Enabled",
    disabled:     ar ? "معطّل" : "Disabled",
    enable:       ar ? "تفعيل" : "Enable",
    disable:      ar ? "تعطيل" : "Disable",
    fields:       ar ? "الحقول ←" : "Fields →",
    layout:       ar ? "التخطيط ←" : "Layout →",
    preview:      ar ? "معاينة ←" : "Preview →",
    save:         ar ? "حفظ القسم" : "Save section",
    create:       ar ? "إنشاء القسم" : "Create section",
    saving:       ar ? "جاري الحفظ..." : "Saving...",
    moveUp:       ar ? "تحريك لأعلى" : "Move up",
    moveDown:     ar ? "تحريك لأسفل" : "Move down",
    none:         ar ? "بدون" : "None",
    keyLocked:    ar
      ? "المفتاح ونوع القسم غير قابلين للتعديل بعد الإنشاء."
      : "Key and kind are immutable after creation.",
    coreNote:     ar
      ? "قسم أساسي — بياناته من أعمدة مُهيكلة، ولا يقبل حقولاً ديناميكية."
      : "Core section — backed by typed columns, cannot hold dynamic fields.",
    cacheNote:    ar
      ? "تظهر التغييرات لجميع المستخدمين خلال 5 دقائق."
      : "Changes appear for all users within 5 minutes.",
    saved:        ar ? "تم حفظ القسم." : "Section saved.",
    created:      ar ? "تم إنشاء القسم." : "Section created.",
    reordered:    ar ? "تم تحديث الترتيب." : "Order updated.",
    empty:        ar ? "لا توجد أقسام لهذا النوع." : "No sections for this profile type.",
    newHint:      ar
      ? "تُنشأ الأقسام الجديدة كأقسام ديناميكية دائماً."
      : "New sections are always created as dynamic.",
  };

  function select(section: RawProfileSection) {
    setCreating(false);
    setSelectedId(section.id);
    setForm(toForm(section));
    setMessage(null);
  }

  function startNew() {
    setCreating(true);
    setSelectedId(null);
    setForm({
      ...EMPTY_FORM,
      display_order: sections.length ? Math.max(...sections.map((s) => s.display_order)) + 10 : 0,
    });
    setMessage(null);
  }

  function bodyFromForm(includeKey: boolean) {
    return {
      ...(includeKey ? { key: form.key.trim() } : {}),
      title:            form.title,
      title_ar:         form.title_ar || null,
      title_en:         form.title_en || null,
      description:      form.description || null,
      weight:           form.weight,
      visibility:       form.visibility,
      render_component: form.render_component || null,
      icon:             form.icon || null,
      display_order:    form.display_order,
      is_enabled:       form.is_enabled,
    };
  }

  async function saveSection() {
    setSaving(true);
    setMessage(null);
    try {
      if (creating) {
        const data = await requestJson<{ section: RawProfileSection }>(
          `/api/admin/profile-config/types/${profileType.id}/sections`,
          { method: "POST", body: bodyFromForm(true) },
          ar ? "تعذّر الإنشاء" : "Create failed",
        );
        setSections((current) => sortByOrder([...current, data.section]));
        setSelectedId(data.section.id);
        setCreating(false);
        setForm(toForm(data.section));
        setMessage({ type: "success", text: tx.created });
        return;
      }

      if (!selectedId) return;

      const data = await requestJson<{ section: RawProfileSection }>(
        `/api/admin/profile-config/sections/${selectedId}`,
        { method: "PATCH", body: bodyFromForm(false) },
        ar ? "تعذّر الحفظ" : "Save failed",
      );

      setSections((current) =>
        sortByOrder(current.map((s) => (s.id === data.section.id ? data.section : s))),
      );
      setForm(toForm(data.section));
      setMessage({ type: "success", text: tx.saved });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function setEnabled(section: RawProfileSection, isEnabled: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const data = await requestJson<{ section: RawProfileSection }>(
        `/api/admin/profile-config/sections/${section.id}`,
        { method: "PATCH", body: { action: "set_enabled", is_enabled: isEnabled } },
        ar ? "تعذّر تحديث الحالة" : "Status update failed",
      );

      setSections((current) => current.map((s) => (s.id === section.id ? data.section : s)));
      if (selectedId === section.id) setForm((current) => ({ ...current, is_enabled: isEnabled }));
      setMessage({ type: "success", text: isEnabled ? tx.enable : tx.disable });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Swaps a section with its neighbour and persists both in one batch request,
   * matching the /sections/reorder contract.
   */
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;

    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];

    // Renumber from scratch so gaps and duplicate orders self-heal.
    const renumbered = next.map((section, position) => ({ ...section, display_order: position * 10 }));
    const previous = sections;

    setSections(renumbered);
    setSaving(true);
    setMessage(null);

    try {
      await requestJson<{ ok: true }>(
        "/api/admin/profile-config/sections/reorder",
        {
          method: "PATCH",
          body: {
            profile_type_id: profileType.id,
            items: renumbered.map((s) => ({ id: s.id, display_order: s.display_order })),
          },
        },
        ar ? "تعذّر تحديث الترتيب" : "Reorder failed",
      );

      if (selectedId) {
        const current = renumbered.find((s) => s.id === selectedId);
        if (current) setForm((f) => ({ ...f, display_order: current.display_order }));
      }
      setMessage({ type: "success", text: tx.reordered });
    } catch (error) {
      setSections(previous); // roll back the optimistic swap
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Reorder failed" });
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
              <p className={styles.muted}>{sections.length} · {profileType.slug}</p>
            </div>
            <div className={styles.actions}>
              <Link
                className={styles.secondaryButton}
                href="/admin/profile-config"
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
              >
                {tx.back}
              </Link>
              <Link
                className={styles.secondaryButton}
                href={`/admin/profile-config/types/${profileType.id}/layout`}
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
              >
                {tx.layout}
              </Link>
              <Link
                className={styles.secondaryButton}
                href={`/admin/profile-config/types/${profileType.id}/preview`}
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
              >
                {tx.preview}
              </Link>
              <button className={styles.secondaryButton} type="button" onClick={startNew}>
                {tx.newSection}
              </button>
            </div>
          </div>

          <div className={styles.list}>
            {sections.length === 0 ? (
              <p className={styles.muted}>{tx.empty}</p>
            ) : sections.map((section, index) => (
              <div key={section.id} style={{ display: "flex", alignItems: "stretch", gap: "0.4rem" }}>
                <button
                  className={`${styles.packageButton} ${selectedId === section.id ? styles.packageButtonActive : ""}`}
                  type="button"
                  onClick={() => select(section)}
                >
                  <strong>{ar ? (section.title_ar ?? section.title) : (section.title_en ?? section.title)}</strong>
                  <span className={styles.metaRow}>
                    <span className={`${styles.pill} ${section.is_enabled ? styles.pillActive : ""}`}>
                      {section.is_enabled ? tx.enabled : tx.disabled}
                    </span>
                    <span className={styles.pill}>{section.kind}</span>
                    <span>{section.key}</span>
                    <span>w{section.weight}</span>
                    <span>#{section.display_order}</span>
                  </span>
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button
                    aria-label={tx.moveUp}
                    className={styles.iconButton}
                    disabled={saving || index === 0}
                    title={tx.moveUp}
                    type="button"
                    onClick={() => move(index, -1)}
                  >
                    ▲
                  </button>
                  <button
                    aria-label={tx.moveDown}
                    className={styles.iconButton}
                    disabled={saving || index === sections.length - 1}
                    title={tx.moveDown}
                    type="button"
                    onClick={() => move(index, 1)}
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Editor ───────────────────────────────────────────────────── */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{tx.editor}</h3>
              <p className={styles.muted}>{creating ? tx.newSection : (selected?.key ?? "—")}</p>
            </div>
            {selected && !creating ? (
              <div className={styles.actions}>
                {/* Core sections are backed by typed columns and hold no
                    dynamic fields, so the link is offered for dynamic only. */}
                {selected.kind === "dynamic" ? (
                  <Link
                    className={styles.secondaryButton}
                    href={`/admin/profile-config/sections/${selected.id}/fields`}
                    style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
                  >
                    {tx.fields}
                  </Link>
                ) : null}
                <button
                  className={selected.is_enabled ? styles.dangerButton : styles.secondaryButton}
                  disabled={saving}
                  type="button"
                  onClick={() => setEnabled(selected, !selected.is_enabled)}
                >
                  {selected.is_enabled ? tx.disable : tx.enable}
                </button>
              </div>
            ) : null}
          </div>

          {selected || creating ? (
            <div className={styles.form}>
              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.key}</label>
                  <input
                    disabled={!creating}
                    placeholder="equipment"
                    value={form.key}
                    onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>{tx.kind}</label>
                  <input disabled readOnly value={creating ? "dynamic" : (selected?.kind ?? "")} />
                </div>
              </div>

              <p className={styles.muted}>{creating ? tx.newHint : tx.keyLocked}</p>

              {selected?.kind === "core" && !creating ? (
                <div className={styles.status} role="status">{tx.coreNote}</div>
              ) : null}

              <div className={styles.field}>
                <label>{tx.sectionTitle}</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                />
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.titleAr}</label>
                  <input
                    value={form.title_ar}
                    onChange={(event) => setForm((current) => ({ ...current, title_ar: event.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>{tx.titleEn}</label>
                  <input
                    value={form.title_en}
                    onChange={(event) => setForm((current) => ({ ...current, title_en: event.target.value }))}
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
                  <label>{tx.visibility}</label>
                  <select
                    value={form.visibility}
                    onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
                  >
                    {SECTION_VISIBILITY.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>{tx.renderer}</label>
                  {/* Whitelist select, never free text — render_component is a key
                      into a compile-time React registry. */}
                  <select
                    value={form.render_component}
                    onChange={(event) => setForm((current) => ({ ...current, render_component: event.target.value }))}
                  >
                    <option value="">{tx.none}</option>
                    {SECTION_RENDERER_KEYS.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.weight}</label>
                  <input
                    max={100}
                    min={0}
                    type="number"
                    value={form.weight}
                    onChange={(event) => setForm((current) => ({ ...current, weight: Number(event.target.value) }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>{tx.order}</label>
                  <input
                    min={0}
                    type="number"
                    value={form.display_order}
                    onChange={(event) => setForm((current) => ({ ...current, display_order: Number(event.target.value) }))}
                  />
                </div>
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.icon}</label>
                  <input
                    value={form.icon}
                    onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                  />
                </div>
                <label className={styles.checkboxLabel}>
                  <input
                    checked={form.is_enabled}
                    type="checkbox"
                    onChange={(event) => setForm((current) => ({ ...current, is_enabled: event.target.checked }))}
                  />
                  {tx.enabled}
                </label>
              </div>

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
                <button className={styles.primaryButton} disabled={saving} type="button" onClick={saveSection}>
                  {saving ? tx.saving : (creating ? tx.create : tx.save)}
                </button>
                <button className={styles.secondaryButton} type="button" onClick={startNew}>
                  {tx.newSection}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.form}>
              <p className={styles.muted}>{tx.empty}</p>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
