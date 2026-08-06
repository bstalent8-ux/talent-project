// ─── KeyValueListSection ──────────────────────────────────────────────────────
// Default renderer for a dynamic section: label / value rows.
//
// Consumes ProfileSectionDTO — the exact shape ProfileService already returns
// from getPublicProfileByHandle. Nothing here is preview-specific.

import type { ProfileSectionDTO } from "@/features/profiles/types/dto";
import DynamicFieldValue from "../DynamicFieldValue";
import type { DynamicLang } from "../registry";

export default function KeyValueListSection({
  section,
  lang,
}: {
  section: ProfileSectionDTO;
  lang: DynamicLang;
}) {
  if (section.fields.length === 0) return null;

  return (
    <dl style={{ display: "grid", gap: "0.6rem", margin: 0 }}>
      {section.fields.map((field) => (
        <div
          key={field.key}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(120px, 0.4fr) 1fr",
            gap: "0.75rem",
            alignItems: "baseline",
          }}
        >
          <dt style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", fontWeight: 700 }}>
            {field.label[lang]}
          </dt>
          <dd style={{ margin: 0, color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
            <DynamicFieldValue field={field} lang={lang} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
