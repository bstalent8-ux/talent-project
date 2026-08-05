import "server-only";

// ─── DynamicProfileService ────────────────────────────────────────────────────
// Type-agnostic layer over the Phase 1 dynamic tables. Every provider shares
// this — a profile type never reimplements section loading.
//
// Two responsibilities:
//   1. Cache the schema (sections + fields + layout) per profile type.
//   2. Join schema to values in JS and apply visibility filtering SERVER-SIDE.
//
// Visibility must be filtered here and not in a component: reads go through
// the service role, so RLS is bypassed and a component-level filter would be
// a data leak.

import { profileRepository } from "../repositories/profile.repository";
import { dynamicProfileRepository } from "../repositories/dynamic-profile.repository";
import { validateFieldValue } from "../validation/build-schema";
import type {
  Bilingual,
  DynamicFieldDTO,
  DynamicValidationError,
  DynamicValidationResult,
  ProfileLayoutDTO,
  ProfileSectionDTO,
} from "../types/dto";
import type {
  RawProfileField,
  RawProfileLayout,
  RawProfileSection,
  SectionVisibility,
} from "../types/raw";

// ─── Schema cache ─────────────────────────────────────────────────────────────
// Module-level Map. On Cloudflare Workers this is per-isolate, so staleness is
// bounded by the TTL and there is no cross-request leak — it holds public
// config only and NEVER user data.

const SCHEMA_TTL_MS = 5 * 60 * 1000;

export interface ProfileSchema {
  typeId:          string;
  sections:        RawProfileSection[];
  fieldsBySection: Record<string, RawProfileField[]>;
  layout:          RawProfileLayout | null;
}

interface SchemaCacheEntry {
  at:     number;
  schema: ProfileSchema;
}

const schemaCache = new Map<string, SchemaCacheEntry>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bilingual(ar: string | null, en: string | null, fallback: string): Bilingual {
  return { ar: ar ?? fallback, en: en ?? fallback };
}

function optionalBilingual(ar: string | null, en: string | null): Bilingual | null {
  if (!ar && !en) return null;
  return { ar: ar ?? en ?? "", en: en ?? ar ?? "" };
}

function isVisible(visibility: SectionVisibility, viewer: "public" | "authenticated" | "owner"): boolean {
  if (viewer === "owner") return visibility !== "admin";
  if (viewer === "authenticated") return visibility === "public" || visibility === "authenticated";
  return visibility === "public";
}

function toFieldDTO(
  field: RawProfileField,
  value: unknown | null,
  includeValidation: boolean,
): DynamicFieldDTO {
  const options = Array.isArray(field.options)
    ? (field.options as Array<Record<string, unknown>>)
        .filter((o) => o && typeof o === "object" && o.value !== undefined)
        .map((o) => ({
          value: String(o.value),
          label: bilingual(
            (o.label_ar as string) ?? null,
            (o.label_en as string) ?? null,
            String(o.value),
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
    ...(includeValidation ? { validation: field.validation_schema ?? {} } : {}),
    value:        value ?? null,
    displayOrder: field.display_order,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const dynamicProfileService = {
  /**
   * Loads and caches the schema for a profile type slug. Two queries on a miss,
   * zero on a hit.
   */
  async getSchemaBySlug(typeSlug: string): Promise<ProfileSchema | null> {
    const hit = schemaCache.get(typeSlug);
    if (hit && Date.now() - hit.at < SCHEMA_TTL_MS) return hit.schema;

    const type = await profileRepository.findTypeBySlug(typeSlug);
    if (!type) return null;

    const sections = await dynamicProfileRepository.findSectionsByType(type.id);
    const [fields, layout] = await Promise.all([
      dynamicProfileRepository.findFieldsBySections(sections.map((s) => s.id)),
      dynamicProfileRepository.findLayout(type.id, "public"),
    ]);

    const fieldsBySection: Record<string, RawProfileField[]> = {};
    for (const field of fields) {
      (fieldsBySection[field.section_id] ??= []).push(field);
    }

    const schema: ProfileSchema = { typeId: type.id, sections, fieldsBySection, layout };
    schemaCache.set(typeSlug, { at: Date.now(), schema });
    return schema;
  },

  /** Drops the cached schema. Call after an admin edits sections or fields. */
  invalidateSchema(typeSlug?: string): void {
    if (typeSlug) schemaCache.delete(typeSlug);
    else schemaCache.clear();
  },

  /** Section definitions with empty values — used by provider.getSections(). */
  async getSectionDefinitions(typeSlug: string): Promise<ProfileSectionDTO[]> {
    const schema = await this.getSchemaBySlug(typeSlug);
    if (!schema) return [];

    return schema.sections.map((section) => ({
      key:             section.key,
      title:           bilingual(section.title_ar, section.title_en, section.title),
      description:     optionalBilingual(section.description_ar, section.description_en),
      kind:            section.kind,
      renderComponent: section.render_component,
      icon:            section.icon,
      displayOrder:    section.display_order,
      fields:          (schema.fieldsBySection[section.id] ?? []).map((f) => toFieldDTO(f, null, false)),
    }));
  },

  /**
   * Sections populated with this profile's values, filtered by viewer.
   * Exactly two queries: schema (cached) + values.
   */
  async getSectionsForProfile(
    profileId: string,
    typeSlug: string,
    viewer: "public" | "authenticated" | "owner",
  ): Promise<ProfileSectionDTO[]> {
    const schema = await this.getSchemaBySlug(typeSlug);
    if (!schema) return [];

    const values = await dynamicProfileRepository.findValuesByProfile(profileId);
    const valueByFieldId = Object.fromEntries(values.map((v) => [v.field_id, v.value]));

    const includeValidation = viewer === "owner";

    return schema.sections
      .filter((section) => isVisible(section.visibility, viewer))
      .map((section) => ({
        key:             section.key,
        title:           bilingual(section.title_ar, section.title_en, section.title),
        description:     optionalBilingual(section.description_ar, section.description_en),
        kind:            section.kind,
        renderComponent: section.render_component,
        icon:            section.icon,
        displayOrder:    section.display_order,
        fields:          (schema.fieldsBySection[section.id] ?? []).map((f) =>
          toFieldDTO(f, valueByFieldId[f.id] ?? null, includeValidation),
        ),
      }));
  },

  async getLayout(typeSlug: string): Promise<ProfileLayoutDTO> {
    const schema = await this.getSchemaBySlug(typeSlug);
    const raw = (schema?.layout?.layout ?? {}) as Record<string, unknown>;

    const asKeys = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

    // Unknown section keys are left in place; the renderer skips them. Dropping
    // them here would hide a config mistake instead of surfacing it.
    return { main: asKeys(raw.main), sidebar: asKeys(raw.sidebar) };
  },

  /**
   * Validates a { sectionKey: { fieldKey: value } } payload against the type's
   * schema. Never throws.
   *
   * Unknown section or field keys are REJECTED — that is the strictness
   * guarantee, and it is what stops a client from writing values for
   * deactivated fields or for another profile type's fields.
   */
  async validate(
    typeSlug: string,
    values: Record<string, Record<string, unknown>>,
  ): Promise<DynamicValidationResult> {
    const schema = await this.getSchemaBySlug(typeSlug);
    const errors: DynamicValidationError[] = [];
    const sanitized: Record<string, Record<string, unknown>> = {};

    if (!schema) {
      return {
        ok: false,
        errors: [{
          sectionKey: "*",
          fieldKey:   "*",
          message:    { ar: "نوع الملف غير معروف", en: "unknown profile type" },
        }],
        sanitized: {},
      };
    }

    const sectionByKey = Object.fromEntries(schema.sections.map((s) => [s.key, s]));

    for (const [sectionKey, fieldValues] of Object.entries(values ?? {})) {
      const section = sectionByKey[sectionKey];

      if (!section) {
        errors.push({
          sectionKey,
          fieldKey: "*",
          message:  { ar: "قسم غير معروف", en: "unknown section" },
        });
        continue;
      }

      // Core sections are backed by typed columns; they can never accept
      // dynamic values.
      if (section.kind === "core") {
        errors.push({
          sectionKey,
          fieldKey: "*",
          message:  { ar: "هذا القسم غير قابل للتعديل هنا", en: "section is not dynamic" },
        });
        continue;
      }

      const fieldByKey = Object.fromEntries(
        (schema.fieldsBySection[section.id] ?? []).map((f) => [f.key, f]),
      );

      for (const [fieldKey, raw] of Object.entries(fieldValues ?? {})) {
        const field = fieldByKey[fieldKey];

        if (!field) {
          errors.push({
            sectionKey,
            fieldKey,
            message: { ar: "حقل غير معروف", en: "unknown field" },
          });
          continue;
        }

        const outcome = validateFieldValue(field, raw);
        if (!outcome.ok) {
          errors.push({
            sectionKey,
            fieldKey,
            message: {
              ar: `قيمة غير صالحة: ${outcome.message}`,
              en: `invalid value: ${outcome.message}`,
            },
          });
          continue;
        }

        (sanitized[sectionKey] ??= {})[fieldKey] = outcome.value;
      }
    }

    return errors.length > 0
      ? { ok: false, errors, sanitized: {} }
      : { ok: true, errors: [], sanitized };
  },

  /**
   * Persists an already-validated payload. Resolves field keys to field ids
   * against the schema, so a caller can never write an arbitrary field_id.
   */
  async saveValues(
    profileId: string,
    typeSlug: string,
    sanitized: Record<string, Record<string, unknown>>,
  ): Promise<void> {
    const schema = await this.getSchemaBySlug(typeSlug);
    if (!schema) return;

    const sectionByKey = Object.fromEntries(schema.sections.map((s) => [s.key, s]));

    const upserts: Array<{ fieldId: string; value: unknown }> = [];
    const deletes: string[] = [];

    for (const [sectionKey, fieldValues] of Object.entries(sanitized ?? {})) {
      const section = sectionByKey[sectionKey];
      if (!section) continue;

      const fieldByKey = Object.fromEntries(
        (schema.fieldsBySection[section.id] ?? []).map((f) => [f.key, f]),
      );

      for (const [fieldKey, value] of Object.entries(fieldValues ?? {})) {
        const field = fieldByKey[fieldKey];
        if (!field) continue;

        // A null clears the value rather than storing a JSON null, so
        // completion scoring stays a simple row-presence check.
        if (value === null) deletes.push(field.id);
        else upserts.push({ fieldId: field.id, value });
      }
    }

    await Promise.all([
      dynamicProfileRepository.upsertValues(profileId, upserts),
      dynamicProfileRepository.deleteValues(profileId, deletes),
    ]);
  },
};

export type DynamicProfileService = typeof dynamicProfileService;
