"use client";

// ─── Layout editor ────────────────────────────────────────────────────────────
// Manages profile_layouts: which enabled sections appear, in which slot, in
// what order, per variant.
//
// Ordering ONLY. There is no component picker, no JSX selection, no visual
// builder — the stored value is two arrays of profile_sections.key strings.
//
// ▲▼ for order, ⇄ to move between slots. No drag-and-drop: it would need a new
// dependency, and vertical arrows stay correct under RTL without mirroring.
//
// The server re-validates everything (unknown key, disabled section, duplicate)
// in profileConfigService.saveLayout — the UI just avoids offering invalid moves.

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import { LAYOUT_VARIANTS, type LayoutVariant } from "@/features/profiles/validation/config-schemas";
import type { ProfileTypeSummary } from "@/features/profiles/services/profile-config.service";
import type { RawProfileLayout, RawProfileSection } from "@/features/profiles/types/raw";
import styles from "../../../../../packages/_components/AdminPackages.module.css";
import { requestJson } from "../../../../_components/config-api";

type Slot = "main" | "sidebar";

interface SlotState {
  main:    string[];
  sidebar: string[];
}

function readSlots(layout: RawProfileLayout | null): SlotState {
  const raw = (layout?.layout ?? {}) as Record<string, unknown>;
  const asKeys = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);
  return { main: asKeys(raw.main), sidebar: asKeys(raw.sidebar) };
}

interface Props {
  profileType:    ProfileTypeSummary;
  sections:       RawProfileSection[];
  initialLayouts: RawProfileLayout[];
}

export default function LayoutEditorClient({ profileType, sections, initialLayouts }: Props) {
  const { lang } = useSite();
  const ar = lang === "ar";

  // Only enabled sections may appear in a layout — the API rejects the rest.
  const enabledSections = useMemo(
    () => sections.filter((section) => section.is_enabled),
    [sections],
  );

  const sectionByKey = useMemo(
    () => Object.fromEntries(enabledSections.map((section) => [section.key, section])),
    [enabledSections],
  );

  const [layouts, setLayouts] = useState(initialLayouts);
  const [variant, setVariant] = useState<LayoutVariant>("public");

  const currentLayout = useMemo(
    () => layouts.find((layout) => layout.variant === variant) ?? null,
    [layouts, variant],
  );

  const [slots, setSlots]       = useState<SlotState>(() => readSlots(initialLayouts.find((l) => l.variant === "public") ?? null));
  const [isActive, setIsActive] = useState<boolean>(currentLayout?.is_active ?? true);
  const [saving, setSaving]     = useState(false);
  const [message, setMessage]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  /**
   * Enabled sections not yet placed in either slot.
   * A key stored in the layout whose section has since been disabled or deleted
   * simply will not resolve — it is surfaced as "unknown" rather than hidden.
   */
  const placed = useMemo(() => new Set([...slots.main, ...slots.sidebar]), [slots]);
  const available = useMemo(
    () => enabledSections.filter((section) => !placed.has(section.key)),
    [enabledSections, placed],
  );
  const orphanKeys = useMemo(
    () => [...placed].filter((key) => !sectionByKey[key]),
    [placed, sectionByKey],
  );

  const typeLabel = ar ? (profileType.name_ar ?? profileType.name) : (profileType.name_en ?? profileType.name);

  const tx = {
    title:        `${ar ? "التخطيط" : "Layout"} — ${typeLabel}`,
    back:         ar ? "→ الأقسام" : "← Sections",
    overview:     ar ? "نظرة عامة" : "Overview",
    profileType:  ar ? "نوع الملف" : "Profile type",
    variant:      ar ? "النسخة" : "Variant",
    status:       ar ? "الحالة" : "Status",
    active:       ar ? "مفعّل" : "Active",
    inactive:     ar ? "غير مفعّل" : "Inactive",
    notCreated:   ar ? "لم يُنشأ بعد" : "Not created yet",
    editor:       ar ? "ترتيب الأقسام" : "Section ordering",
    main:         ar ? "العمود الرئيسي" : "Main column",
    sidebar:      ar ? "العمود الجانبي" : "Sidebar",
    available:    ar ? "أقسام متاحة" : "Available sections",
    add:          ar ? "إضافة" : "Add",
    removeFrom:   ar ? "إزالة" : "Remove",
    toSidebar:    ar ? "→ الجانبي" : "→ Sidebar",
    toMain:       ar ? "→ الرئيسي" : "→ Main",
    moveUp:       ar ? "تحريك لأعلى" : "Move up",
    moveDown:     ar ? "تحريك لأسفل" : "Move down",
    save:         ar ? "حفظ التخطيط" : "Save layout",
    create:       ar ? "إنشاء التخطيط" : "Create layout",
    saving:       ar ? "جاري الحفظ..." : "Saving...",
    activate:     ar ? "تفعيل" : "Activate",
    deactivate:   ar ? "تعطيل" : "Deactivate",
    applyOrder:   ar ? "تطبيق الترتيب على الأقسام" : "Apply order to sections",
    emptySlot:    ar ? "لا توجد أقسام هنا." : "No sections here.",
    noAvailable:  ar ? "كل الأقسام المفعّلة مُستخدَمة." : "All enabled sections are placed.",
    noSections:   ar ? "لا توجد أقسام مفعّلة لهذا النوع." : "This profile type has no enabled sections.",
    saved:        ar ? "تم حفظ التخطيط." : "Layout saved.",
    orderApplied: ar ? "تم تحديث ترتيب الأقسام." : "Section order updated.",
    orphan:       ar
      ? "مفاتيح في التخطيط لا تطابق قسماً مفعّلاً — أزلها قبل الحفظ."
      : "Layout keys that match no enabled section — remove them before saving.",
    orderingNote: ar
      ? "التخطيط يخزّن الترتيب فقط: مصفوفتان من مفاتيح الأقسام. لا توجد مكوّنات أو أنماط هنا."
      : "A layout stores ordering only: two arrays of section keys. No components, no styles.",
    applyNote:    ar
      ? "اختياري: ينسخ ترتيب العمود الرئيسي إلى display_order في صفحة الأقسام."
      : "Optional: copies the main column order into display_order on the sections screen.",
    cacheNote:    ar
      ? "تظهر التغييرات لجميع المستخدمين خلال 5 دقائق."
      : "Changes appear for all users within 5 minutes.",
    inactiveNote: ar
      ? "التخطيط غير المفعّل يُتجاهَل، ويعود العرض إلى ترتيب display_order."
      : "An inactive layout is ignored; rendering falls back to display_order.",
  };

  function switchVariant(next: LayoutVariant) {
    const layout = layouts.find((item) => item.variant === next) ?? null;
    setVariant(next);
    setSlots(readSlots(layout));
    setIsActive(layout?.is_active ?? true);
    setMessage(null);
  }

  function label(key: string): string {
    const section = sectionByKey[key];
    if (!section) return key;
    return ar ? (section.title_ar ?? section.title) : (section.title_en ?? section.title);
  }

  function moveWithin(slot: Slot, index: number, direction: -1 | 1) {
    setSlots((current) => {
      const list = [...current[slot]];
      const target = index + direction;
      if (target < 0 || target >= list.length) return current;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...current, [slot]: list };
    });
    setMessage(null);
  }

  function moveToSlot(from: Slot, index: number) {
    const to: Slot = from === "main" ? "sidebar" : "main";
    setSlots((current) => {
      const source = [...current[from]];
      const [key] = source.splice(index, 1);
      if (!key) return current;
      return { ...current, [from]: source, [to]: [...current[to], key] };
    });
    setMessage(null);
  }

  function removeFromSlot(slot: Slot, index: number) {
    setSlots((current) => ({ ...current, [slot]: current[slot].filter((_, i) => i !== index) }));
    setMessage(null);
  }

  function addToSlot(key: string, slot: Slot) {
    setSlots((current) =>
      placed.has(key) ? current : { ...current, [slot]: [...current[slot], key] },
    );
    setMessage(null);
  }

  async function saveLayout() {
    setSaving(true);
    setMessage(null);
    try {
      const data = await requestJson<{ layout: RawProfileLayout }>(
        `/api/admin/profile-config/types/${profileType.id}/layout`,
        {
          method: "PUT",
          body: { variant, is_active: isActive, layout: slots },
        },
        ar ? "تعذّر الحفظ" : "Save failed",
      );

      setLayouts((current) => {
        const exists = current.some((item) => item.variant === data.layout.variant);
        return exists
          ? current.map((item) => (item.variant === data.layout.variant ? data.layout : item))
          : [...current, data.layout];
      });
      setMessage({ type: "success", text: tx.saved });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Optional, explicit second step. The layout arrays and
   * profile_sections.display_order are separate orderings; this copies the main
   * column into the latter via the existing batch endpoint rather than letting
   * a layout save silently rewrite the sections screen.
   */
  async function applyOrderToSections() {
    setSaving(true);
    setMessage(null);
    try {
      const ordered = [...slots.main, ...slots.sidebar]
        .map((key) => sectionByKey[key])
        .filter(Boolean);

      if (ordered.length === 0) return;

      await requestJson<{ ok: true }>(
        "/api/admin/profile-config/sections/reorder",
        {
          method: "PATCH",
          body: {
            profile_type_id: profileType.id,
            items: ordered.map((section, index) => ({ id: section.id, display_order: index * 10 })),
          },
        },
        ar ? "تعذّر تحديث الترتيب" : "Reorder failed",
      );

      setMessage({ type: "success", text: tx.orderApplied });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Reorder failed" });
    } finally {
      setSaving(false);
    }
  }

  function renderSlot(slot: Slot) {
    const list = slots[slot];
    return (
      <div className={styles.field}>
        <label>{slot === "main" ? tx.main : tx.sidebar}</label>
        <div className={styles.rowList}>
          {list.length === 0 ? (
            <p className={styles.muted}>{tx.emptySlot}</p>
          ) : list.map((key, index) => {
            const known = Boolean(sectionByKey[key]);
            return (
              <div
                className={styles.draftRow}
                key={`${slot}-${key}`}
                style={{ gridTemplateColumns: "1fr auto auto auto auto" }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: "var(--text-sm)" }}>{label(key)}</strong>
                  <span className={styles.metaRow}>
                    <span>{key}</span>
                    {known ? (
                      <span className={styles.pill}>{sectionByKey[key].kind}</span>
                    ) : (
                      <span className={styles.pill}>?</span>
                    )}
                  </span>
                </div>
                <button
                  aria-label={tx.moveUp}
                  className={styles.iconButton}
                  disabled={saving || index === 0}
                  title={tx.moveUp}
                  type="button"
                  onClick={() => moveWithin(slot, index, -1)}
                >
                  ▲
                </button>
                <button
                  aria-label={tx.moveDown}
                  className={styles.iconButton}
                  disabled={saving || index === list.length - 1}
                  title={tx.moveDown}
                  type="button"
                  onClick={() => moveWithin(slot, index, 1)}
                >
                  ▼
                </button>
                <button
                  className={styles.secondaryButton}
                  disabled={saving}
                  type="button"
                  onClick={() => moveToSlot(slot, index)}
                >
                  {slot === "main" ? tx.toSidebar : tx.toMain}
                </button>
                <button
                  className={styles.dangerButton}
                  disabled={saving}
                  type="button"
                  onClick={() => removeFromSlot(slot, index)}
                >
                  {tx.removeFrom}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AdminShell title={tx.title}>
      <div className={styles.layout} dir={ar ? "rtl" : "ltr"}>
        {/* ── Overview ─────────────────────────────────────────────────── */}
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>{tx.overview}</h2>
              <p className={styles.muted}>{profileType.slug}</p>
            </div>
            <Link
              className={styles.secondaryButton}
              href={`/admin/profile-config/types/${profileType.id}`}
              style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
            >
              {tx.back}
            </Link>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label>{tx.profileType}</label>
              <input disabled readOnly value={`${typeLabel} (${profileType.slug})`} />
            </div>

            <div className={styles.field}>
              <label>{tx.variant}</label>
              <select
                value={variant}
                onChange={(event) => switchVariant(event.target.value as LayoutVariant)}
              >
                {LAYOUT_VARIANTS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>{tx.status}</label>
              <span className={`${styles.pill} ${currentLayout ? (currentLayout.is_active ? styles.pillActive : "") : ""}`}>
                {currentLayout ? (currentLayout.is_active ? tx.active : tx.inactive) : tx.notCreated}
              </span>
            </div>

            <label className={styles.checkboxLabel}>
              <input
                checked={isActive}
                type="checkbox"
                onChange={(event) => setIsActive(event.target.checked)}
              />
              {isActive ? tx.activate : tx.deactivate}
            </label>

            <p className={styles.muted}>{tx.inactiveNote}</p>

            {/* Available tray */}
            <div className={styles.field}>
              <label>{tx.available}</label>
              {enabledSections.length === 0 ? (
                <p className={styles.muted}>{tx.noSections}</p>
              ) : available.length === 0 ? (
                <p className={styles.muted}>{tx.noAvailable}</p>
              ) : (
                <div className={styles.rowList}>
                  {available.map((section) => (
                    <div className={styles.draftRow} key={section.id} style={{ gridTemplateColumns: "1fr auto auto" }}>
                      <div>
                        <strong style={{ display: "block", fontSize: "var(--text-sm)" }}>
                          {ar ? (section.title_ar ?? section.title) : (section.title_en ?? section.title)}
                        </strong>
                        <span className={styles.metaRow}>
                          <span>{section.key}</span>
                          <span className={styles.pill}>{section.kind}</span>
                        </span>
                      </div>
                      <button
                        className={styles.secondaryButton}
                        disabled={saving}
                        type="button"
                        onClick={() => addToSlot(section.key, "main")}
                      >
                        {tx.add} {tx.main}
                      </button>
                      <button
                        className={styles.secondaryButton}
                        disabled={saving}
                        type="button"
                        onClick={() => addToSlot(section.key, "sidebar")}
                      >
                        {tx.add} {tx.sidebar}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ── Ordering editor ──────────────────────────────────────────── */}
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>{tx.editor}</h3>
              <p className={styles.muted}>
                {variant} · {slots.main.length + slots.sidebar.length}
              </p>
            </div>
          </div>

          <div className={styles.form}>
            <p className={styles.muted}>{tx.orderingNote}</p>

            {orphanKeys.length > 0 ? (
              <div className={`${styles.status} ${styles.error}`} role="status">
                {tx.orphan} — {orphanKeys.join(", ")}
              </div>
            ) : null}

            {renderSlot("main")}
            {renderSlot("sidebar")}

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
              <button className={styles.primaryButton} disabled={saving} type="button" onClick={saveLayout}>
                {saving ? tx.saving : (currentLayout ? tx.save : tx.create)}
              </button>
              <button
                className={styles.secondaryButton}
                disabled={saving || slots.main.length + slots.sidebar.length === 0}
                title={tx.applyNote}
                type="button"
                onClick={applyOrderToSections}
              >
                {tx.applyOrder}
              </button>
            </div>

            <p className={styles.muted}>{tx.applyNote}</p>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
