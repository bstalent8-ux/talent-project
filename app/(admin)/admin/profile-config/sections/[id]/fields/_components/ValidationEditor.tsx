"use client";

// ─── ValidationEditor ─────────────────────────────────────────────────────────
// Structured controls for `validation_schema`, generated from field_type.
//
// No raw JSON textarea by design. The bag is compiled into a Zod schema by
// buildFieldSchema() on every dynamic-field write, so a typo'd key would
// silently do nothing while an admin believed a constraint was enforced.
//
// The API schema is `.strict()`, so only the keys listed per type below are
// accepted — anything else is a 400.

import { useSite } from "@/contexts/SiteContext";
import styles from "../../../../../packages/_components/AdminPackages.module.css";

export type ValidationState = Record<string, string>;

/** Which validation keys each field type supports. Mirrors buildFieldSchema(). */
export const VALIDATION_KEYS_BY_TYPE: Record<string, string[]> = {
  text:         ["minLength", "maxLength", "pattern"],
  number:       ["min", "max", "step"],
  boolean:      [],
  select:       [],
  multi_select: ["maxItems"],
  media:        ["accept"],
  json:         ["maxItems"],
};

const NUMERIC_KEYS = new Set(["minLength", "maxLength", "min", "max", "step", "maxItems"]);

/**
 * Builds the payload sent to the API.
 * Empty inputs are omitted entirely — sending "" or NaN would fail `.strict()`
 * coercion and produce a confusing 400.
 */
export function toValidationPayload(
  fieldType: string,
  state: ValidationState,
): Record<string, unknown> {
  const allowed = VALIDATION_KEYS_BY_TYPE[fieldType] ?? [];
  const out: Record<string, unknown> = {};

  for (const key of allowed) {
    const raw = (state[key] ?? "").trim();
    if (raw === "") continue;

    if (NUMERIC_KEYS.has(key)) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) out[key] = parsed;
    } else {
      out[key] = raw;
    }
  }

  return out;
}

/** Turns a stored bag back into form state. */
export function fromValidationSchema(schema: Record<string, unknown> | null): ValidationState {
  const out: ValidationState = {};
  for (const [key, value] of Object.entries(schema ?? {})) {
    if (value !== null && value !== undefined) out[key] = String(value);
  }
  return out;
}

interface Props {
  fieldType: string;
  value:     ValidationState;
  onChange:  (next: ValidationState) => void;
}

export default function ValidationEditor({ fieldType, value, onChange }: Props) {
  const { lang } = useSite();
  const ar = lang === "ar";

  const keys = VALIDATION_KEYS_BY_TYPE[fieldType] ?? [];

  const LABELS: Record<string, { ar: string; en: string; hint?: { ar: string; en: string } }> = {
    minLength: { ar: "أقل عدد حروف", en: "Min length" },
    maxLength: { ar: "أقصى عدد حروف", en: "Max length" },
    pattern:   {
      ar: "نمط (تعبير نمطي)", en: "Pattern (regex)",
      hint: { ar: "اختياري. نمط غير صالح يُتجاهَل.", en: "Optional. An invalid pattern is ignored." },
    },
    min:       { ar: "أقل قيمة", en: "Minimum" },
    max:       { ar: "أقصى قيمة", en: "Maximum" },
    step:      { ar: "خطوة الزيادة", en: "Step" },
    maxItems:  { ar: "أقصى عدد عناصر", en: "Max items" },
    accept:    {
      ar: "أنواع الملفات المسموحة", en: "Allowed file types",
      hint: {
        ar: "مثال: image/*. الروابط مقيّدة بمستضيف Cloudinary دائماً.",
        en: "e.g. image/*. URLs are always restricted to the Cloudinary host.",
      },
    },
  };

  const tx = {
    title: ar ? "قواعد التحقق" : "Validation rules",
    none:  ar ? "لا توجد قواعد لهذا النوع." : "This field type has no validation rules.",
  };

  if (keys.length === 0) {
    return (
      <div className={styles.field}>
        <label>{tx.title}</label>
        <p className={styles.muted}>{tx.none}</p>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <label>{tx.title}</label>
      <div className={styles.gridTwo}>
        {keys.map((key) => {
          const label = LABELS[key];
          return (
            <div className={styles.field} key={key}>
              <label>{ar ? label.ar : label.en}</label>
              <input
                type={NUMERIC_KEYS.has(key) ? "number" : "text"}
                value={value[key] ?? ""}
                onChange={(event) => onChange({ ...value, [key]: event.target.value })}
              />
              {label.hint ? (
                <p className={styles.muted}>{ar ? label.hint.ar : label.hint.en}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
