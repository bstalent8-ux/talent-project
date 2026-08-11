import "server-only";

// ─── DynamicProfileRepository ─────────────────────────────────────────────────
// Owns the Phase 1 tables: profile_sections, profile_fields, profile_values,
// profile_layouts.
//
// Type-agnostic — identical for every profile type. No validation, no
// visibility decisions; those belong to the service and the providers.

import { adminClient } from "@/lib/supabase/admin";
import { fromSupabaseError } from "../errors/profile-error";
import type {
  RawProfileField,
  RawProfileLayout,
  RawProfileSection,
  RawProfileValue,
} from "../types/raw";

const SECTION_COLUMNS =
  "id, profile_type_id, key, title, description, title_ar, title_en, description_ar, description_en, display_order, is_enabled, kind, weight, visibility, render_component, icon, category_scope";

const FIELD_COLUMNS =
  "id, section_id, key, label, label_ar, label_en, placeholder_ar, placeholder_en, help_text_ar, help_text_en, field_type, is_required, validation_schema, options, weight, is_enabled, display_order";

export const dynamicProfileRepository = {
  /**
   * `profileTypeId` is the uuid PK, not the slug.
   *
   * `includeDisabled` defaults to false so the runtime render path is
   * unchanged; the admin config screens pass true.
   */
  async findSectionsByType(
    profileTypeId: string,
    includeDisabled = false,
  ): Promise<RawProfileSection[]> {
    let query = adminClient
      .from("profile_sections")
      .select(SECTION_COLUMNS)
      .eq("profile_type_id", profileTypeId);

    if (!includeDisabled) query = query.eq("is_enabled", true);

    const { data, error } = await query.order("display_order", { ascending: true });

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileSection[]) ?? [];
  },

  /** One query for N sections — never one per section. */
  async findFieldsBySections(
    sectionIds: string[],
    includeDisabled = false,
  ): Promise<RawProfileField[]> {
    if (sectionIds.length === 0) return [];

    let query = adminClient
      .from("profile_fields")
      .select(FIELD_COLUMNS)
      .in("section_id", sectionIds);

    if (!includeDisabled) query = query.eq("is_enabled", true);

    const { data, error } = await query.order("display_order", { ascending: true });

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileField[]) ?? [];
  },

  // ─── Admin config CRUD ──────────────────────────────────────────────────────
  // Used only by profile-config.service.ts. No guards here — the service owns
  // every "is this allowed" decision.

  async findSectionById(sectionId: string): Promise<RawProfileSection | null> {
    const { data, error } = await adminClient
      .from("profile_sections")
      .select(SECTION_COLUMNS)
      .eq("id", sectionId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileSection) ?? null;
  },

  async insertSection(patch: Record<string, unknown>): Promise<RawProfileSection> {
    const { data, error } = await adminClient
      .from("profile_sections")
      .insert(patch)
      .select(SECTION_COLUMNS)
      .single();

    if (error) throw fromSupabaseError(error);
    return data as RawProfileSection;
  },

  async updateSection(sectionId: string, patch: Record<string, unknown>): Promise<RawProfileSection> {
    const { data, error } = await adminClient
      .from("profile_sections")
      .update(patch)
      .eq("id", sectionId)
      .select(SECTION_COLUMNS)
      .single();

    if (error) throw fromSupabaseError(error);
    return data as RawProfileSection;
  },

  async deleteSection(sectionId: string): Promise<void> {
    const { error } = await adminClient.from("profile_sections").delete().eq("id", sectionId);
    if (error) throw fromSupabaseError(error);
  },

  async findFieldById(fieldId: string): Promise<RawProfileField | null> {
    const { data, error } = await adminClient
      .from("profile_fields")
      .select(FIELD_COLUMNS)
      .eq("id", fieldId)
      .maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileField) ?? null;
  },

  async insertField(patch: Record<string, unknown>): Promise<RawProfileField> {
    const { data, error } = await adminClient
      .from("profile_fields")
      .insert(patch)
      .select(FIELD_COLUMNS)
      .single();

    if (error) throw fromSupabaseError(error);
    return data as RawProfileField;
  },

  async updateField(fieldId: string, patch: Record<string, unknown>): Promise<RawProfileField> {
    const { data, error } = await adminClient
      .from("profile_fields")
      .update(patch)
      .eq("id", fieldId)
      .select(FIELD_COLUMNS)
      .single();

    if (error) throw fromSupabaseError(error);
    return data as RawProfileField;
  },

  async deleteField(fieldId: string): Promise<void> {
    const { error } = await adminClient.from("profile_fields").delete().eq("id", fieldId);
    if (error) throw fromSupabaseError(error);
  },

  /**
   * Per-field value counts, for the admin UI's delete / type-change guards.
   *
   * One indexed `head: true` count per field, run in parallel. Fields per
   * section are few (single digits), and counting server-side avoids pulling
   * every profile_values row back just to tally them.
   */
  async countValuesByField(fieldIds: string[]): Promise<Record<string, number>> {
    if (fieldIds.length === 0) return {};

    const entries = await Promise.all(
      fieldIds.map(async (fieldId) => {
        const { count, error } = await adminClient
          .from("profile_values")
          .select("id", { count: "exact", head: true })
          .eq("field_id", fieldId);

        if (error) throw fromSupabaseError(error);
        return [fieldId, count ?? 0] as const;
      }),
    );

    return Object.fromEntries(entries);
  },

  /** Guard input: does this field already hold user data? */
  async countValuesForFields(fieldIds: string[]): Promise<number> {
    if (fieldIds.length === 0) return 0;

    const { count, error } = await adminClient
      .from("profile_values")
      .select("id", { count: "exact", head: true })
      .in("field_id", fieldIds);

    if (error) throw fromSupabaseError(error);
    return count ?? 0;
  },

  /** Batch reorder. One request per table, not one per row. */
  async setSectionOrder(items: Array<{ id: string; display_order: number }>): Promise<void> {
    await Promise.all(
      items.map(async ({ id, display_order }) => {
        const { error } = await adminClient
          .from("profile_sections")
          .update({ display_order })
          .eq("id", id);
        if (error) throw fromSupabaseError(error);
      }),
    );
  },

  async setFieldOrder(items: Array<{ id: string; display_order: number }>): Promise<void> {
    await Promise.all(
      items.map(async ({ id, display_order }) => {
        const { error } = await adminClient
          .from("profile_fields")
          .update({ display_order })
          .eq("id", id);
        if (error) throw fromSupabaseError(error);
      }),
    );
  },

  /**
   * `categoryScope` defaults to `null` (the shared/default layout), so every
   * pre-Sprint-1 caller (profileConfigService.saveLayout, always called
   * without it) keeps writing exactly the same row it always has.
   *
   * Implemented as an explicit find-then-write rather than `.upsert()` with
   * `onConflict`, because the uniqueness guarantee for this table is now an
   * EXPRESSION index (`COALESCE(category_scope, '')`, added in
   * 20260812_04 — a plain `UNIQUE(profile_type_id, variant, category_scope)`
   * would silently allow duplicate shared rows, since SQL NULL <> NULL) and
   * PostgREST's upsert `on_conflict` parameter can only target a plain
   * column-list constraint, not an expression index.
   */
  async upsertLayout(
    profileTypeId: string,
    variant: string,
    layout: Record<string, unknown>,
    isActive = true,
    categoryScope: string | null = null,
  ): Promise<RawProfileLayout> {
    let findQuery = adminClient
      .from("profile_layouts")
      .select("id")
      .eq("profile_type_id", profileTypeId)
      .eq("variant", variant);

    findQuery = categoryScope === null
      ? findQuery.is("category_scope", null)
      : findQuery.eq("category_scope", categoryScope);

    const { data: existing, error: findErr } = await findQuery.maybeSingle();
    if (findErr) throw fromSupabaseError(findErr);

    const patch = {
      profile_type_id: profileTypeId,
      variant,
      layout,
      is_active: isActive,
      category_scope: categoryScope,
    };

    const { data, error } = existing
      ? await adminClient
          .from("profile_layouts")
          .update(patch)
          .eq("id", existing.id)
          .select("id, profile_type_id, variant, layout, is_active, category_scope")
          .single()
      : await adminClient
          .from("profile_layouts")
          .insert(patch)
          .select("id, profile_type_id, variant, layout, is_active, category_scope")
          .single();

    if (error) throw fromSupabaseError(error);
    return data as RawProfileLayout;
  },

  /** One query for every dynamic value on a profile. */
  async findValuesByProfile(profileId: string): Promise<RawProfileValue[]> {
    const { data, error } = await adminClient
      .from("profile_values")
      .select("id, profile_id, field_id, value")
      .eq("profile_id", profileId);

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileValue[]) ?? [];
  },

  /**
   * Batch upsert on the (profile_id, field_id) unique constraint created in
   * 20260806_04. Values arrive already validated and resolved to field ids —
   * this method does not know what a field means.
   */
  async upsertValues(
    profileId: string,
    entries: Array<{ fieldId: string; value: unknown }>,
  ): Promise<void> {
    if (entries.length === 0) return;

    const rows = entries.map((e) => ({
      profile_id: profileId,
      field_id:   e.fieldId,
      value:      e.value,
    }));

    const { error } = await adminClient
      .from("profile_values")
      .upsert(rows, { onConflict: "profile_id,field_id" });

    if (error) throw fromSupabaseError(error);
  },

  async deleteValues(profileId: string, fieldIds: string[]): Promise<void> {
    if (fieldIds.length === 0) return;

    const { error } = await adminClient
      .from("profile_values")
      .delete()
      .eq("profile_id", profileId)
      .in("field_id", fieldIds);

    if (error) throw fromSupabaseError(error);
  },

  /**
   * `includeInactive` defaults to false so the runtime render path only ever
   * sees active layouts; the admin editor passes true so a deactivated layout
   * can still be loaded and edited.
   *
   * ALWAYS returns the shared/default layout (`category_scope IS NULL`),
   * regardless of how many category-specific override rows exist for this
   * (profile_type_id, variant) — explicit on purpose (Sprint 1), so this
   * method's contract ("exactly one shared layout") can never break even
   * after override rows are added. Every pre-Sprint-1 caller
   * (dynamic-profile.service.ts, preview.service.ts, profile-config.service.ts)
   * is unchanged and gets exactly the same row it always has.
   */
  async findLayout(
    profileTypeId: string,
    variant = "public",
    includeInactive = false,
  ): Promise<RawProfileLayout | null> {
    let query = adminClient
      .from("profile_layouts")
      .select("id, profile_type_id, variant, layout, is_active, category_scope")
      .eq("profile_type_id", profileTypeId)
      .eq("variant", variant)
      .is("category_scope", null);

    if (!includeInactive) query = query.eq("is_active", true);

    const { data, error } = await query.maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileLayout) ?? null;
  },

  /**
   * The category-specific override row for a (profile_type_id, variant,
   * category), if one exists. Returns null — never falls back to the shared
   * layout itself — the caller (dynamicProfileService.getLayout) owns the
   * fallback decision.
   */
  async findLayoutOverride(
    profileTypeId: string,
    variant: string,
    category: string,
    includeInactive = false,
  ): Promise<RawProfileLayout | null> {
    let query = adminClient
      .from("profile_layouts")
      .select("id, profile_type_id, variant, layout, is_active, category_scope")
      .eq("profile_type_id", profileTypeId)
      .eq("variant", variant)
      .eq("category_scope", category);

    if (!includeInactive) query = query.eq("is_active", true);

    const { data, error } = await query.maybeSingle();

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileLayout) ?? null;
  },

  /** Every variant for one profile type, active or not. Admin editor only. */
  async findLayoutsByType(profileTypeId: string): Promise<RawProfileLayout[]> {
    const { data, error } = await adminClient
      .from("profile_layouts")
      .select("id, profile_type_id, variant, layout, is_active, category_scope")
      .eq("profile_type_id", profileTypeId);

    if (error) throw fromSupabaseError(error);
    return (data as RawProfileLayout[]) ?? [];
  },
};

export type DynamicProfileRepository = typeof dynamicProfileRepository;
