// ─── TimelineSection ──────────────────────────────────────────────────────────
// Ordered entries with an optional year. Suited to awards and experience.
//
// A `json` field holding an array of row objects renders one entry per row;
// scalar fields render as a single entry each.

import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import DynamicFieldValue from "../DynamicFieldValue";
import type { DynamicLang } from "../registry";

interface Entry {
  title: string;
  meta:  string | null;
}

/** Picks the most title-like and year-like values out of a row object. */
function entryFromRow(row: Record<string, unknown>): Entry {
  const keys = Object.keys(row);
  const titleKey = keys.find((key) => /name|title|label/i.test(key)) ?? keys[0];
  const metaKey  = keys.find((key) => /year|date|when/i.test(key));

  return {
    title: String(row[titleKey] ?? ""),
    meta:  metaKey ? String(row[metaKey] ?? "") : null,
  };
}

export default function TimelineSection({
  section,
  lang,
}: {
  section: ProfileSectionDTO;
  lang: DynamicLang;
}) {
  const jsonEntries = section.fields
    .filter((field) => field.fieldType === "json" && Array.isArray(field.value))
    .flatMap((field) => (field.value as Record<string, unknown>[]).map(entryFromRow))
    .filter((entry) => entry.title !== "");

  const scalarFields = section.fields.filter(
    (field) => field.fieldType !== "json" && field.value !== null && field.value !== "",
  );

  if (jsonEntries.length === 0 && scalarFields.length === 0) return null;

  return (
    <ol style={{ display: "grid", gap: "0.65rem", listStyle: "none", margin: 0, padding: 0 }}>
      {jsonEntries.map((entry, index) => (
        <li
          key={`json-${index}`}
          style={{
            borderInlineStart: "2px solid var(--border-subtle)",
            paddingInlineStart: "0.75rem",
          }}
        >
          <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
            {entry.title}
          </strong>
          {entry.meta ? (
            <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", marginInlineStart: "0.5rem" }}>
              {entry.meta}
            </span>
          ) : null}
        </li>
      ))}

      {scalarFields.map((field) => (
        <li
          key={field.key}
          style={{
            borderInlineStart: "2px solid var(--border-subtle)",
            paddingInlineStart: "0.75rem",
          }}
        >
          <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
            {field.label[lang]}
          </strong>
          <span style={{ color: "var(--text-muted)", fontSize: "var(--text-xs)", marginInlineStart: "0.5rem" }}>
            <DynamicFieldValue field={field} lang={lang} />
          </span>
        </li>
      ))}
    </ol>
  );
}
