"use client";

// ─── OptionsEditor ────────────────────────────────────────────────────────────
// Structured editor for select / multi_select choices.
//
// Deliberately not a JSON textarea: `options` is compiled into a Zod enum by
// buildFieldSchema(), so a malformed shape would break validation for every
// user of that profile type at runtime. Both the API and the DB CHECK also
// require at least one option.

import { useSite } from "@/contexts/SiteContext";
import styles from "../../../../../packages/_components/AdminPackages.module.css";

export interface FieldOption {
  value:    string;
  label_ar: string;
  label_en: string;
}

interface Props {
  options:  FieldOption[];
  onChange: (options: FieldOption[]) => void;
}

export default function OptionsEditor({ options, onChange }: Props) {
  const { lang } = useSite();
  const ar = lang === "ar";

  const tx = {
    title:   ar ? "الخيارات" : "Options",
    value:   ar ? "القيمة" : "Value",
    labelAr: ar ? "الاسم العربي" : "Arabic label",
    labelEn: ar ? "الاسم الإنجليزي" : "English label",
    add:     ar ? "إضافة خيار" : "Add option",
    remove:  ar ? "حذف" : "Remove",
    empty:   ar ? "أضف خياراً واحداً على الأقل." : "Add at least one option.",
    hint:    ar
      ? "القيمة هي ما يُخزَّن في قاعدة البيانات؛ الأسماء هي ما يراه المستخدم."
      : "Value is what gets stored; labels are what users see.",
  };

  function update(index: number, patch: Partial<FieldOption>) {
    onChange(options.map((option, i) => (i === index ? { ...option, ...patch } : option)));
  }

  function add() {
    onChange([...options, { value: "", label_ar: "", label_en: "" }]);
  }

  function remove(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  return (
    <div className={styles.field}>
      <label>{tx.title}</label>
      <p className={styles.muted}>{tx.hint}</p>

      <div className={styles.rowList}>
        {options.length === 0 ? (
          <p className={styles.muted}>{tx.empty}</p>
        ) : options.map((option, index) => (
          <div className={styles.draftRow} key={index}>
            <input
              aria-label={tx.value}
              placeholder={tx.value}
              value={option.value}
              onChange={(event) => update(index, { value: event.target.value })}
            />
            <input
              aria-label={tx.labelAr}
              placeholder={tx.labelAr}
              value={option.label_ar}
              onChange={(event) => update(index, { label_ar: event.target.value })}
            />
            <input
              aria-label={tx.labelEn}
              placeholder={tx.labelEn}
              value={option.label_en}
              onChange={(event) => update(index, { label_en: event.target.value })}
            />
            <button
              className={styles.dangerButton}
              title={tx.remove}
              type="button"
              onClick={() => remove(index)}
            >
              {tx.remove}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.secondaryButton} type="button" onClick={add}>
          {tx.add}
        </button>
      </div>
    </div>
  );
}
