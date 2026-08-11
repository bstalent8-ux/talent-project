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
import { normalizeLayoutArray } from "../content/layout-entries";
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

// Sprint 1 (profile-category-foundation): category-specific layout overrides
// are cached separately from the per-type schema above — they're a
// different lookup (findLayoutOverride, not findLayout) and there can be
// many of them per type (one per category), unlike the single shared
// layout the schema cache already holds. Empty (no override row yet) is
// cached too, as `null`, so a category with no override doesn't re-query on
// every request.
interface LayoutOverrideCacheEntry {
  at:     number;
  layout: RawProfileLayout | null;
}
const layoutOverrideCache = new Map<string, LayoutOverrideCacheEntry>();

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

/**
 * Sprint 1 (profile-category-foundation), Option A's core rule: NULL/empty
 * category_scope = shared by every category of this profile_type (true for
 * every section today). A non-empty scope is visible only to a profile
 * whose own category is in it. `category` is the VIEWED profile's category
 * (null for brand, or a talent with no category set yet) — a scoped section
 * never shows to a category-less viewer, since it can't know which scope
 * would apply.
 */
function matchesCategory(sectionScope: string[] | null, category: string | null): boolean {
  if (!sectionScope || sectionScope.length === 0) return true;
  if (!category) return false;
  return sectionScope.includes(category);
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
    if (typeSlug) {
      schemaCache.delete(typeSlug);
      for (const key of layoutOverrideCache.keys()) {
        if (key.startsWith(`${typeSlug}:`)) layoutOverrideCache.delete(key);
      }
    } else {
      schemaCache.clear();
      layoutOverrideCache.clear();
    }
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
   * Sections populated with this profile's values, filtered by viewer AND
   * (Sprint 1) by category. Exactly two queries: schema (cached) + values.
   *
   * `category` is the viewed profile's talent_profiles.category (null for
   * brand, or a talent with none set). Filtering happens HERE — the same
   * place visibility is already filtered — never in a component, per the
   * audit's §6 instruction to keep category logic in the resolution layer,
   * not scattered through presentation code.
   */
  async getSectionsForProfile(
    profileId: string,
    typeSlug: string,
    viewer: "public" | "authenticated" | "owner",
    category: string | null = null,
  ): Promise<ProfileSectionDTO[]> {
    const schema = await this.getSchemaBySlug(typeSlug);
    if (!schema) return [];

    const values = await dynamicProfileRepository.findValuesByProfile(profileId);
    const valueByFieldId = Object.fromEntries(values.map((v) => [v.field_id, v.value]));

    const includeValidation = viewer === "owner";

    return schema.sections
      .filter((section) => isVisible(section.visibility, viewer))
      .filter((section) => matchesCategory(section.category_scope, category))
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

  /**
   * `category` (Sprint 1): when given and an active override layout exists
   * for it, the override wins; otherwise falls back to the shared layout —
   * "shared Talent layout + optional category-specific override" from the
   * audit's §15.5. The shared layout (via the cached schema) is always
   * fetched regardless, both because it's already cached and because it's
   * the fallback target.
   */
  async getLayout(typeSlug: string, category: string | null = null): Promise<ProfileLayoutDTO> {
    const schema = await this.getSchemaBySlug(typeSlug);
    let raw = (schema?.layout?.layout ?? {}) as Record<string, unknown>;

    if (category && schema) {
      const override = await this.getLayoutOverride(schema.typeId, "public", category);
      if (override?.layout) raw = override.layout as Record<string, unknown>;
    }

    // Unknown section keys are left in place; the renderer skips them. Dropping
    // them here would hide a config mistake instead of surfacing it. Each
    // entry is normalized to { key, width } regardless of whether the stored
    // row used the legacy plain-string shape or the Stage 1 object shape —
    // see features/profiles/content/layout-entries.ts.
    return { main: normalizeLayoutArray(raw.main), sidebar: normalizeLayoutArray(raw.sidebar) };
  },

  /** Cached lookup for a category-specific layout override. Null = none exists (cached too, so a category with no override doesn't re-query every request). */
  async getLayoutOverride(
    profileTypeId: string,
    variant: string,
    category: string,
  ): Promise<RawProfileLayout | null> {
    const cacheKey = `${profileTypeId}:${variant}:${category}`;
    const hit = layoutOverrideCache.get(cacheKey);
    if (hit && Date.now() - hit.at < SCHEMA_TTL_MS) return hit.layout;

    const layout = await dynamicProfileRepository.findLayoutOverride(profileTypeId, variant, category);
    layoutOverrideCache.set(cacheKey, { at: Date.now(), layout });
    return layout;
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
