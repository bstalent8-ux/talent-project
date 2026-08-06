// ─── DynamicFieldValue ────────────────────────────────────────────────────────
// Renders one field's stored value according to its field_type.
//
// No dangerouslySetInnerHTML anywhere: dynamic values are admin-configured but
// user-entered, so every value is rendered as text or as a constrained element.
// `media` is additionally pinned to the Cloudinary host, matching the CSP in
// next.config.ts and the schema in features/profiles/validation/build-schema.ts.

import type { DynamicFieldDTO } from "@/features/profiles/types/dto";
import type { DynamicLang } from "./registry";

const CLOUDINARY_PREFIX = "https://res.cloudinary.com/";

function optionLabel(field: DynamicFieldDTO, raw: unknown, lang: DynamicLang): string {
  const option = field.options.find((item) => item.value === String(raw));
  return option ? option.label[lang] : String(raw);
}

export default function DynamicFieldValue({
  field,
  lang,
}: {
  field: DynamicFieldDTO;
  lang: DynamicLang;
}) {
  const value = field.value;
  const empty = lang === "ar" ? "—" : "—";

  if (value === null || value === undefined || value === "") return <>{empty}</>;

  switch (field.fieldType) {
    case "boolean":
      return <>{value ? (lang === "ar" ? "نعم" : "Yes") : (lang === "ar" ? "لا" : "No")}</>;

    case "select":
      return <>{optionLabel(field, value, lang)}</>;

    case "multi_select":
      return (
        <>{Array.isArray(value) ? value.map((item) => optionLabel(field, item, lang)).join("، ") : String(value)}</>
      );

    case "media": {
      const url = String(value);
      // Anything off the Cloudinary host is shown as inert text, never loaded.
      if (!url.startsWith(CLOUDINARY_PREFIX)) return <>{url}</>;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={field.label[lang]}
          src={url}
          style={{
            maxWidth: "100%",
            maxHeight: 140,
            borderRadius: "var(--radius-sm)",
            objectFit: "cover",
          }}
        />
      );
    }

    case "json": {
      if (!Array.isArray(value)) return <>{empty}</>;
      if (value.length === 0) return <>{empty}</>;
      return (
        <ul style={{ margin: 0, paddingInlineStart: "1rem" }}>
          {(value as Record<string, unknown>[]).map((row, index) => (
            <li key={index}>
              {Object.entries(row)
                .map(([key, entry]) => `${key}: ${String(entry)}`)
                .join(" · ")}
            </li>
          ))}
        </ul>
      );
    }

    case "number":
    case "text":
    default:
      return <>{String(value)}</>;
  }
}
