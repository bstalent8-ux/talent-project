import "server-only";

// ─── PreviewService ───────────────────────────────────────────────────────────
// Builds a MOCK ProfileSectionDTO[] from the stored configuration, plus a list
// of admin-facing diagnostics.
//
// Reads config tables only — profile_types, profile_sections, profile_fields,
// profile_layouts. It NEVER touches profile_values or any real user profile.
//
// The output is the same contract the public renderer consumes, so the preview
// exercises the real path rather than a preview-only one.

import { profileTypeRepository } from "../repositories/profile-type.repository";
import { dynamicProfileRepository } from "../repositories/dynamic-profile.repository";
import { ProfileError } from "../errors/profile-error";
import { buildFieldSchema } from "../validation/build-schema";
import { SECTION_RENDERER_KEYS } from "../validation/config-schemas";
import { normalizeLayoutArray } from "../content/layout-entries";
import type {
  Bilingual,
  DynamicFieldDTO,
  ProfileLayoutDTO,
  ProfileSectionDTO,
} from "../types/dto";
import type { RawProfileField, RawProfileSection, RawProfileType } from "../types/raw";

// ─── Diagnostics ──────────────────────────────────────────────────────────────

export type DiagnosticSeverity = "error" | "warning";

export interface PreviewDiagnostic {
  severity:    DiagnosticSeverity;
  /** Machine code, so the UI can group without parsing prose. */
  code:
    | "missing_renderer"
    | "unknown_renderer"
    | "invalid_section_key"
    | "disabled_section_in_layout"
    | "invalid_field_schema"
    | "empty_section"
    | "no_layout";
  message:     Bilingual;
  sectionKey?: string;
  fieldKey?:   string;
}

export interface PreviewResult {
  type:        RawProfileType;
  sections:    ProfileSectionDTO[];
  layout:      ProfileLayoutDTO | null;
  diagnostics: PreviewDiagnostic[];
}

// ─── Mock values ──────────────────────────────────────────────────────────────

/**
 * Safe mock value per field_type.
 *
 * Two deliberate deviations from a naive reading of "placeholder object" /
 * "empty object": `media` produces a Cloudinary URL string and `json` produces
 * an empty array, because those are what buildFieldSchema() actually accepts.
 * A mock that failed its own schema would make every media and json field
 * report a false "invalid field schema" diagnostic.
 */
export function buildMockValue(field: RawProfileField): unknown {
  const options = Array.isArray(field.options)
    ? (field.options as Array<Record<string, unknown>>).map((option) => String(option.value))
    : [];

  switch (field.field_type) {
    case "text":         return "Sample text";
    case "number":       return 123;
    case "boolean":      return true;
    case "select":       return options[0] ?? null;
    case "multi_select": return options.slice(0, 2);
    case "media":        return "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    case "json":         return [];
    default:             return null;
  }
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

function bilingual(ar: string | null, en: string | null, fallback: string): Bilingual {
  return { ar: ar ?? fallback, en: en ?? fallback };
}

function optionalBilingual(ar: string | null, en: string | null): Bilingual | null {
  if (!ar && !en) return null;
  return { ar: ar ?? en ?? "", en: en ?? ar ?? "" };
}

function toFieldDTO(field: RawProfileField, value: unknown): DynamicFieldDTO {
  const options = Array.isArray(field.options)
    ? (field.options as Array<Record<string, unknown>>)
        .filter((option) => option && option.value !== undefined)
        .map((option) => ({
          value: String(option.value),
          label: bilingual(
            (option.label_ar as string) ?? null,
            (option.label_en as string) ?? null,
            String(option.value),
          ),
        }))
    : [];

  return {
    key:          field.key,
    label:        bilingual(field.label_ar, field.label_en, field.label),
    placeholder:  optionalBilingual(field.placeholder_ar, field.placeholder_en),
    helpText:     optionalBilingual(field.help_text_ar, field.help_text_en),
    fieldType:    field.field_type,
    isRequired:   field.is_required,
    options,
    value,
    displayOrder: field.display_order,
  };
}

function toSectionDTO(section: RawProfileSection, fields: DynamicFieldDTO[]): ProfileSectionDTO {
  return {
    key:             section.key,
    title:           bilingual(section.title_ar, section.title_en, section.title),
    description:     optionalBilingual(section.description_ar, section.description_en),
    kind:            section.kind,
    renderComponent: section.render_component,
    icon:            section.icon,
    displayOrder:    section.display_order,
    fields,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const previewService = {
  /**
   * Builds the preview for one profile type and layout variant.
   * Enabled sections and enabled fields only — exactly what a visitor would get.
   */
  async build(profileTypeId: string, variant = "public"): Promise<PreviewResult> {
    const type = await profileTypeRepository.findById(profileTypeId);
    if (!type) throw ProfileError.notFound({ profileTypeId });

    const allSections = await dynamicProfileRepository.findSectionsByType(profileTypeId, true);
    const enabledSections = allSections.filter((section) => section.is_enabled);

    const allFields = await dynamicProfileRepository.findFieldsBySections(
      enabledSections.map((section) => section.id),
      true,
    );

    const layoutRow = await dynamicProfileRepository.findLayout(profileTypeId, variant, true);
    const rawLayout = (layoutRow?.layout ?? {}) as Record<string, unknown>;

    const layout: ProfileLayoutDTO | null =
      layoutRow && layoutRow.is_active
        ? { main: normalizeLayoutArray(rawLayout.main), sidebar: normalizeLayoutArray(rawLayout.sidebar) }
        : null;

    const diagnostics: PreviewDiagnostic[] = [];

    // ── Section + field DTOs, with per-field schema checks ──────────────────
    const sections: ProfileSectionDTO[] = enabledSections.map((section) => {
      const sectionFields = allFields
        .filter((field) => field.section_id === section.id && field.is_enabled)
        .sort((a, b) => a.display_order - b.display_order);

      // Renderer resolution.
      if (!section.render_component) {
        diagnostics.push({
          severity: "warning",
          code:     "missing_renderer",
          sectionKey: section.key,
          message: {
            ar: `القسم "${section.key}" بلا مكوّن عرض — سيُستخدم العرض الافتراضي.`,
            en: `Section "${section.key}" has no render component — the default renderer will be used.`,
          },
        });
      } else if (!SECTION_RENDERER_KEYS.includes(section.render_component as never)) {
        diagnostics.push({
          severity: "error",
          code:     "unknown_renderer",
          sectionKey: section.key,
          message: {
            ar: `مكوّن عرض غير معروف "${section.render_component}" في القسم "${section.key}".`,
            en: `Unknown render component "${section.render_component}" on section "${section.key}".`,
          },
        });
      }

      // A dynamic section with no fields renders nothing.
      if (section.kind === "dynamic" && sectionFields.length === 0) {
        diagnostics.push({
          severity: "warning",
          code:     "empty_section",
          sectionKey: section.key,
          message: {
            ar: `القسم "${section.key}" لا يحتوي على حقول مفعّلة.`,
            en: `Section "${section.key}" has no enabled fields.`,
          },
        });
      }

      const fieldDTOs = sectionFields.map((field) => {
        const mock = buildMockValue(field);

        // Compile the stored config into its real Zod schema and check that a
        // canonical value for that type actually passes. Catches a select with
        // no options, a maxLength shorter than any usable string, and so on.
        try {
          const result = buildFieldSchema(field).safeParse(mock);
          if (!result.success) {
            diagnostics.push({
              severity: "error",
              code:     "invalid_field_schema",
              sectionKey: section.key,
              fieldKey:   field.key,
              message: {
                ar: `الحقل "${field.key}" في "${section.key}": إعداد تحقق غير صالح — ${result.error.issues[0]?.message ?? "غير صالح"}.`,
                en: `Field "${field.key}" in "${section.key}": invalid validation config — ${result.error.issues[0]?.message ?? "invalid"}.`,
              },
            });
          }
        } catch (e) {
          diagnostics.push({
            severity: "error",
            code:     "invalid_field_schema",
            sectionKey: section.key,
            fieldKey:   field.key,
            message: {
              ar: `الحقل "${field.key}": تعذّر بناء مخطط التحقق.`,
              en: `Field "${field.key}": validation schema could not be built.`,
            },
          });
        }

        return toFieldDTO(field, mock);
      });

      return toSectionDTO(section, fieldDTOs);
    });

    // ── Layout checks ───────────────────────────────────────────────────────
    if (!layoutRow) {
      diagnostics.push({
        severity: "warning",
        code:     "no_layout",
        message: {
          ar: `لا يوجد تخطيط للنسخة "${variant}" — سيُستخدم ترتيب display_order.`,
          en: `No layout configured for variant "${variant}" — display_order will be used.`,
        },
      });
    } else if (!layoutRow.is_active) {
      diagnostics.push({
        severity: "warning",
        code:     "no_layout",
        message: {
          ar: `تخطيط النسخة "${variant}" غير مفعّل — سيُستخدم ترتيب display_order.`,
          en: `The "${variant}" layout is inactive — display_order will be used.`,
        },
      });
    } else {
      const enabledByKey = new Set(enabledSections.map((section) => section.key));
      const disabledByKey = new Set(
        allSections.filter((section) => !section.is_enabled).map((section) => section.key),
      );

      for (const key of [...layout!.main, ...layout!.sidebar].map((entry) => entry.key)) {
        if (enabledByKey.has(key)) continue;

        diagnostics.push(
          disabledByKey.has(key)
            ? {
                severity: "error",
                code:     "disabled_section_in_layout",
                sectionKey: key,
                message: {
                  ar: `التخطيط يشير إلى قسم معطّل "${key}" — لن يظهر.`,
                  en: `Layout references disabled section "${key}" — it will not render.`,
                },
              }
            : {
                severity: "error",
                code:     "invalid_section_key",
                sectionKey: key,
                message: {
                  ar: `التخطيط يشير إلى مفتاح غير موجود "${key}".`,
                  en: `Layout references unknown section key "${key}".`,
                },
              },
        );
      }
    }

    return { type, sections, layout, diagnostics };
  },
};

export type PreviewService = typeof previewService;
