// ─── CardGridSection ──────────────────────────────────────────────────────────
// One card per field. Suited to previous campaigns and similar grouped content.

import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import DynamicFieldValue from "../DynamicFieldValue";
import type { DynamicLang } from "../registry";

export default function CardGridSection({
  section,
  lang,
}: {
  section: ProfileSectionDTO;
  lang: DynamicLang;
}) {
  const populated = section.fields.filter(
    (field) => field.value !== null && field.value !== undefined && field.value !== "",
  );

  if (populated.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "0.6rem",
      }}
    >
      {populated.map((field) => (
        <article
          key={field.key}
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem",
            background: "var(--bg-surface)",
          }}
        >
          <h4
            style={{
              margin: "0 0 0.35rem",
              color: "var(--text-muted)",
              fontSize: "var(--text-xs)",
              fontWeight: 800,
            }}
          >
            {field.label[lang]}
          </h4>
          <div style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
            <DynamicFieldValue field={field} lang={lang} />
          </div>
        </article>
      ))}
    </div>
  );
}
