// ─── ChipListSection ──────────────────────────────────────────────────────────
// Flattens every field value into pills. Suited to languages, brand values,
// tags — anything where the label matters less than the set of values.

import type { DynamicFieldDTO, ProfileSectionDTO } from "@/features/profiles/types/dto";
import type { DynamicLang } from "../registry";

/** Resolves a stored value to the labels an admin/visitor should see. */
function chipsFor(field: DynamicFieldDTO, lang: DynamicLang): string[] {
  const value = field.value;
  if (value === null || value === undefined || value === "") return [];

  const labelFor = (raw: unknown): string => {
    const option = field.options.find((item) => item.value === String(raw));
    return option ? option.label[lang] : String(raw);
  };

  if (Array.isArray(value)) return value.map(labelFor);
  if (typeof value === "boolean") return value ? [field.label[lang]] : [];
  return [labelFor(value)];
}

export default function ChipListSection({
  section,
  lang,
}: {
  section: ProfileSectionDTO;
  lang: DynamicLang;
}) {
  const chips = section.fields.flatMap((field) => chipsFor(field, lang));
  if (chips.length === 0) return null;

  return (
    <ul
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.45rem",
        listStyle: "none",
        margin: 0,
        padding: 0,
      }}
    >
      {chips.map((chip, index) => (
        <li
          key={`${chip}-${index}`}
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-pill)",
            padding: "0.2rem 0.65rem",
            background: "var(--bg-card-muted)",
            color: "var(--text-secondary)",
            fontSize: "var(--text-xs)",
            fontWeight: 800,
          }}
        >
          {chip}
        </li>
      ))}
    </ul>
  );
}
