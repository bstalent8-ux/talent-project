"use client";

// ─── Profile Fields management ────────────────────────────────────────────────
// Master–detail two-panel screen, same CSS module and state pattern as
// AdminCategoriesClient and the Part 1 screens.
//
// The form is generated from `field_type`: ValidationEditor renders the controls
// that type supports, and OptionsEditor appears only for select / multi_select.
//
// UI restrictions here are convenience. The API is the authority:
//   • `key` is absent from the update schema entirely
//   • `field_type` changes are rejected once profile_values rows exist
//   • delete is rejected once values exist
// Every one of those is re-checked server-side regardless of what this sends.

import { useMemo, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { useSite } from "@/contexts/SiteContext";
import { FIELD_TYPES } from "@/features/profiles/validation/config-schemas";
import type { RawProfileField, RawProfileSection, RawProfileType } from "@/features/profiles/types/raw";
import styles from "../../../../../packages/_components/AdminPackages.module.css";
import { requestJson } from "../../../../_components/config-api";
import OptionsEditor, { type FieldOption } from "./OptionsEditor";
import ValidationEditor, {
  fromValidationSchema,
  toValidationPayload,
  type ValidationState,
} from "./ValidationEditor";

export type FieldWithUsage = RawProfileField & { valueCount: number };

type FormState = {
  key:           string;
  label:         string;
  label_ar:      string;
  label_en:      string;
  field_type:    string;
  is_required:   boolean;
  is_enabled:    boolean;
  weight:        number;
  display_order: number;
  validation:    ValidationState;
  options:       FieldOption[];
};

const EMPTY_FORM: FormState = {
  key: "", label: "", label_ar: "", label_en: "", field_type: "text",
  is_required: false, is_enabled: true, weight: 1, display_order: 0,
  validation: {}, options: [],
};

function readOptions(raw: unknown): FieldOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((option) => option && typeof option === "object")
    .map((option) => {
      const row = option as Record<string, unknown>;
      return {
        value:    String(row.value ?? ""),
        label_ar: String(row.label_ar ?? ""),
        label_en: String(row.label_en ?? ""),
      };
    });
}

function toForm(field: FieldWithUsage): FormState {
  return {
    key:           field.key,
    label:         field.label ?? "",
    label_ar:      field.label_ar ?? "",
    label_en:      field.label_en ?? "",
    field_type:    field.field_type,
    is_required:   field.is_required,
    is_enabled:    field.is_enabled,
    weight:        field.weight ?? 1,
    display_order: field.display_order ?? 0,
    validation:    fromValidationSchema(field.validation_schema),
    options:       readOptions(field.options),
  };
}

function sortByOrder(fields: FieldWithUsage[]): FieldWithUsage[] {
  return [...fields].sort((a, b) => a.display_order - b.display_order);
}

interface Props {
  profileType:   RawProfileType;
  section:       RawProfileSection;
  initialFields: FieldWithUsage[];
}

export default function FieldsClient({ profileType, section, initialFields }: Props) {
  const { lang } = useSite();
  const ar = lang === "ar";

  const [fields, setFields]         = useState(sortByOrder(initialFields));
  const [selectedId, setSelectedId] = useState<string | null>(initialFields[0]?.id ?? null);
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState<FormState>(
    initialFields[0] ? toForm(sortByOrder(initialFields)[0]) : EMPTY_FORM,
  );
  const [saving, setSaving]         = useState(false);
  const [message, setMessage]       = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selected = useMemo(
    () => fields.find((field) => field.id === selectedId) ?? null,
    [fields, selectedId],
  );

  const isCore = section.kind === "core";
  /** Stored values lock both the field type and deletion. */
  const lockedByValues = !creating && (selected?.valueCount ?? 0) > 0;

  const sectionLabel = ar ? (section.title_ar ?? section.title) : (section.title_en ?? section.title);
  const typeLabel    = ar ? (profileType.name_ar ?? profileType.name) : (profileType.name_en ?? profileType.name);

  const tx = {
    title:       `${ar ? "الحقول" : "Fields"} — ${sectionLabel}`,
    back:        ar ? "→ الأقسام" : "← Sections",
    list:        ar ? "الحقول" : "Fields",
    editor:      ar ? "تفاصيل الحقل" : "Field details",
    newField:    ar ? "حقل جديد" : "New field",
    key:         ar ? "المفتاح" : "Key",
    label:       ar ? "الاسم الداخلي" : "Internal label",
    labelAr:     ar ? "الاسم العربي" : "Arabic label",
    labelEn:     ar ? "الاسم الإنجليزي" : "English label",
    fieldType:   ar ? "نوع الحقل" : "Field type",
    required:    ar ? "مطلوب" : "Required",
    enabled:     ar ? "مفعّل" : "Enabled",
    disabled:    ar ? "معطّل" : "Disabled",
    enable:      ar ? "تفعيل" : "Enable",
    disable:     ar ? "تعطيل" : "Disable",
    weight:      ar ? "الوزن (اكتمال الملف)" : "Weight (completion)",
    order:       ar ? "الترتيب" : "Display order",
    save:        ar ? "حفظ الحقل" : "Save field",
    create:      ar ? "إنشاء الحقل" : "Create field",
    saving:      ar ? "جاري الحفظ..." : "Saving...",
    remove:      ar ? "حذف الحقل" : "Delete field",
    moveUp:      ar ? "تحريك لأعلى" : "Move up",
    moveDown:    ar ? "تحريك لأسفل" : "Move down",
    values:      ar ? "قيمة مخزّنة" : "stored values",
    keyLocked:   ar
      ? "المفتاح غير قابل للتعديل بعد الإنشاء."
      : "Key is immutable after creation.",
    typeLocked:  ar
      ? "لا يمكن تغيير نوع الحقل أو حذفه لوجود قيم مخزّنة. عطّله وأنشئ حقلاً بديلاً."
      : "Field type cannot change and the field cannot be deleted while stored values exist. Disable it and create a replacement.",
    coreBlocked: ar
      ? "هذا قسم أساسي — بياناته من أعمدة مُهيكلة ولا يقبل حقولاً ديناميكية."
      : "This is a core section — it is backed by typed columns and cannot hold dynamic fields.",
    cacheNote:   ar
      ? "تظهر التغييرات لجميع المستخدمين خلال 5 دقائق."
      : "Changes appear for all users within 5 minutes.",
    saved:       ar ? "تم حفظ الحقل." : "Field saved.",
    created:     ar ? "تم إنشاء الحقل." : "Field created.",
    deleted:     ar ? "تم حذف الحقل." : "Field deleted.",
    reordered:   ar ? "تم تحديث الترتيب." : "Order updated.",
    empty:       ar ? "لا توجد حقول في هذا القسم." : "No fields in this section.",
    confirmDel:  ar ? "حذف هذا الحقل نهائياً؟" : "Permanently delete this field?",
  };

  function select(field: FieldWithUsage) {
    setCreating(false);
    setSelectedId(field.id);
    setForm(toForm(field));
    setMessage(null);
  }

  function startNew() {
    setCreating(true);
    setSelectedId(null);
    setForm({
      ...EMPTY_FORM,
      display_order: fields.length ? Math.max(...fields.map((f) => f.display_order)) + 10 : 0,
    });
    setMessage(null);
  }

  /** Only the keys the chosen field_type supports are sent — the API is strict. */
  function bodyFromForm(includeKey: boolean) {
    const needsOptions = form.field_type === "select" || form.field_type === "multi_select";

    return {
      ...(includeKey ? { key: form.key.trim() } : {}),
      field_type:        form.field_type,
      label:             form.label,
      label_ar:          form.label_ar || null,
      label_en:          form.label_en || null,
      is_required:       form.is_required,
      is_enabled:        form.is_enabled,
      weight:            form.weight,
      display_order:     form.display_order,
      validation_schema: toValidationPayload(form.field_type, form.validation),
      options:           needsOptions ? form.options.filter((option) => option.value.trim() !== "") : [],
    };
  }

  function upsertLocal(field: RawProfileField, valueCount: number) {
    setFields((current) => {
      const exists = current.some((item) => item.id === field.id);
      const next: FieldWithUsage = { ...field, valueCount };
      return sortByOrder(
        exists
          ? current.map((item) => (item.id === field.id ? next : item))
          : [...current, next],
      );
    });
  }

  async function saveField() {
    setSaving(true);
    setMessage(null);
    try {
      if (creating) {
        const data = await requestJson<{ field: RawProfileField }>(
          `/api/admin/profile-config/sections/${section.id}/fields`,
          { method: "POST", body: bodyFromForm(true) },
          ar ? "تعذّر الإنشاء" : "Create failed",
        );
        upsertLocal(data.field, 0);
        setSelectedId(data.field.id);
        setCreating(false);
        setForm(toForm({ ...data.field, valueCount: 0 }));
        setMessage({ type: "success", text: tx.created });
        return;
      }

      if (!selectedId) return;

      const data = await requestJson<{ field: RawProfileField }>(
        `/api/admin/profile-config/fields/${selectedId}`,
        { method: "PATCH", body: bodyFromForm(false) },
        ar ? "تعذّر الحفظ" : "Save failed",
      );

      const valueCount = selected?.valueCount ?? 0;
      upsertLocal(data.field, valueCount);
      setForm(toForm({ ...data.field, valueCount }));
      setMessage({ type: "success", text: tx.saved });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  async function setEnabled(field: FieldWithUsage, isEnabled: boolean) {
    setSaving(true);
    setMessage(null);
    try {
      const data = await requestJson<{ field: RawProfileField }>(
        `/api/admin/profile-config/fields/${field.id}`,
        { method: "PATCH", body: { action: "set_enabled", is_enabled: isEnabled } },
        ar ? "تعذّر تحديث الحالة" : "Status update failed",
      );

      upsertLocal(data.field, field.valueCount);
      if (selectedId === field.id) setForm((current) => ({ ...current, is_enabled: isEnabled }));
      setMessage({ type: "success", text: isEnabled ? tx.enable : tx.disable });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  async function removeField(field: FieldWithUsage) {
    // eslint-disable-next-line no-alert
    if (!window.confirm(tx.confirmDel)) return;

    setSaving(true);
    setMessage(null);
    try {
      await requestJson<{ ok: true }>(
        `/api/admin/profile-config/fields/${field.id}`,
        { method: "DELETE" },
        ar ? "تعذّر الحذف" : "Delete failed",
      );

      setFields((current) => current.filter((item) => item.id !== field.id));
      if (selectedId === field.id) {
        setSelectedId(null);
        setCreating(false);
        setForm(EMPTY_FORM);
      }
      setMessage({ type: "success", text: tx.deleted });
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Delete failed" });
    } finally {
      setSaving(false);
    }
  }

  /** Swap with a neighbour, renumber, persist in one batch. Rolls back on failure. */
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;

    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    const renumbered = next.map((field, position) => ({ ...field, display_order: position * 10 }));
    const previous = fields;

    setFields(renumbered);
    setSaving(true);
    setMessage(null);

    try {
      await requestJson<{ ok: true }>(
        "/api/admin/profile-config/fields/reorder",
        {
          method: "PATCH",
          body: {
            section_id: section.id,
            items: renumbered.map((f) => ({ id: f.id, display_order: f.display_order })),
          },
        },
        ar ? "تعذّر تحديث الترتيب" : "Reorder failed",
      );

      if (selectedId) {
        const current = renumbered.find((f) => f.id === selectedId);
        if (current) setForm((f) => ({ ...f, display_order: current.display_order }));
      }
      setMessage({ type: "success", text: tx.reordered });
    } catch (error) {
      setFields(previous);
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Reorder failed" });
    } finally {
      setSaving(false);
    }
  }

  const showOptions = form.field_type === "select" || form.field_type === "multi_select";

  return (
    <AdminShell title={tx.title}>
      <div className={styles.layout} dir={ar ? "rtl" : "ltr"}>
        {/* ── List ─────────────────────────────────────────────────────── */}
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>{tx.list}</h2>
              <p className={styles.muted}>{fields.length} · {typeLabel} / {section.key}</p>
            </div>
            <div className={styles.actions}>
              <Link
                className={styles.secondaryButton}
                href={`/admin/profile-config/types/${profileType.id}`}
                style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}
              >
                {tx.back}
              </Link>
              <button className={styles.secondaryButton} disabled={isCore} type="button" onClick={startNew}>
                {tx.newField}
              </button>
            </div>
          </div>

          <div className={styles.list}>
            {isCore ? (
              <div className={`${styles.status} ${styles.error}`} role="status">{tx.coreBlocked}</div>
            ) : null}

            {fields.length === 0 ? (
              <p className={styles.muted}>{tx.empty}</p>
            ) : fields.map((field, index) => (
              <div key={field.id} style={{ display: "flex", alignItems: "stretch", gap: "0.4rem" }}>
                <button
                  className={`${styles.packageButton} ${selectedId === field.id ? styles.packageButtonActive : ""}`}
                  type="button"
                  onClick={() => select(field)}
                >
                  <strong>{ar ? (field.label_ar ?? field.label) : (field.label_en ?? field.label)}</strong>
                  <span className={styles.metaRow}>
                    <span className={`${styles.pill} ${field.is_enabled ? styles.pillActive : ""}`}>
                      {field.is_enabled ? tx.enabled : tx.disabled}
                    </span>
                    <span className={styles.pill}>{field.field_type}</span>
                    {field.is_required ? <span className={styles.pill}>{tx.required}</span> : null}
                    <span>{field.key}</span>
                    <span>#{field.display_order}</span>
                    {field.valueCount > 0 ? (
                      <span>{field.valueCount} {tx.values}</span>
                    ) : null}
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
                    disabled={saving || index === fields.length - 1}
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
              <p className={styles.muted}>{creating ? tx.newField : (selected?.key ?? "—")}</p>
            </div>
            {selected && !creating ? (
              <div className={styles.actions}>
                <button
                  className={selected.is_enabled ? styles.dangerButton : styles.secondaryButton}
                  disabled={saving}
                  type="button"
                  onClick={() => setEnabled(selected, !selected.is_enabled)}
                >
                  {selected.is_enabled ? tx.disable : tx.enable}
                </button>
                <button
                  className={styles.dangerButton}
                  disabled={saving || lockedByValues}
                  title={lockedByValues ? tx.typeLocked : tx.remove}
                  type="button"
                  onClick={() => removeField(selected)}
                >
                  {tx.remove}
                </button>
              </div>
            ) : null}
          </div>

          {(selected || creating) && !isCore ? (
            <div className={styles.form}>
              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.key}</label>
                  <input
                    disabled={!creating}
                    placeholder="camera_body"
                    value={form.key}
                    onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>{tx.fieldType}</label>
                  <select
                    disabled={lockedByValues}
                    value={form.field_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        field_type: event.target.value,
                        // Constraints are per-type; carrying them across would
                        // send keys the strict API schema rejects.
                        validation: {},
                      }))
                    }
                  >
                    {FIELD_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className={styles.muted}>{tx.keyLocked}</p>

              {lockedByValues ? (
                <div className={styles.status} role="status">
                  {selected?.valueCount} {tx.values} — {tx.typeLocked}
                </div>
              ) : null}

              <div className={styles.field}>
                <label>{tx.label}</label>
                <input
                  value={form.label}
                  onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
                />
              </div>

              <div className={styles.gridTwo}>
                <div className={styles.field}>
                  <label>{tx.labelAr}</label>
                  <input
                    value={form.label_ar}
                    onChange={(event) => setForm((current) => ({ ...current, label_ar: event.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>{tx.labelEn}</label>
                  <input
                    value={form.label_en}
                    onChange={(event) => setForm((current) => ({ ...current, label_en: event.target.value }))}
                  />
                </div>
              </div>

              {/* Generated from field_type. */}
              <ValidationEditor
                fieldType={form.field_type}
                value={form.validation}
                onChange={(validation) => setForm((current) => ({ ...current, validation }))}
              />

              {showOptions ? (
                <OptionsEditor
                  options={form.options}
                  onChange={(options) => setForm((current) => ({ ...current, options }))}
                />
              ) : null}

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

              <div className={styles.checkboxGrid}>
                <label className={styles.checkboxLabel}>
                  <input
                    checked={form.is_required}
                    type="checkbox"
                    onChange={(event) => setForm((current) => ({ ...current, is_required: event.target.checked }))}
                  />
                  {tx.required}
                </label>
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
                <button className={styles.primaryButton} disabled={saving} type="button" onClick={saveField}>
                  {saving ? tx.saving : (creating ? tx.create : tx.save)}
                </button>
                <button className={styles.secondaryButton} type="button" onClick={startNew}>
                  {tx.newField}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.form}>
              <p className={styles.muted}>{isCore ? tx.coreBlocked : tx.empty}</p>
              {message ? (
                <div
                  className={`${styles.status} ${message.type === "success" ? styles.success : styles.error}`}
                  role="status"
                >
                  {message.text}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
