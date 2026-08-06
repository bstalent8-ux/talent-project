// ─── StatGridSection ──────────────────────────────────────────────────────────
// Numeric emphasis: value large, label small. Suited to audience figures.

import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import DynamicFieldValue from "../DynamicFieldValue";
import type { DynamicLang } from "../registry";

export default function StatGridSection({
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
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "0.6rem",
      }}
    >
      {populated.map((field) => (
        <div
          key={field.key}
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "0.75rem",
            background: "var(--bg-surface)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "var(--text-primary)",
              fontSize: "var(--text-lg)",
              fontWeight: 900,
              lineHeight: 1.2,
            }}
          >
            <DynamicFieldValue field={field} lang={lang} />
          </div>
          <div style={{ marginTop: "0.25rem", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
            {field.label[lang]}
          </div>
        </div>
      ))}
    </div>
  );
}
