// ─── Admin profile-config validation ──────────────────────────────────────────
// Server-side Zod schemas for every profile-config mutation.
//
// These mirror the DB constraints from 20260806_01/03/04 exactly, so a bad
// payload is a 400 with useful issues rather than a 500 from PostgREST.
//
// Follows the house pattern already used by app/api/admin/categories,
// /packages and /trusted-brands.

import { z } from "zod";
import { LAYOUT_WIDTHS } from "../content/layout-entries";

// ─── Shared primitives ────────────────────────────────────────────────────────

/** Matches profile_types.slug / profile_sections.key / profile_fields.key CHECKs. */
export const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/;

const slug = z
  .string()
  .trim()
  .min(2)
  .max(48)
  .regex(SLUG_PATTERN, "must be lowercase letters, digits and underscores, starting with a letter");

const bilingualText = z.string().trim().min(1).max(160);
const optionalText  = z.string().trim().max(400).nullable().optional();

/**
 * Sprint 1 (profile-category-foundation), Option A. Structural validation
 * only — matches the DB CHECK in 20260812_03. Semantic validation (is this
 * actually a real, active, talent-role category id) can only happen against
 * the live `categories` table, which a Zod schema cannot query; that check
 * is the DB trigger `validate_profile_section_category_scope` in the same
 * migration. Both layers reject the same bad input for different reasons —
 * this one gives a fast, clean 400 with a useful message; the trigger is
 * the guarantee that holds even if this schema is ever bypassed.
 */
const categoryScope = z
  .array(z.string().trim().min(2).max(48).regex(SLUG_PATTERN, "category id must be lowercase letters, digits and underscores"))
  .min(1)
  .max(8)
  .nullable()
  .optional();

/**
 * Whitelist of section renderers.
 *
 * `profile_sections.render_component` is a KEY into a compile-time React
 * registry, never executable content. Admins pick from this list; free text is
 * rejected. Keep in sync with the renderer registry when Phase 3 of the profile
 * work lands.
 */
export const SECTION_RENDERER_KEYS = [
  // generic dynamic renderers
  "key_value_list",
  "timeline",
  "chip_list",
  "card_grid",
  "stat_grid",
  // core-section renderers
  "hero",
  "about",
  "portfolio",
  "packages",
  "social",
  "availability",
  "usage_rights",
  "attributes",
  "trust",
  "payment",
] as const;

export const SECTION_KINDS      = ["core", "dynamic"] as const;
export const SECTION_VISIBILITY = ["public", "authenticated", "owner", "admin"] as const;
export const FIELD_TYPES        = [
  "text", "number", "boolean", "select", "multi_select", "media", "json",
] as const;

export type SectionRendererKey = (typeof SECTION_RENDERER_KEYS)[number];

// ─── profile_types ────────────────────────────────────────────────────────────

/**
 * Columns an admin may write. `core_table` and `provider_key` are code-owned
 * and absent by design; `slug` is create-only and lives on the create schema.
 */
export const profileTypeUpdateSchema = z.object({
  name:         bilingualText,
  name_ar:      bilingualText.nullable().optional(),
  name_en:      bilingualText.nullable().optional(),
  description:  optionalText,
  route_prefix: slug.nullable().optional(),
  is_active:    z.boolean().optional(),
  is_bookable:  z.boolean().optional(),
  sort_order:   z.coerce.number().int().min(0).max(9999).optional(),
});

export const profileTypeCreateSchema = profileTypeUpdateSchema.extend({
  slug,
});

/** Toggle payload, matching the { action: "set_active" } idiom in admin/categories. */
export const setActiveSchema = z.object({
  action:    z.literal("set_active"),
  is_active: z.boolean(),
});

// ─── profile_sections ─────────────────────────────────────────────────────────

const sectionCommon = {
  title:            bilingualText,
  title_ar:         bilingualText.nullable().optional(),
  title_en:         bilingualText.nullable().optional(),
  description:      optionalText,
  description_ar:   optionalText,
  description_en:   optionalText,
  weight:           z.coerce.number().int().min(0).max(100).default(0),
  visibility:       z.enum(SECTION_VISIBILITY).default("public"),
  render_component: z.enum(SECTION_RENDERER_KEYS).nullable().optional(),
  icon:             z.string().trim().max(48).nullable().optional(),
  display_order:    z.coerce.number().int().min(0).max(9999).default(0),
  is_enabled:       z.boolean().default(true),
  category_scope:   categoryScope,
};

/**
 * `kind` is fixed to "dynamic" on create.
 *
 * A core section only means something when matching provider code evaluates it
 * (provider.getCompletion keys off section.key). A core section created from the
 * UI would score false forever, so creating one is not offered.
 */
export const sectionCreateSchema = z.object({
  key: slug,
  ...sectionCommon,
});

/** `key` and `kind` are immutable after creation and are absent here. */
export const sectionUpdateSchema = z.object(sectionCommon);

// ─── profile_fields ───────────────────────────────────────────────────────────

const fieldOption = z.object({
  value:    z.string().trim().min(1).max(80),
  label_ar: z.string().trim().max(120).optional(),
  label_en: z.string().trim().max(120).optional(),
});

/**
 * Constraint bag consumed by buildFieldSchema(). Kept strict: an unknown key
 * silently does nothing at runtime, which is worse than a 400 here.
 */
const validationBag = z
  .object({
    minLength: z.coerce.number().int().min(0).max(10000).optional(),
    maxLength: z.coerce.number().int().min(1).max(10000).optional(),
    pattern:   z.string().trim().max(200).optional(),
    min:       z.coerce.number().optional(),
    max:       z.coerce.number().optional(),
    step:      z.coerce.number().optional(),
    maxItems:  z.coerce.number().int().min(1).max(100).optional(),
    accept:    z.string().trim().max(80).optional(),
  })
  .strict()
  .default({});

const fieldCommon = {
  label:             bilingualText,
  label_ar:          bilingualText.nullable().optional(),
  label_en:          bilingualText.nullable().optional(),
  placeholder_ar:    optionalText,
  placeholder_en:    optionalText,
  help_text_ar:      optionalText,
  help_text_en:      optionalText,
  is_required:       z.boolean().default(false),
  validation_schema: validationBag,
  options:           z.array(fieldOption).max(60).default([]),
  weight:            z.coerce.number().int().min(0).max(100).default(1),
  display_order:     z.coerce.number().int().min(0).max(9999).default(0),
  is_enabled:        z.boolean().default(true),
};

/**
 * select / multi_select are meaningless without choices, and the DB enforces it
 * with the profile_fields_options_required CHECK. Rejecting here turns a 500
 * into a readable 400.
 */
function requireOptionsForChoiceTypes<T extends { field_type?: string; options?: unknown[] }>(
  data: T,
  ctx: z.RefinementCtx,
) {
  const needsOptions = data.field_type === "select" || data.field_type === "multi_select";
  if (needsOptions && (!data.options || data.options.length === 0)) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: "select and multi_select require at least one option",
    });
  }
}

export const fieldCreateSchema = z
  .object({
    key:        slug,
    field_type: z.enum(FIELD_TYPES),
    ...fieldCommon,
  })
  .superRefine(requireOptionsForChoiceTypes);

/**
 * `key` is immutable. `field_type` is present because it MAY change — but only
 * while the field has no stored values; that guard lives in the service, since
 * it needs a DB read.
 */
export const fieldUpdateSchema = z
  .object({
    field_type: z.enum(FIELD_TYPES),
    ...fieldCommon,
  })
  .superRefine(requireOptionsForChoiceTypes);

// ─── Reorder (batch) ──────────────────────────────────────────────────────────

/**
 * Batch, not N single PATCHes: moving one item shifts several rows, and N edge
 * round trips is the wrong shape.
 */
export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        id:            z.string().uuid(),
        display_order: z.coerce.number().int().min(0).max(9999),
      }),
    )
    .min(1)
    .max(200),
});

// ─── profile_layouts ──────────────────────────────────────────────────────────

/**
 * Ordering + placement only — arrays of profile_sections.key, each optionally
 * paired with a closed-enum width. No markup, no components, no free-text
 * CSS. Cross-checking the keys against real, enabled sections needs a DB read
 * and happens in the service.
 *
 * A slot entry accepts EITHER a plain key string (legacy shape, width
 * defaults to "full") OR a `{ key, width }` object — mirrors
 * features/profiles/content/layout-entries.ts exactly, so a layout saved
 * through this schema and one read back through dynamicProfileService.getLayout
 * agree on every entry.
 */
const layoutEntry = z.union([
  slug,
  z.object({ key: slug, width: z.enum(LAYOUT_WIDTHS).default("full") }),
]);

export const layoutSchema = z.object({
  variant: z.enum(["public", "edit", "card"]).default("public"),
  /** A deactivated layout is ignored by the renderer, which falls back to
   *  profile_sections.display_order. */
  is_active: z.boolean().default(true),
  layout: z.object({
    main:    z.array(layoutEntry).max(60).default([]),
    sidebar: z.array(layoutEntry).max(60).default([]),
  }),
});

export const LAYOUT_VARIANTS = ["public", "edit", "card"] as const;
export type LayoutVariant = (typeof LAYOUT_VARIANTS)[number];

export { LAYOUT_WIDTHS } from "../content/layout-entries";
export type { LayoutWidth } from "../content/layout-entries";

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ProfileTypeCreateInput = z.infer<typeof profileTypeCreateSchema>;
export type ProfileTypeUpdateInput = z.infer<typeof profileTypeUpdateSchema>;
export type SectionCreateInput     = z.infer<typeof sectionCreateSchema>;
export type SectionUpdateInput     = z.infer<typeof sectionUpdateSchema>;
export type FieldCreateInput       = z.infer<typeof fieldCreateSchema>;
export type FieldUpdateInput       = z.infer<typeof fieldUpdateSchema>;
export type ReorderInput           = z.infer<typeof reorderSchema>;
export type LayoutInput            = z.infer<typeof layoutSchema>;
